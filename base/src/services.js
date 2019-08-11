//@ts-check
const fetch = require('node-fetch').default;
const marketConverter = require('./serializers/market');
const promotionsConverter = require('./serializers/promotions');
const algoliasearch = require('algoliasearch');
require('dotenv').config();

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

  for (let page = firstPage; page < totalPages; page++) {
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

async function updateSearchIndex(programs) {
  const algolia = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_API_KEY
  );

  const index = algolia.initIndex(process.env.ALGOLIA_INDEX_NAME);

  const records = programs.map(program => {
    return {
      ...program,
      objectID: program.id
    };
  });

  try {
    await index.saveObjects(records);
  } catch (e) {
    console.log(`Failed to update the search index: ${e}`);
  }

  console.log(`${records.length} records added to the search index`);
}

async function get2PPromotions(authData, programId) {
  const perPage = 30;

  let promotionData = await get2PPromotionDataForPage(authData, 1, perPage);
  let promotions = promotionData.promotions.filter(
    p => p.programId === programId
  );

  const totalPages = promotionData.metadata.pagination.pages;
  const firstPage = promotionData.metadata.pagination.current_page;

  if (firstPage === totalPages) {
    return promotions;
  }

  for (let page = firstPage; page < totalPages; page++) {
    promotionData = await get2PPromotionDataForPage(authData, page, perPage);
    const pagePromotions = promotionData.promotions.filter(
      p => p.programId === programId
    );
    promotions = promotions.concat(pagePromotions);
  }

  return promotions;
}

async function get2PPromotionDataForPage(authData, page, perPage) {
  const url = `https://api.2performant.com/affiliate/advertiser_promotions?filter[affrequest_status]=accepted&page=${page}&perpage=${perPage}`;
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

  return promotionsConverter.toPromotions(respBody, '2p');
}

async function search(query, exact = false) {
  const algolia = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_API_KEY_SEARCH
  );

  const index = algolia.initIndex(process.env.ALGOLIA_INDEX_NAME);
  const result = await index.search({
    query: query,
    typoTolerance: !exact
  });

  return result.hits;
}

module.exports = {
  get2PAuthHeaders,
  get2PPrograms,
  updateSearchIndex,
  get2PPromotions,
  search
};
