const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const deliveryBoySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
  },
  vehicleType: {
    type: String,
    required: [true, 'Please provide vehicle type'],
    enum: ['Bicycle', 'Motorcycle', 'Car', 'Van'],
  },
  vehicleNumber: {
    type: String,
    required: [true, 'Please provide vehicle number'],
  },
  licenseNumber: {
    type: String,
    required: [true, 'Please provide license number'],
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  profileImage: {
    type: String,
    default: '',
  },
  idProof: {
    type: String,
    required: [true, 'Please provide ID proof'],
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  rating: {
    type: Number,
    default: 5,
    min: 0,
    max: 5,
  },
  totalDeliveries: {
    type: Number,
    default: 0,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date,
  },
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '21:00' },
  },
  serviceAreas: [{
    city: String,
    pincode: String,
    radius: Number, // in km
  }],
  stats: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    averageDeliveryTime: { type: Number, default: 0 }, // in minutes
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
deliveryBoySchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
deliveryBoySchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('DeliveryBoy', deliveryBoySchema);
