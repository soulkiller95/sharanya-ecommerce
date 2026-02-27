const express = require('express');
const jwt = require('jsonwebtoken');
const Merchant = require('../models/Merchant');
const Product = require('../models/Product');
const Order = require('../models/Order');
const multer = require('multer');
const path = require('path');
const { protect, authorizeType } = require('../middleware/auth');

const router = express.Router();

// apply auth middleware to all routes defined after this comment (registration/login are before)
router.use(protect, authorizeType('merchant'));

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id, type: 'merchant' }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Merchant Registration
router.post('/register', upload.single('logo'), async (req, res) => {
  try {
    const {
      businessName,
      ownerName,
      email,
      password,
      confirmPassword,
      phone,
      businessType,
      description,
      address,
      businessLicense,
      bankDetails
    } = req.body;

    // Validation
    if (!businessName || !ownerName || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // Check if merchant exists
    const existingMerchant = await Merchant.findOne({ email });
    if (existingMerchant) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Parse address and bank details
    let parsedAddress, parsedBankDetails;
    try {
      parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
      parsedBankDetails = typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails;
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Invalid address or bank details format' });
    }

    // Create merchant
    const merchantData = {
      businessName,
      ownerName,
      email,
      password,
      phone,
      businessType,
      description,
      address: parsedAddress,
      businessLicense,
      bankDetails: parsedBankDetails
    };

    if (req.file) {
      merchantData.logo = `/uploads/${req.file.filename}`;
    }

    const merchant = await Merchant.create(merchantData);
    const token = generateToken(merchant._id);

    res.status(201).json({
      success: true,
      token,
      merchant: {
        id: merchant._id,
        businessName: merchant.businessName,
        ownerName: merchant.ownerName,
        email: merchant.email,
        phone: merchant.phone,
        businessType: merchant.businessType,
        isVerified: merchant.isVerified,
      },
    });
  } catch (error) {
    console.error('Merchant registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Merchant Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check if merchant exists
    const merchant = await Merchant.findOne({ email }).select('+password');
    if (!merchant) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await merchant.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(merchant._id);

    res.status(200).json({
      success: true,
      token,
      merchant: {
        id: merchant._id,
        businessName: merchant.businessName,
        ownerName: merchant.ownerName,
        email: merchant.email,
        phone: merchant.phone,
        businessType: merchant.businessType,
        isVerified: merchant.isVerified,
        isActive: merchant.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current merchant
router.get('/me', async (req, res) => {
  res.status(200).json({ success: true, merchant: req.currentUser });
});

// Get Merchant Products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ merchant: req.currentUser._id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add Product (Merchant)
router.post('/products', upload.array('images', 5), async (req, res) => {
  try {
    const productData = JSON.parse(req.body.productData);
    productData.merchant = req.currentUser._id;

    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => `/uploads/${file.filename}`);
      if (req.files.length > 0) {
        productData.image = productData.images[0];
      }
    }

    const product = await Product.create(productData);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Product (Merchant)
router.put('/products/:id', upload.array('images', 5), async (req, res) => {
  try {
    let productData = {};
    if (req.body.productData) {
      productData = JSON.parse(req.body.productData);
    }

    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => `/uploads/${file.filename}`);
      if (req.files.length > 0) {
        productData.image = productData.images[0];
      }
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, merchant: req.currentUser._id },
      productData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Product (Merchant)
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      merchant: req.currentUser._id
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Merchant Orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({ 'items.merchant': req.currentUser._id })
      .populate('customer', 'name email phone')
      .populate('items.product', 'name image price')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Order Status (Merchant)
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findOne({ 
      _id: req.params.id,
      'items.merchant': req.currentUser._id
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    // Validate status transitions
    const validTransitions = {
      'Pending': ['Confirmed', 'Cancelled'],
      'Confirmed': ['Preparing', 'Cancelled'],
      'Preparing': ['Ready', 'Cancelled'],
      'Ready': ['Out for Delivery'],
      'Out for Delivery': ['Delivered'],
      'Delivered': [],
      'Cancelled': []
    };

    if (!validTransitions[order.orderStatus].includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' });
    }

    order.orderStatus = orderStatus;
    order.tracking.push({
      status: orderStatus,
      timestamp: new Date(),
      note: `Order status updated to ${orderStatus} by merchant`,
    });

    await order.save();
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Merchant Dashboard Stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ merchant: req.currentUser._id });
    const activeProducts = await Product.countDocuments({ 
      merchant: req.currentUser._id, 
      status: 'Active' 
    });
    
    const orders = await Order.find({ 'items.merchant': req.currentUser._id });
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.orderStatus === 'Pending').length;
    const completedOrders = orders.filter(order => order.orderStatus === 'Delivered').length;
    
    const totalRevenue = orders
      .filter(order => order.orderStatus === 'Delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
