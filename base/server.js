const express = require('express');
const bearerToken = require('express-bearer-token');
const helmet = require('helmet');
const cors = require('cors');
const router = require('./routes');
const midlewares = require('./src/middleware');

const app = express();

const corsOptions = {
  origin: '*',
}

app.use(cors(corsOptions));
app.use(helmet());
app.use(bearerToken());
app.use(midlewares.jwtAuthenticate);

app.use(router);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
