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
 */
async function searchProducts(query, fields = ['title']) {
  try {
    const { body } = await elastic.search({
      index: process.env.INDEX_PRODUCTS,
      body: {
        from: 0,
        size: 50,
        query: {
          multi_match: {
            query,
            fields,
          },
        },
      },
    });

    return body.hits;
  } catch (e) {
    console.log(e.body);
  }
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
        from: 0,
        size: 50,
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
    console.log(e.body);
  }
}

module.exports = {
  searchPrograms,
  searchProducts,
};
