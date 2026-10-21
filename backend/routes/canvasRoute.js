const express = require('express');
const { getAllCanvases, createCanvas, deleteCanvas, loadCanvas, updateCanvas, shareCanvas } = require('../controllers/canvasController');
const authenticationMiddleware = require('../middlewares/authenticationMiddleware');
const router = express.Router();

router.get('/', authenticationMiddleware, getAllCanvases);
router.post('/', authenticationMiddleware, createCanvas);
router.post('/share', authenticationMiddleware, shareCanvas);
router.patch('/update', authenticationMiddleware, updateCanvas);
router.get('/load/:id', authenticationMiddleware, loadCanvas)
router.delete('/:canvasId', authenticationMiddleware, deleteCanvas);
module.exports = router;