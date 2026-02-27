const express = require('express');
const Merchant = require('../models/Merchant');
const DeliveryBoy = require('../models/DeliveryBoy');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorizeType } = require('../middleware/auth');

const router = express.Router();

// Admin authentication - user with admin role
router.use(protect, authorizeType('user', 'admin'));
router.use((req, res, next) => {
  if (req.userType !== 'admin' && req.currentUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admins can access this resource' });
  }
  next();
});

// ========== MERCHANT MANAGEMENT ==========

// Get all merchants
router.get('/merchants', async (req, res) => {
  try {
    const { search = '', status = 'all', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'verified') {
      query.isVerified = true;
    } else if (status === 'unverified') {
      query.isVerified = false;
    } else if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const total = await Merchant.countDocuments(query);
    const merchants = await Merchant.find(query)
      .select('-password')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      merchants,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get merchant details
router.get('/merchants/:id', async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.params.id)
      .select('-password')
      .populate('products', 'name image price');

    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    const products = await Product.countDocuments({ merchant: merchant._id });
    const orders = await Order.countDocuments({ 'items.merchant': merchant._id });

    res.status(200).json({
      success: true,
      merchant: {
        ...merchant.toObject(),
        productsCount: products,
        ordersCount: orders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update merchant
router.put('/merchants/:id', async (req, res) => {
  try {
    const { isVerified, isActive, commissionRate } = req.body;
    const updateData = {};

    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;

    const merchant = await Merchant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    res.status(200).json({ success: true, merchant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete merchant (soft delete - deactivate)
router.delete('/merchants/:id', async (req, res) => {
  try {
    const merchant = await Merchant.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    res.status(200).json({ success: true, message: 'Merchant deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DELIVERY BOY MANAGEMENT ==========

// Get all delivery boys
router.get('/delivery-boys', async (req, res) => {
  try {
    const { search = '', status = 'all', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'verified') {
      query.isVerified = true;
    } else if (status === 'unverified') {
      query.isVerified = false;
    } else if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'online') {
      query.isOnline = true;
    } else if (status === 'offline') {
      query.isOnline = false;
    }

    const total = await DeliveryBoy.countDocuments(query);
    const deliveryBoys = await DeliveryBoy.find(query)
      .select('-password')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      deliveryBoys,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get delivery boy details
router.get('/delivery-boys/:id', async (req, res) => {
  try {
    const delivery = await DeliveryBoy.findById(req.params.id).select('-password');

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }

    const deliveries = await Order.countDocuments({ deliveryBoy: delivery._id });

    res.status(200).json({
      success: true,
      delivery: {
        ...delivery.toObject(),
        deliveriesCount: deliveries,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update delivery boy
router.put('/delivery-boys/:id', async (req, res) => {
  try {
    const { isVerified, isActive, isAvailable } = req.body;
    const updateData = {};

    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    const delivery = await DeliveryBoy.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }

    res.status(200).json({ success: true, delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete delivery boy (soft delete)
router.delete('/delivery-boys/:id', async (req, res) => {
  try {
    const delivery = await DeliveryBoy.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }

    res.status(200).json({ success: true, message: 'Delivery boy deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DASHBOARD STATS ==========

// Get admin dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalMerchants = await Merchant.countDocuments();
    const verifiedMerchants = await Merchant.countDocuments({ isVerified: true });
    const totalDeliveryBoys = await DeliveryBoy.countDocuments();
    const verifiedDeliveryBoys = await DeliveryBoy.countDocuments({ isVerified: true });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Revenue calculation
    const orders = await Order.find({ paymentStatus: 'Paid' }).select('totalAmount');
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalMerchants,
        verifiedMerchants,
        activeMerchants: await Merchant.countDocuments({ isActive: true }),
        totalDeliveryBoys,
        verifiedDeliveryBoys,
        activeDeliveryBoys: await DeliveryBoy.countDocuments({ isActive: true }),
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders: await Order.countDocuments({ orderStatus: 'Pending' }),
        deliveredOrders: await Order.countDocuments({ orderStatus: 'Delivered' }),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
