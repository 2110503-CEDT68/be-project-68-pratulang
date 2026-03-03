const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

// @desc    Get all hotels
// @route   GET /api/v1/hotels
// @access  Public
exports.getHotels = async (req, res, next) => {
  try {
    let query;

    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];

    removeFields.forEach(param => delete reqQuery[param]);

    if (reqQuery.name) {
      reqQuery.name = { $regex: reqQuery.name, $options: 'i' };
    }

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g,
      match => `$${match}`);

    query = Hotel.find(JSON.parse(queryStr)).populate('bookings');

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
    const total = await Hotel.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    const hotels = await query;

    const pagination = {};

    if (endIndex < total) {
      pagination.next = { page: page + 1, limit }
    }

    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit }
    }

    res.status(200).json({
      success: true,
      count: hotels.length,
      total,
      pagination,
      data: hotels
    });
  } catch (err) {
    res.status(400).json({
      success: false
    });
  }
};

// @desc    Get single hotel
// @route   GET /api/v1/hotels/:id
// @access  Public
exports.getHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(400).json({ success: false });
    }

    res.status(200).json({ success: true, data: hotel });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};


// @desc    Create new hotel
// @route   POST /api/v1/hotels
// @access  Private/Admin
exports.createHotel = async (req, res, next) => {
  // FIX: allow new fields district, province, postalcode via req.body
  const hotel = await Hotel.create(req.body);

  res.status(201).json({
    success: true,
    data: hotel
  });
};


// @desc    Update hotel
// @route   PUT /api/v1/hotels/:id
// @access  Private/Admin
exports.updateHotel = async (req, res, next) => {
  try {
    // FIX: update operation should accept changed fields including district/province/postalcode
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!hotel) {
      return res.status(400).json({ success: false });
    }

    res.status(200).json({ success: true, data: hotel });

  } catch (err) {

    res.status(400).json({ success: false });

  }
};


// @desc    Delete hotel
// @route   DELETE /api/v1/hotels/:id
// @access  Private/Admin
exports.deleteHotel = async (req, res, next) => {
  try {

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `Hotel not found with id of ${req.params.id}`
      });
    }

    await Booking.deleteMany({ hotel: req.params.id });
    await Hotel.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, data: {} });

  } catch (err) {

    res.status(400).json({ success: false });

  }
};
