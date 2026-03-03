const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name can not be more than 50 characters']
  },

  address: {
    type: String,
    required: [true, 'Please add an address']
  },

  tel: {
    type: String,
    required: [true, 'Please add a telephone number']
  },

  // FIX: new field with trim and required validation
  district: {
    type: String,
    required: [true, 'Please add a district'],
    trim: true
  },

  // FIX: new field with trim and required validation
  province: {
    type: String,
    required: [true, 'Please add a province'],
    trim: true
  },

  // FIX: optional postalcode with maxlength and trim
  postalcode: {
    type: String,
    maxlength: [5, 'Postal code can not be more than 5 characters'],
    trim: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
},

{
  toJSON:{virtuals:true},
  toObject:{virtuals:true}
}
);

//Reverse populate with virtual
HotelSchema.virtual('bookings',{
  ref:'Booking',
  localField:'_id',
  foreignField:'hotel',
  justOne:false
});

module.exports = mongoose.model('Hotel', HotelSchema);
