const express = require('express');
const router  = express.Router();
const { upload, uploadFile, getFiles, deleteFile } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/upload',   upload.single('file'), uploadFile);
router.get('/',          getFiles);
router.delete('/:id',    deleteFile);

module.exports = router;
