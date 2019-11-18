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
async function searchPrograms(query, exact = false) {
  let queryOperator = 'prefix';
  if (exact) {
    queryOperator = 'term';
  }

  return search(process.env.INDEX_PROGRAMS, query, queryOperator, 'name');
}

/**
 * Search the programs index based on the provied query (simple search term)
 * @param {String} query
 * @param {Boolean} exact
 */
async function searchProducts(query, exact = false) {
  let queryOperator = 'prefix';
  if (exact) {
    queryOperator = 'term';
  }

  return search(process.env.INDEX_PRODUCTS, query, queryOperator, 'title');
}

/**
 * Search the programs index based on the provied query (simple search term)
 * @param {String} index
 * @param {String} query
 * @param {String} queryOperator
 * @param {String} field
 */
async function search(index, query, queryOperator, field) {
  try {
    const { body } = await elastic.search({
      index,
      body: {
        query: {
          [queryOperator]: {
            [field]: {
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
  searchPrograms,
  searchProducts,
};
