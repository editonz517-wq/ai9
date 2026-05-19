const express = require('express');
const router  = express.Router();
const { getSchedule, createEvent, updateEvent, deleteEvent } = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/',       getSchedule);
router.post('/',      createEvent);
router.put('/:id',    updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
