const admin = require('firebase-admin');
const firebaseKeys = require('../CharityDiscount.json');
const jwtDecode = require('jwt-decode');

admin.initializeApp({
  credential: admin.credential.cert(firebaseKeys),
  databaseURL: 'https://charitydiscount.firebaseio.com'
});

/**
 * Authentication middleware based on the firebase auth jwt.
 */
exports.jwtAuthenticate = (req, res, next) => {
  if (!req.token) {
    return res.sendStatus(401);
  }
  try {
    if (jwtDecode(req.token).email === process.env.SERVICE_ACCOUNT) {
      next();
      return;
    }
  } catch (e) {
    res.sendStatus(401);
    return;
  }
  admin
    .auth()
    .verifyIdToken(req.token)
    .then(() => next())
    .catch(() => res.sendStatus(401));
};
