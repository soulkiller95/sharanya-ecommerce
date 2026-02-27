const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const merchantSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: [true, 'Please provide a business name'],
    trim: true,
  },
  ownerName: {
    type: String,
    required: [true, 'Please provide owner name'],
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
  },
  businessType: {
    type: String,
    required: [true, 'Please provide business type'],
    enum: ['Electronics', 'Clothing', 'Food', 'Books', 'Sports', 'Beauty', 'Home', 'Toys', 'Other'],
  },
  description: {
    type: String,
    required: [true, 'Please provide business description'],
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
  businessLicense: {
    type: String,
    required: [true, 'Please provide business license number'],
  },
  logo: {
    type: String,
    default: '',
  },
  banner: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    default: 5,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  commissionRate: {
    type: Number,
    default: 10, // 10% commission
    min: 0,
    max: 30,
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
  },
  settings: {
    autoAcceptOrders: { type: Boolean, default: false },
    deliveryRadius: { type: Number, default: 10 }, // km
    minOrderAmount: { type: Number, default: 0 },
    freeDeliveryAbove: { type: Number, default: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
merchantSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
merchantSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Merchant', merchantSchema);
