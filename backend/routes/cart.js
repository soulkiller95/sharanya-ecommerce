const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get user's cart
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add to cart
router.post('/add', protect, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, quantity, price: product.price }],
      });
    } else {
      const existingItem = cart.items.find(item => item.product.toString() === productId);

      if (existingItem) {
        existingItem.quantity += parseInt(quantity);
      } else {
        cart.items.push({ product: productId, quantity, price: product.price });
      }
    }

    // Calculate totals
    let totalPrice = 0;
    let totalItems = 0;

    for (let item of cart.items) {
      const prod = await Product.findById(item.product);
      totalPrice += prod.price * item.quantity;
      totalItems += item.quantity;
    }

    cart.totalPrice = totalPrice;
    cart.totalItems = totalItems;
    await cart.save();

    await cart.populate('items.product');

    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove from cart
router.post('/remove/:productId', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);

    // Recalculate totals
    let totalPrice = 0;
    let totalItems = 0;

    for (let item of cart.items) {
      const product = await Product.findById(item.product);
      totalPrice += product.price * item.quantity;
      totalItems += item.quantity;
    }

    cart.totalPrice = totalPrice;
    cart.totalItems = totalItems;
    await cart.save();

    await cart.populate('items.product');

    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update cart item quantity
router.post('/update/:productId', protect, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(req.params.productId);
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const cartItem = cart.items.find(item => item.product.toString() === req.params.productId);
    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cartItem.quantity = quantity;

    // Recalculate totals
    let totalPrice = 0;
    let totalItems = 0;

    for (let item of cart.items) {
      const prod = await Product.findById(item.product);
      totalPrice += prod.price * item.quantity;
      totalItems += item.quantity;
    }

    cart.totalPrice = totalPrice;
    cart.totalItems = totalItems;
    await cart.save();

    await cart.populate('items.product');

    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear cart
router.post('/clear', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = [];
    cart.totalPrice = 0;
    cart.totalItems = 0;
    await cart.save();

    res.status(200).json({ success: true, message: 'Cart cleared', cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
