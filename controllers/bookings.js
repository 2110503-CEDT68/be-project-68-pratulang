const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

//@desc GET all bookings
//@route GET api/v1/bookings
//@access Private
exports.getBookings = async (req, res, next) => {
  let query;

  const baseFilter = {};
  if (req.user.role != 'admin') {
    baseFilter.user = req.user.id;
  }
  else if (req.params.hotelId) {
    baseFilter.hotel = req.params.hotelId;
  }

  const reqQuery = { ...req.query };
  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach(param => delete reqQuery[param]);

  if (baseFilter.hotel) {
    delete reqQuery.hotel;
  }
  if (req.user.role != 'admin') {
    delete reqQuery.user;
  }

  let queryStr = JSON.stringify({ ...baseFilter, ...reqQuery });
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g,
    match => `$${match}`);

  query = Booking.find(JSON.parse(queryStr)).populate({
    path: 'hotel',
    select: 'name address tel'
  });

  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  if (req.query.sort) {
    const fields = req.query.sort.split(',').join(' ');
    query = query.sort(fields);
  }
  else {
    query = query.sort('-createdAt');
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Booking.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  try {
    const bookings = await query;
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pagination,
      data: bookings
    });
  }
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot find Booking"
    });
  }
};

//@desc     Get single booking
//@route    GET /api/v1/bookings/:id
//@access   Private
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'hotel',
      select: 'name address tel'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  }
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot find Booking"
    });
  }
};

//@desc     Add booking
//@route    POST /api/v1/hotels/:hotelId/bookings
//@access   Private
exports.addBooking = async (req, res, next) => {
  try {
    //add hotel to req body
    req.body.hotel = req.params.hotelId;

    //add user id to req body
    req.body.user = req.user.id;

    //requested nights should not exceed 3 by itself
    const requestedNights = req.body.numberOfNights || 0;
    if (requestedNights > 3 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'A single booking cannot exceed 3 nights.'
      });
    }

    //Check for existing bookings
    const existedBookings = await Booking.find({ user: req.user.id });

    //Calculate total nights already booked
    let totalNights = 0;
    for (const b of existedBookings) {
      totalNights += b.numberOfNights;
    }

    //If the user is not an admin, they can only book up to 3 nights total
    if (req.user.role !== 'admin' && totalNights + requestedNights > 3) {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${req.user.id} has already booked ${totalNights} nights; cannot exceed 3 nights total.`
      });
    }

    const hotel = await Hotel.findById(req.params.hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `No hotel with the id of ${req.params.hotelId}`
      });
    }

    const booking = await Booking.create(req.body);

    res.status(200).json({
      success: true,
      data: booking
    });
  }
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: `Cannot create Booking`
    });
  }
};

//@desc     Update booking
//@router   PUT /api/v1/bookings/:id
//@access   Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`
      });
    }

    //Make sure user is the booking owner
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this booking`
      });
    }

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body, {
      new: true,
      runValidators: true
    }
    );

    res.status(200).json({
      success: true,
      data: booking
    });
  }
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: `Cannot update Booking`
    });
  }
};

//@desc     Delete booking
//@route    DELETE /api/v1/bookings/:id
//@access   Private
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`
      });
    }

    //Make sure user is the booking owner
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this booking`
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  }
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: `Cannot delete Booking`
    });
  }
};
