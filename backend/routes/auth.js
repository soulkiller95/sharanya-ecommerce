const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const DeliveryBoy = require('../models/DeliveryBoy');
const { protect, authorizeType } = require('../middleware/auth');
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
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

// Generate JWT Token with type support
const generateToken = (id, type = 'user') => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ========== USER AUTHENTICATION ==========

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone = '', address = {} } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address: typeof address === 'string' ? JSON.parse(address || '{}') : address,
    });

    const token = generateToken(user._id, 'user');

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, 'user');

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== MERCHANT AUTHENTICATION ==========

// Merchant Registration
router.post('/merchant/register', upload.single('logo'), async (req, res) => {
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
    if (!businessName || !ownerName || !email || !password || !confirmPassword || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if merchant exists
    const existingMerchant = await Merchant.findOne({ email });
    if (existingMerchant) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Parse address and bank details safely
    const parsedAddress = (address && typeof address === 'string') ? (() => { try { return JSON.parse(address); } catch(e) { return null; } })() : address;
    const parsedBankDetails = (bankDetails && typeof bankDetails === 'string') ? (() => { try { return JSON.parse(bankDetails); } catch(e) { return null; } })() : bankDetails;

    // Create merchant with defaults for all optional/required fields
    const merchantData = {
      businessName,
      ownerName,
      email,
      password,
      phone,
      businessType: businessType || 'Other',
      description: description || `${businessName} Store`,
      address: parsedAddress || {
        street: 'Main Street',
        city: 'City',
        state: 'State',
        zip: '000000',
        country: 'Country'
      },
      businessLicense: businessLicense || 'BL-' + Math.random().toString(36).substr(2, 9),
      bankDetails: parsedBankDetails || {
        accountName: ownerName,
        accountNumber: 'XXXXXXXXXXXXXX',
        bankName: 'Bank Name',
        ifscCode: 'IFSC0000001'
      },
    };

    if (req.file) {
      merchantData.logo = `/uploads/${req.file.filename}`;
    }

    const merchant = await Merchant.create(merchantData);
    const token = generateToken(merchant._id, 'merchant');

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
router.post('/merchant/login', async (req, res) => {
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

    const token = generateToken(merchant._id, 'merchant');

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

// ========== DELIVERY BOY AUTHENTICATION ==========

// Delivery Boy Registration
router.post('/delivery/register', upload.single('profileImage'), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      address,
      idProof
    } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword || !phone || !vehicleType) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if delivery boy exists
    const existingDelivery = await DeliveryBoy.findOne({ email });
    if (existingDelivery) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Parse address safely
    const parsedAddress = (address && typeof address === 'string') ? (() => { try { return JSON.parse(address); } catch(e) { return null; } })() : address;

    // Create delivery boy with defaults
    const deliveryData = {
      name,
      email,
      password,
      phone,
      vehicleType,
      vehicleNumber: vehicleNumber || 'VEH-' + Math.random().toString(36).substr(2, 8),
      licenseNumber: licenseNumber || 'LIC-' + Math.random().toString(36).substr(2, 8),
      address: parsedAddress || {
        street: 'Main Street',
        city: 'City',
        state: 'State',
        zip: '000000',
        country: 'Country'
      },
      idProof: idProof || 'ID-' + Math.random().toString(36).substr(2, 8),
    };

    if (req.file) {
      deliveryData.profileImage = `/uploads/${req.file.filename}`;
    }

    const delivery = await DeliveryBoy.create(deliveryData);
    const token = generateToken(delivery._id, 'delivery');

    res.status(201).json({
      success: true,
      token,
      delivery: {
        id: delivery._id,
        name: delivery.name,
        email: delivery.email,
        phone: delivery.phone,
        vehicleType: delivery.vehicleType,
        isVerified: delivery.isVerified,
      },
    });
  } catch (error) {
    console.error('Delivery registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delivery Boy Login
router.post('/delivery/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check if delivery exists
    const delivery = await DeliveryBoy.findOne({ email }).select('+password');
    if (!delivery) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await delivery.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(delivery._id, 'delivery');

    res.status(200).json({
      success: true,
      token,
      delivery: {
        id: delivery._id,
        name: delivery.name,
        email: delivery.email,
        phone: delivery.phone,
        vehicleType: delivery.vehicleType,
        isVerified: delivery.isVerified,
        isActive: delivery.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GENERAL ENDPOINTS ==========

// Get Current User (Works for all user types)
router.get('/me', protect, async (req, res) => {
  try {
    res.status(200).json({ 
      success: true, 
      user: req.currentUser,
      userType: req.userType
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
