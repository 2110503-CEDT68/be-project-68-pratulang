const express = require('express');

const {
    getBookings,
    getBooking,
    addBooking,
    updateBooking,
    deleteBooking
} = require('../controllers/bookings');

//mergeParams = allows this router to see params from parent route
const router = express.Router({ mergeParams: true });

router.route('/')
    .get(getBookings)
    .post(addBooking);
router.route('/:id')
    .get(getBooking)
    .put(updateBooking)
    .delete(deleteBooking);

module.exports = router;
