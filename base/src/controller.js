//@ts-check
const services = require('./services');
const firestore = require('./firestore');

async function searchPrograms(req, res) {
  const hits = await services.searchPrograms(
    req.query.query,
    req.query.exact || false
  );
  res.json(hits);
}

async function searchProducts(req, res) {
  const hits = await services.searchProducts(
    req.query.query,
    req.query.exact || false
  );
  res.json(hits);
}

async function copyCollection(req, res) {
  await firestore.copyCollection('transactions', 'requests');
  res.sendStatus(200);
}

module.exports = { searchPrograms, searchProducts, copyCollection };
