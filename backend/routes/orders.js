const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect, authorize, authorizeType } = require('../middleware/auth');

const router = express.Router();

// Generate unique order number
const generateOrderNumber = () => {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

// ========== USER ROUTES (Customers) ==========

// Create order from cart
router.post('/', protect, authorizeType('user'), async (req, res) => {
  try {
    const { shippingAddress, billingAddress, paymentMethod = 'COD', deliveryInstructions = '' } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    const cart = await Cart.findOne({ user: req.currentUser._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Calculate totals
    let subtotal = 0;
    const items = [];

    for (let item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.product._id} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = item.quantity * item.product.price;
      subtotal += itemTotal;

      items.push({
        product: item.product._id,
        merchant: item.product.merchant,
        quantity: item.quantity,
        price: item.product.price,
        total: itemTotal,
      });
    }

    const tax = Math.round(subtotal * 0.05); // 5% tax
    const deliveryFee = subtotal > 500 ? 0 : 50; // Free delivery for orders > 500
    const totalAmount = subtotal + tax + deliveryFee;

    // Create order
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customer: req.currentUser._id,
      items,
      shippingAddress: typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress,
      billingAddress: billingAddress ? (typeof billingAddress === 'string' ? JSON.parse(billingAddress) : billingAddress) : (typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress),
      subtotal,
      tax,
      deliveryFee,
      totalAmount,
      paymentMethod,
      deliveryInstructions,
      orderStatus: 'Pending',
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending',
      tracking: [{
        status: 'Pending',
        timestamp: new Date(),
        note: 'Order placed successfully',
      }],
    });

    // Update product stock
    for (let item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity, sold: item.quantity } }
      );
    }

    // Clear cart
    await Cart.findByIdAndUpdate(cart._id, {
      items: [],
      totalPrice: 0,
      totalItems: 0,
    });

    res.status(201).json({ success: true, message: 'Order created successfully', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's orders
router.get('/user/my-orders', protect, authorizeType('user'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let query = { customer: req.currentUser._id };

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('items.product', 'name image price')
      .populate('items.merchant', 'businessName')
      .populate('deliveryBoy', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single order details (customer)
router.get('/user/:id', protect, authorizeType('user'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('items.product', 'name image description')
      .populate('items.merchant', 'businessName address phone logo')
      .populate('deliveryBoy', 'name phone email profileImage');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization
    if (order.customer._id.toString() !== req.currentUser._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel order (customer)
router.post('/user/:id/cancel', protect, authorizeType('user'), async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization
    if (order.customer.toString() !== req.currentUser._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    // Can only cancel pending or confirmed orders
    if (!['Pending', 'Confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: `Cannot cancel order with status ${order.orderStatus}` });
    }

    order.orderStatus = 'Cancelled';
    order.tracking.push({
      status: 'Cancelled',
      timestamp: new Date(),
      note: `Order cancelled by customer: ${reason || 'No reason provided'}`,
    });

    // Restore product stock
    for (let item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity, sold: -item.quantity } }
      );
    }

    await order.save();

    res.status(200).json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== MERCHANT ROUTES ==========

// Get merchant's orders
router.get('/merchant/my-orders', protect, authorizeType('merchant'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let query = { 'items.merchant': req.currentUser._id };

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'name phone email address')
      .populate('items.product', 'name image')
      .populate('deliveryBoy', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order status (merchant)
router.put('/merchant/:id/status', protect, authorizeType('merchant'), async (req, res) => {
  try {
    const { orderStatus, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if merchant has products in this order
    const hasMerchantItems = order.items.some(item => item.merchant.toString() === req.currentUser._id.toString());
    if (!hasMerchantItems) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    // Validate transitions for merchants
    const validTransitions = {
      'Pending': ['Confirmed', 'Cancelled'],
      'Confirmed': ['Preparing', 'Cancelled'],
      'Preparing': ['Ready'],
      'Ready': [],
      'Out for Delivery': [],
      'Delivered': [],
      'Cancelled': []
    };

    if (!validTransitions[order.orderStatus].includes(orderStatus)) {
      return res.status(400).json({ success: false, message: `Cannot transition from ${order.orderStatus} to ${orderStatus}` });
    }

    order.orderStatus = orderStatus;
    order.tracking.push({
      status: orderStatus,
      timestamp: new Date(),
      note: note || `Merchant updated order to ${orderStatus}`,
    });

    if (orderStatus === 'Ready') {
      order.packedAt = new Date();
    }

    await order.save();

    res.status(200).json({ success: true, message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ADMIN ROUTES ==========

// Get all orders (Admin)
router.get('/admin/all', protect, authorizeType('user'), async (req, res) => {
  try {
    // Check if user has admin role
    if (req.currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can access this' });
    }

    const { page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('items.merchant', 'businessName')
      .populate('deliveryBoy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get order details (Admin)
router.get('/admin/:id', protect, authorizeType('user'), async (req, res) => {
  try {
    if (req.currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can access this' });
    }

    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name image price')
      .populate('items.merchant', 'businessName email')
      .populate('deliveryBoy', 'name phone email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order status (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus, paymentStatus, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete order (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
