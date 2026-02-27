const express = require('express');
const jwt = require('jsonwebtoken');
const DeliveryBoy = require('../models/DeliveryBoy');
const Order = require('../models/Order');
const multer = require('multer');
const path = require('path');
const { protect, authorizeType } = require('../middleware/auth');

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
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = /jpeg|jpg|png|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image and PDF files are allowed'));
  }
});

// Generate JWT Token for delivery user
const generateToken = (id) => jwt.sign({ id, type: 'delivery' }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Public routes
router.post('/register', upload.single('profileImage'), async (req, res) => {
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

    if (!name || !email || !password || !confirmPassword || !phone || !vehicleType) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }
    if (password !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const existingEmail = await DeliveryBoy.findOne({ email });
    if (existingEmail) return res.status(400).json({ success: false, message: 'Email already registered' });
    const existingPhone = await DeliveryBoy.findOne({ phone });
    if (existingPhone) return res.status(400).json({ success: false, message: 'Phone number already registered' });

    let parsedAddress = address;
    if (typeof address === 'string') {
      try { parsedAddress = JSON.parse(address); } catch (err) { return res.status(400).json({ success: false, message: 'Invalid address format' }); }
    }

    const deliveryBoyData = {
      name,
      email,
      password,
      phone,
      vehicleType,
      vehicleNumber: vehicleNumber || 'N/A',
      licenseNumber: licenseNumber || 'N/A',
      address: parsedAddress,
      idProof: idProof || 'N/A'
    };

    if (req.file) deliveryBoyData.profileImage = `/uploads/${req.file.filename}`;

    const deliveryBoy = await DeliveryBoy.create(deliveryBoyData);
    const token = generateToken(deliveryBoy._id);

    res.status(201).json({ success: true, token, deliveryBoy: { id: deliveryBoy._id, name: deliveryBoy.name, email: deliveryBoy.email, phone: deliveryBoy.phone, vehicleType: deliveryBoy.vehicleType } });
  } catch (error) {
    console.error('Delivery registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const deliveryBoy = await DeliveryBoy.findOne({ email }).select('+password');
    if (!deliveryBoy) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await deliveryBoy.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = generateToken(deliveryBoy._id);
    res.status(200).json({ success: true, token, deliveryBoy: { id: deliveryBoy._id, name: deliveryBoy.name, email: deliveryBoy.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Protected routes for delivery users
router.use(protect, authorizeType('delivery'));

router.get('/me', (req, res) => res.status(200).json({ success: true, deliveryBoy: req.currentUser }));

router.get('/orders/available', async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const query = { orderStatus: 'Ready', deliveryBoy: { $exists: false } };
    if (status === 'urgent') query.priority = 'high';

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).populate('customer', 'name phone email address').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.status(200).json({ success: true, total, pages: Math.ceil(total / limit), currentPage: parseInt(page), orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/orders/my-deliveries', async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const query = { deliveryBoy: req.currentUser._id };
    if (status && status !== 'all') query.orderStatus = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.status(200).json({ success: true, total, pages: Math.ceil(total / limit), currentPage: parseInt(page), orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/orders/:id/accept', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, orderStatus: 'Ready', deliveryBoy: { $exists: false } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not available for delivery' });

    order.deliveryBoy = req.currentUser._id;
    order.orderStatus = 'Out for Delivery';
    if (!order.tracking) order.tracking = [];
    order.tracking.push({ status: 'Out for Delivery', timestamp: new Date(), note: 'Assigned to delivery boy' });
    await order.save();

    await DeliveryBoy.findByIdAndUpdate(req.currentUser._id, { $inc: { totalDeliveries: 1 }, $set: { isAvailable: false } });
    res.status(200).json({ success: true, message: 'Order accepted successfully', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/orders/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, orderStatus: 'Ready', deliveryBoy: { $exists: false } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not available' });

    if (!order.tracking) order.tracking = [];
    order.tracking.push({ status: 'Rejected', timestamp: new Date(), note: `Rejected by delivery boy: ${reason || 'No reason provided'}` });
    await order.save();
    res.status(200).json({ success: true, message: 'Order rejected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { orderStatus, location, note } = req.body;
    const order = await Order.findOne({ _id: req.params.id, deliveryBoy: req.currentUser._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });

    const validTransitions = { 'Out for Delivery': ['Delivered', 'Cancelled'], 'Delivered': [], 'Cancelled': [] };
    if (order.orderStatus && !validTransitions[order.orderStatus].includes(orderStatus)) return res.status(400).json({ success: false, message: 'Invalid status transition' });

    order.orderStatus = orderStatus;
    if (!order.tracking) order.tracking = [];
    const trackingEntry = { status: orderStatus, timestamp: new Date(), note: note || `Order status updated to ${orderStatus}` };
    if (location) trackingEntry.location = location;
    order.tracking.push(trackingEntry);

    if (orderStatus === 'Delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'Paid';
      await DeliveryBoy.findByIdAndUpdate(req.currentUser._id, { $inc: { totalDeliveries: 1, totalEarnings: order.deliveryFee || 50 }, $set: { isAvailable: true } });
    } else if (orderStatus === 'Cancelled') {
      await DeliveryBoy.findByIdAndUpdate(req.currentUser._id, { $set: { isAvailable: true } });
    }

    await order.save();
    res.status(200).json({ success: true, message: 'Status updated successfully', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null) return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    await DeliveryBoy.findByIdAndUpdate(req.currentUser._id, { currentLocation: { lat: parseFloat(lat), lng: parseFloat(lng), updatedAt: new Date() } });
    res.status(200).json({ success: true, message: 'Location updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/status', async (req, res) => {
  try {
    const { isOnline, isAvailable } = req.body;
    const updateData = {};
    if (typeof isOnline === 'boolean') updateData.isOnline = isOnline;
    if (typeof isAvailable === 'boolean') updateData.isAvailable = isAvailable;
    const delivery = await DeliveryBoy.findByIdAndUpdate(req.currentUser._id, updateData, { new: true });
    res.status(200).json({ success: true, message: 'Status updated successfully', delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const orders = await Order.find({ deliveryBoy: req.currentUser._id });
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.orderStatus === 'Delivered').length;
    const cancelledOrders = orders.filter(o => o.orderStatus === 'Cancelled').length;
    const db = await DeliveryBoy.findById(req.currentUser._id).select('totalEarnings');
    const availableOrders = await Order.countDocuments({ orderStatus: 'Ready', deliveryBoy: { $exists: false } });
    res.status(200).json({ success: true, stats: { totalOrders, completedOrders, cancelledOrders, totalEarnings: (db && db.totalEarnings) || 0, availableOrders } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
