const express = require('express');
const { getHotels, getHotel, createHotel, updateHotel, deleteHotel } = require('../controllers/hotels');

//include other resource routers
const bookingRouter = require('./bookings');

const router = express.Router();

//Re-route into other resource routers
router.use('/:hotelId/bookings/', bookingRouter);

const {protect, authorize} = require('../middleware/auth');

router.route('/')
    .get(getHotels)
    .post(protect, authorize('admin'), createHotel);

//By id
router.route('/:id')
    .get(getHotel)
    .put(protect, authorize('admin'), updateHotel)
    .delete(protect, authorize('admin'), deleteHotel);

module.exports = router;
