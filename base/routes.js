const router = require('express').Router();
const controller = require('./src/controller');

router.get('/search', controller.search);
router.put('/_infra/copy-collection', controller.copyCollection);

module.exports = router;
