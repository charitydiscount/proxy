const router = require('express').Router();
const controller = require('./src/controller');

router.get('/search', controller.searchPrograms);
router.get('/search/programs', controller.searchPrograms);
router.get('/search/products', controller.searchProducts);
router.get('/search/products/featured', controller.getFeaturedProducts);
// router.put('/_infra/copy-collection', controller.copyCollection);

module.exports = router;
