//@ts-check
const services = require('./services');
const firestore = require('./firestore');

/**
 * Retrieve the 2performant authentication information
 */
async function auth(req, res) {
  const authData = await services.get2PAuthHeaders();
  if (!authData) {
    return res.sendStatus(401);
  }

  res.setHeader('access-token', authData.accessToken);
  res.setHeader('client', authData.client);
  res.setHeader('uid', authData.uid);
  res.setHeader('token-type', authData.tokenType);
  res.setHeader('unique-id', authData.uniqueCode);

  return res.send();
}

/**
 * Update the affiliate programs in firestore
 */
async function updatePrograms(req, res) {
  const auth = await services.get2PAuthHeaders();
  if (!auth) {
    console.log('Failed 2p auth');
    return res.sendStatus(401);
  }
  const programs = await services.get2PPrograms(auth);
  programs.sort((p1, p2) => p1.name.localeCompare(p2.name));
  const uniquePrograms = programs.filter(
    (p, index, array) => !index || p.id != array[index - 1].id
  );

  const updateResult = await firestore.updatePrograms(uniquePrograms);
  if (updateResult !== 0) {
    return res.sendStatus(500);
  }
  const metricsResult = await firestore.updateMeta(auth, uniquePrograms);
  if (metricsResult !== 0) {
    return res.sendStatus(500);
  }

  await services.updateSearchIndex(uniquePrograms);

  res.sendStatus(200);
}

async function search(req, res) {
  const hits = await services.search(req.query.query, req.query.exact || false);
  res.json(hits);
}

async function copyCollection(req, res) {
  await firestore.copyCollection('transactions', 'requests');
  res.sendStatus(200);
}

module.exports = { auth, updatePrograms, search, copyCollection };
