const express = require('express');
const { getHotels, getHotel, createHotel, updateHotel, deleteHotel } = require('../controllers/hotels');

//include other resource routers
const bookingRouter = require('./bookings');

const router = express.Router();

//Re-route into other resource routers
router.use('/:hotelId/bookings/', bookingRouter);

router.route('/')
    .get(getHotels)
    .post(createHotel);
router.route('/:id')
    .get(getHotel)
    .put(updateHotel)
    .delete(deleteHotel);

module.exports = router;
