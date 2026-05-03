const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/movieController');

router.get('/',      ctrl.index);
router.get('/stats', ctrl.statsPage);

router.get('/api/movies',              ctrl.apiGetAll);
router.get('/api/movies/:id',          ctrl.apiGetOne);
router.post('/api/movies',             ctrl.apiCreate);
router.put('/api/movies/:id',          ctrl.apiUpdate);
router.post('/api/movies/:id/rate',    ctrl.apiRate);
router.delete('/api/movies/:id',       ctrl.apiDelete);
router.get('/api/stats',               ctrl.apiStats);

module.exports = router;
