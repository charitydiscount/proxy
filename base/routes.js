const router = require('express').Router();
const controller = require('./src/controller');

// router.get('/2p-auth', controller.auth);

router.put('/programs', controller.updatePrograms);
router.get('/search', controller.search);

module.exports = router;
