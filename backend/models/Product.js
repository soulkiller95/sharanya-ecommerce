const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['Clothes', 'Footwear', 'Jewelry', 'Perfume', 'Cosmetics', 'Watches', 'Glasses', 'Bags', 'Sports', 'Winter wear'],
  },
  subcategory: String,
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  rating: {
    type: Number,
    default: 5,
    min: 0,
    max: 5,
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rating: Number,
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  image: String,
  images: [String],
  stock: {
    type: Number,
    required: [true, 'Please provide stock'],
    default: 0,
  },
  sold: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  trending: {
    type: Boolean,
    default: false,
  },
  tags: [String],
  // Add merchant reference
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true,
  },
  // Product specifications
  specifications: {
    brand: String,
    model: String,
    color: [String],
    size: [String],
    weight: String,
    dimensions: String,
    material: String,
    warranty: String,
  },
  // SEO and marketing
  slug: {
    type: String,
    unique: true,
    sparse: true,
  },
  metaTitle: String,
  metaDescription: String,
  // Inventory management
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  trackInventory: {
    type: Boolean,
    default: true,
  },
  allowBackorder: {
    type: Boolean,
    default: false,
  },
  // Shipping
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    freeShipping: {
      type: Boolean,
      default: false,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
  },
  // Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Draft', 'Archived'],
    default: 'Active',
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

// Generate slug before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
  this.updatedAt = Date.now();
  next();
});

// Generate SKU before saving
productSchema.pre('save', function(next) {
  if (this.isNew && !this.sku) {
    const categoryCode = this.category ? this.category.substring(0, 3).toUpperCase() : 'GEN';
    const randomNum = Math.floor(Math.random() * 10000);
    this.sku = `${categoryCode}-${randomNum}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
