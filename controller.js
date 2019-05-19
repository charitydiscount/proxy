const services = require('./services');
const firestore = require('./firestore');

/**
 * Retrieve the 2performant authentication information
 */
function auth(req, res) {
  services.get2PAuthHeaders().then(authData => {
    if (!authData) {
      return res.sendStatus(401);
    }

    res.setHeader('access-token', authData.accessToken);
    res.setHeader('client', authData.client);
    res.setHeader('uid', authData.uid);
    res.setHeader('token-type', authData.tokenType);
    res.setHeader('unique-id', authData.uniqueCode);

    return res.send();
  });
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

  const updateResult = await firestore.updatePrograms(programs);
  if (updateResult !== 0) {
    return res.sendStatus(500);
  }
  const metricsResult = await firestore.updateMetrics(programs);
  if (metricsResult !== 0) {
    return res.sendStatus(500);
  }

  res.sendStatus(200);
}

module.exports = { auth, updatePrograms };
