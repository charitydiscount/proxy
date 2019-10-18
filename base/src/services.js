//@ts-check
const { Client } = require('@elastic/elasticsearch');

require('dotenv').config();

const elastic = new Client({
  node: process.env.ENDPOINT,
  auth: {
    username: process.env.ELASTIC_USER,
    password: process.env.ELASTIC_PASS,
  },
});

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
              value: query,
            },
          },
        },
      },
    });

    return body.hits;
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  search,
};
