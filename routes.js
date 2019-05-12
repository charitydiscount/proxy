const router = require('express').Router();
const controller = require('./controller');

router.get('/2p-auth', controller.auth);

router.put('/programs', controller.updatePrograms);

module.exports = router;
