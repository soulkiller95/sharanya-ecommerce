const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
  }],
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
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
  billingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending',
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Card', 'UPI', 'Wallet'],
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  deliveryFee: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  deliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryBoy',
  },
  deliveryInstructions: {
    type: String,
  },
  estimatedDeliveryTime: {
    type: Date,
  },
  actualDeliveryTime: {
    type: Date,
  },
  tracking: [{
    status: {
      type: String,
      enum: ['Order Placed', 'Order Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: String,
    location: {
      lat: Number,
      lng: Number,
    },
  }],
  notes: {
    type: String,
  },
  rating: {
    customerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    deliveryRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    merchantRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: String,
  },
  cancellationReason: {
    type: String,
  },
  cancelledBy: {
    type: String,
    enum: ['Customer', 'Merchant', 'Delivery Boy', 'Admin'],
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
  }
  this.updatedAt = Date.now();
  next();
});

// Add initial tracking entry
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.tracking.push({
      status: 'Order Placed',
      timestamp: new Date(),
      note: 'Order has been placed successfully',
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
