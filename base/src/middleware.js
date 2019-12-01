const admin = require('firebase-admin');
const cors = require('cors');
const firebaseKeys = require('../CharityDiscount.json');

admin.initializeApp({
  credential: admin.credential.cert(firebaseKeys),
  databaseURL: 'https://charitydiscount.firebaseio.com',
});

/**
 * Authentication middleware based on the firebase auth jwt.
 */
exports.jwtAuthenticate = (req, res, next) => {
  if (!req.token) {
    return res.sendStatus(401);
  }
  admin
    .auth()
    .verifyIdToken(req.token)
    .then(() => {
      req.isServiceAccount = true;
      next();
    })
    .catch(() => res.sendStatus(401));
};

const allowedOrigins = [
  'http://localhost:3000',
  'https://charitydiscount.ro',
  'https://charitydiscount.github.io'
];
const corsOptions = {
  optionsSuccessStatus: 200,
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    else {
      const msg = 'The CORS policy for this site does not ' +
        'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
}

exports.cors = cors(corsOptions);
