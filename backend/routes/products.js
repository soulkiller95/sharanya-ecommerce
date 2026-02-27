const express = require('express');
const Product = require('../models/Product');
const { protect, authorize, authorizeType } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ========== PUBLIC ROUTES ==========

// Get all products with filtering and merchant info
router.get('/', async (req, res) => {
  try {
    const { category, merchant, search, sort, page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (category) {
      query.category = category;
    }

    if (merchant) {
      query.merchant = merchant;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let sortBy = {};
    if (sort) {
      if (sort === 'price-low') sortBy.price = 1;
      if (sort === 'price-high') sortBy.price = -1;
      if (sort === 'newest') sortBy.createdAt = -1;
      if (sort === 'rating') sortBy.rating = -1;
      if (sort === 'trending') sortBy.trending = -1;
    } else {
      sortBy.createdAt = -1;
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('merchant', 'businessName logo rating')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments({ category: req.params.category });
    const products = await Product.find({ category: req.params.category })
      .populate('merchant', 'businessName logo rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single product with merchant details
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('merchant', 'businessName logo rating address phone email')
      .populate('reviews.user', 'name email');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get featured products
router.get('/featured/products', async (req, res) => {
  try {
    const products = await Product.find({ featured: true })
      .populate('merchant', 'businessName logo rating')
      .limit(12);
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get trending products
router.get('/trending/all', async (req, res) => {
  try {
    const products = await Product.find({ trending: true })
      .populate('merchant', 'businessName logo rating')
      .limit(12);
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== MERCHANT ROUTES (Protected) ==========

// Get merchant products
router.get('/merchant/my-products', protect, authorizeType('merchant'), async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { merchant: req.currentUser._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add product (Merchant only)
router.post('/merchant/add-product', protect, authorizeType('merchant'), upload.array('images', 5), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      price,
      originalPrice,
      discount,
      stock,
      specifications,
      tags,
      sku,
    } = req.body;

    // Validation
    if (!name || !description || !category || !price || stock === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const productData = {
      name,
      description,
      category,
      subcategory: subcategory || '',
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price),
      discount: discount || 0,
      stock: parseInt(stock),
      merchant: req.currentUser._id,
      sku: sku || `SKU-${Date.now()}`,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      specifications: specifications ? (typeof specifications === 'string' ? JSON.parse(specifications) : specifications) : {},
    };

    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => `/uploads/${file.filename}`);
      productData.image = productData.images[0];
    }

    const product = await Product.create(productData);
    res.status(201).json({ success: true, message: 'Product added successfully', product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update product (Merchant only)
router.put('/merchant/update-product/:id', protect, authorizeType('merchant'), upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if merchant owns this product
    if (product.merchant.toString() !== req.currentUser._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    const {
      name,
      description,
      category,
      price,
      originalPrice,
      discount,
      stock,
      specifications,
      tags,
    } = req.body;

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (price) product.price = parseFloat(price);
    if (originalPrice) product.originalPrice = parseFloat(originalPrice);
    if (discount !== undefined) product.discount = discount;
    if (stock !== undefined) product.stock = parseInt(stock);
    if (specifications) product.specifications = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
    if (tags) product.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;

    // Handle image updates
    if (req.files && req.files.length > 0) {
      product.images = req.files.map(file => `/uploads/${file.filename}`);
      product.image = product.images[0];
    }

    await product.save();

    res.status(200).json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete product (Merchant only)
router.delete('/merchant/delete-product/:id', protect, authorizeType('merchant'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if merchant owns this product
    if (product.merchant.toString() !== req.currentUser._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== REVIEW ROUTES ==========

// Add review to product
router.post('/:id/reviews', protect, authorizeType('user'), async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide rating and comment' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const review = {
      user: req.currentUser._id,
      rating: parseInt(rating),
      comment,
      createdAt: new Date(),
    };

    product.reviews.push(review);
    product.rating = (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1);
    await product.save();

    res.status(201).json({ success: true, message: 'Review added successfully', product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
