const express = require('express');
const router  = express.Router();
const { getNotes, createNote, generateNote, updateNote, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/',           getNotes);
router.post('/',          createNote);
router.post('/generate',  generateNote);
router.put('/:id',        updateNote);
router.delete('/:id',     deleteNote);

module.exports = router;
