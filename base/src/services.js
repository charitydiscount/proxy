//@ts-check
const fetch = require('node-fetch').default;
const marketConverter = require('./serializers/market');
const { Client } = require('@elastic/elasticsearch');

require('dotenv').config();

const elastic = new Client({
  node: 'http://35.240.61.9/elasticsearch',
  auth: {
    username: process.env.ELASTIC_USER,
    password: process.env.ELASTIC_PASS
  }
});

let authHeaders;

/**
 * Retrieve the 2Performant authentication data
 */
async function get2PAuthHeaders() {
  if (authHeaders) {
    return authHeaders;
  }

  const reqHeaders = { 'Content-Type': 'application/json' };
  const reqBody = {
    user: { email: process.env.TWOP_EMAIL, password: process.env.TWOP_PASS }
  };

  const twoPResponse = await fetch(
    'https://api.2performant.com/users/sign_in',
    {
      method: 'post',
      headers: reqHeaders,
      body: JSON.stringify(reqBody)
    }
  );

  if (!twoPResponse.ok) {
    return null;
  }

  const resBody = await twoPResponse.json();

  authHeaders = {
    accessToken: twoPResponse.headers.get('access-token'),
    client: twoPResponse.headers.get('client'),
    uid: twoPResponse.headers.get('uid'),
    tokenType: twoPResponse.headers.get('token-type'),
    uniqueCode: resBody.user.unique_code
  };
  return authHeaders;
}

/**
 * Get the 2Performant affiliate programs
 * @param {Object} auth
 */
async function get2PPrograms(auth) {
  const perPage = 200;
  let market = await get2PProgramsForPage(auth, 1, perPage);
  let programs = market.programs;

  const totalPages = market.metadata.pagination.pages;
  const firstPage = market.metadata.pagination.current_page;

  if (firstPage === totalPages) {
    return programs;
  }

  for (let page = firstPage; page <= totalPages; page++) {
    market = await get2PProgramsForPage(auth, page, perPage);
    programs = programs.concat(market.programs);
  }

  return programs;
}

async function get2PProgramsForPage(authData, page, perPage) {
  const url = `https://api.2performant.com/affiliate/programs?filter[relation]=accepted&page=${page}&perpage=${perPage}`;
  const headers = {
    'access-token': authData.accessToken,
    client: authData.client,
    uid: authData.uid,
    'token-type': authData.tokenType,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
  const twoPResponse = await fetch(url, {
    method: 'get',
    headers
  });

  const respBody = await twoPResponse.json();

  return marketConverter.toMarket(respBody, '2p');
}

/**
 * Update the search index with the provided programs (overrides existing index)
 * @param {Array} programs
 */
async function updateSearchIndex(programs) {
  const flatMap = (f, arr) => arr.reduce((x, y) => [...x, ...f(y)], []);
  const bulkBody = flatMap(
    program => [
      { index: { _index: process.env.INDEX_PROGRAMS, _id: program.id } },
      program
    ],
    programs
  );

  try {
    const { body: bulkResponse } = await elastic.bulk({
      // @ts-ignore
      refresh: true,
      body: bulkBody
    });

    if (bulkResponse.errors) {
      const erroredDocuments = [];
      bulkResponse.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: bulkBody[i * 2],
            document: bulkBody[i * 2 + 1]
          });
        }
      });
      console.log(erroredDocuments);
    }
  } catch (e) {
    console.log(e);
    return;
  }

  const { body: count } = await elastic.count({
    index: process.env.INDEX_PROGRAMS
  });
  console.log(count);
}

/**
 * Search the programs index based on the provied query (simple search term)
 * @param {String} query
 * @param {Boolean} exact
 */
async function search(query, exact = false) {
  let queryOperator = 'prefix';
  if (exact) {
    queryOperator = 'term';
  }
  try {
    const { body } = await elastic.search({
      index: process.env.INDEX_PROGRAMS,
      body: {
        query: {
          [queryOperator]: {
            name: {
              value: query
            }
          }
        }
      }
    });

    return body.hits;
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  get2PAuthHeaders,
  get2PPrograms,
  updateSearchIndex,
  search
};
