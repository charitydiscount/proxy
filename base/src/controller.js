//@ts-check
const services = require('./services');
const firestore = require('./firestore');

async function search(req, res) {
  const hits = await services.search(req.query.query, req.query.exact || false);
  res.json(hits);
}

async function copyCollection(req, res) {
  await firestore.copyCollection('transactions', 'requests');
  res.sendStatus(200);
}

module.exports = { search, copyCollection };
