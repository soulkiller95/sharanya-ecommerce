'use strict';

console.log('ecommerce.js loaded');

// ============= API Configuration =============
const API_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('authToken');

// ============= UI Variables =============
const modal = document.querySelector('[data-modal]');
const modalCloseBtn = document.querySelector('[data-modal-close]');
const modalCloseOverlay = document.querySelector('[data-modal-overlay]');
const notificationToast = document.querySelector('[data-toast]');
const toastCloseBtn = document.querySelector('[data-toast-close]');

const mobileMenuOpenBtn = document.querySelectorAll('[data-mobile-menu-open-btn]');
const mobileMenu = document.querySelectorAll('[data-mobile-menu]');
const mobileMenuCloseBtn = document.querySelectorAll('[data-mobile-menu-close-btn]');
const overlay = document.querySelector('[data-overlay]');

const accordionBtn = document.querySelectorAll('[data-accordion-btn]');
const accordion = document.querySelectorAll('[data-accordion]');

const searchBtn = document.querySelector('.search-btn');
const searchField = document.querySelector('.search-field');
const personBtn = document.querySelector('.action-btn');
const cartIcon = document.querySelector('[data-cart-icon]');
const wishlistIcon = document.querySelector('[data-wishlist-icon]');

// ============= Modal Functions =============
const modalCloseFunc = function () { modal.classList.add('closed') }

modalCloseOverlay?.addEventListener('click', modalCloseFunc);
modalCloseBtn?.addEventListener('click', modalCloseFunc);

toastCloseBtn?.addEventListener('click', function () {
  notificationToast.classList.add('closed');
});

// ============= Mobile Menu Setup =============
for (let i = 0; i < mobileMenuOpenBtn.length; i++) {
  const mobileMenuCloseFunc = function () {
    mobileMenu[i].classList.remove('active');
    overlay.classList.remove('active');
  }

  mobileMenuOpenBtn[i].addEventListener('click', function () {
    mobileMenu[i].classList.add('active');
    overlay.classList.add('active');
  });

  mobileMenuCloseBtn[i].addEventListener('click', mobileMenuCloseFunc);
  overlay.addEventListener('click', mobileMenuCloseFunc);
}

// ============= Accordion Setup =============
for (let i = 0; i < accordionBtn.length; i++) {
  accordionBtn[i].addEventListener('click', function () {
    const clickedBtn = this.nextElementSibling.classList.contains('active');

    for (let i = 0; i < accordion.length; i++) {
      if (clickedBtn) break;

      if (accordion[i].classList.contains('active')) {
        accordion[i].classList.remove('active');
        accordionBtn[i].classList.remove('active');
      }
    }

    this.nextElementSibling.classList.toggle('active');
    this.classList.toggle('active');
  });
}

// ============= Authentication Functions =============
async function register(name, email, password, confirmPassword) {
  try {
    if (!name || !email || !password || !confirmPassword) {
      showNotification('All fields are required', 'error');
      return null;
    }
    
    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return null;
    }
    
    if (password.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return null;
    }

    console.log('Registering user:', email);
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword })
    });

    console.log('Register response status:', response.status);
    const data = await response.json();
    console.log('Register response:', data);

    if (data.success) {
      localStorage.setItem('authToken', data.token);
      authToken = data.token;
      showNotification('Registration successful!');
      updateAuthUI();
      // Close modal after successful registration
      const modal = document.querySelector('[data-modal]');
      if (modal) {
        setTimeout(() => modal.classList.add('closed'), 1000);
      }
      return data;
    } else {
      showNotification(data.message || 'Registration failed', 'error');
      return null;
    }
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error message:', error.message);
    showNotification('Error: ' + (error.message || 'Registration failed. Check backend connection'), 'error');
    // offline fallback
    return offlineRegister(name, email, password);
  }
}

// helper used when backend is unreachable
function offlineRegister(name, email, password) {
  let users = JSON.parse(localStorage.getItem('offlineUsers') || '[]');
  if (users.find(u => u.email === email)) {
    showNotification('Email already registered (offline)', 'error');
    return null;
  }
  const user = { id: Date.now(), name, email, password };
  users.push(user);
  localStorage.setItem('offlineUsers', JSON.stringify(users));
  const token = 'offline-' + Date.now();
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
  authToken = token;
  showNotification('Registered (offline mode)');
  updateAuthUI();
  modal.classList.add('closed');
  return { success: true, token, user };
}

async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      authToken = data.token;
      showNotification('Login successful!');
      updateAuthUI();
      modal.classList.add('closed');
      return data;
    } else {
      showNotification(data.message || 'Login failed', 'error');
      return null;
    }
  } catch (error) {
    console.error('Login error:', error);
    showNotification('Login error, trying offline mode', 'error');
    return offlineLogin(email, password);
  }
}

function offlineLogin(email, password) {
  const users = JSON.parse(localStorage.getItem('offlineUsers') || '[]');
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    const token = 'offline-' + Date.now();
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    authToken = token;
    showNotification('Logged in (offline)');
    updateAuthUI();
    modal.classList.add('closed');
    return { success: true, token, user };
  } else {
    showNotification('Offline login failed', 'error');
    return null;
  }
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  authToken = null;
  showNotification('Logged out successfully');
  updateAuthUI();
}

function isLoggedIn() {
  return !!authToken;
}

function updateAuthUI() {
  const personBtn = document.querySelector('[data-person-btn]');
  if (!personBtn) return;
  if (isLoggedIn()) {
    const user = JSON.parse(localStorage.getItem('user'));
    const name = user.name.split(' ')[0];
    // keep icon and show name
    personBtn.innerHTML = `<ion-icon name="person-outline"></ion-icon> ${name}`;
    personBtn.title = 'Manage account';
  } else {
    personBtn.innerHTML = `<ion-icon name="person-outline"></ion-icon>`;
    personBtn.title = 'Login / Register';
  }
}

// create or toggle a small account menu when logged in
function toggleAccountMenu() {
  let menu = document.querySelector('#account-menu');
  const personBtn = document.querySelector('[data-person-btn]');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'account-menu';
    menu.className = 'account-menu closed';
    menu.style.position = 'absolute';
    menu.style.background = 'white';
    menu.style.border = '1px solid #ccc';
    menu.style.padding = '10px';
    menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    menu.style.zIndex = 1000;
    menu.innerHTML = `
      <a href="#" id="profile-link">My Account</a><br/>
      <a href="#" id="logout-link">Logout</a>
    `;
    document.body.appendChild(menu);

    // handlers inside menu
    menu.querySelector('#logout-link').addEventListener('click', (e) => {
      e.preventDefault();
      logout();
      menu.classList.add('closed');
    });
    menu.querySelector('#profile-link').addEventListener('click', (e) => {
      e.preventDefault();
      showNotification('Profile page not implemented');
    });

    // close on outside click
    document.addEventListener('click', (ev) => {
      if (!menu.contains(ev.target) && ev.target !== personBtn) {
        menu.classList.add('closed');
      }
    });
  }

  // position near button
  if (personBtn) {
    const rect = personBtn.getBoundingClientRect();
    menu.style.top = rect.bottom + window.scrollY + 'px';
    menu.style.left = rect.left + window.scrollX + 'px';
  }

  menu.classList.toggle('closed');
}

function setupAccountMenu() {
  const personBtn = document.querySelector('[data-person-btn]');
  if (!personBtn) return;
  personBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (isLoggedIn()) {
      toggleAccountMenu();
    } else {
      document.querySelector('[data-modal]').classList.remove('closed');
    }
  });
}

// ============= Shopping Cart Functions =============
async function getCart() {
  if (!isLoggedIn()) return null;

  try {
    const response = await fetch(`${API_URL}/cart`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    return data.success ? data.cart : null;
  } catch (error) {
    console.error('Get cart error:', error);
    return null;
  }
}

async function addToCart(productId, quantity = 1) {
  if (!isLoggedIn()) {
    showNotification('Please login to add items to cart', 'error');
    modal.classList.remove('closed');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ productId, quantity })
    });

    const data = await response.json();

    if (data.success) {
      updateCartUI(data.cart);
      showNotification('Item added to cart!');
      return true;
    } else {
      showNotification(data.message || 'Failed to add to cart', 'error');
      return false;
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    showNotification('Error adding to cart', 'error');
    return false;
  }
}

async function removeFromCart(productId) {
  if (!isLoggedIn()) return false;

  try {
    const response = await fetch(`${API_URL}/cart/remove/${productId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (data.success) {
      updateCartUI(data.cart);
      showNotification('Item removed from cart');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Remove from cart error:', error);
    return false;
  }
}

async function updateCartItemQuantity(productId, quantity) {
  if (!isLoggedIn()) return false;

  try {
    const response = await fetch(`${API_URL}/cart/update/${productId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ quantity })
    });

    const data = await response.json();

    if (data.success) {
      updateCartUI(data.cart);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Update cart error:', error);
    return false;
  }
}

function updateCartUI(cart) {
  const cartIcons = document.querySelectorAll('[data-cart-count]');
  cartIcons.forEach(icon => icon.textContent = cart?.totalItems || 0);
}

// ============= Product Functions =============
async function getProducts(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await fetch(`${API_URL}/products?${params}`);
    const data = await response.json();

    return data.success ? data.products : [];
  } catch (error) {
    console.error('Get products error:', error);
    showNotification('Unable to reach server, using offline data', 'error');
    return offlineGetProducts(filters);
  }
}

// construct a simple list of products from the static page so that search works without backend
function offlineGetProducts(filters = {}) {
  const grid = document.querySelectorAll('.product-grid .showcase');
  let arr = [];
  grid.forEach(node => {
    const titleEl = node.querySelector('.showcase-title');
    const categoryEl = node.querySelector('.showcase-category');
    const priceEl = node.querySelector('.price');
    const badgeEl = node.querySelector('.showcase-badge');
    const id = node.dataset.productId || (titleEl ? titleEl.textContent.trim() : Date.now());
    arr.push({
      _id: id,
      name: titleEl ? titleEl.textContent.trim() : '',
      category: categoryEl ? categoryEl.textContent.trim() : '',
      price: priceEl ? parseFloat(priceEl.textContent.replace('$', '')) || 0 : 0,
      originalPrice: priceEl ? parseFloat(priceEl.textContent.replace('$', '')) || 0 : 0,
      image: node.querySelector('img')?.getAttribute('src')?.split('/').pop() || '',
      rating: 0,
      stock: 0,
      discount: badgeEl ? parseInt(badgeEl.textContent) || 0 : 0
    });
  });
  if (filters.search) {
    const term = filters.search.toLowerCase();
    arr = arr.filter(p => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term));
  }
  return arr;
}

async function getProductById(id) {
  try {
    const response = await fetch(`${API_URL}/products/${id}`);
    const data = await response.json();

    return data.success ? data.product : null;
  } catch (error) {
    console.error('Get product error:', error);
    return null;
  }
}

// ============= Wishlist Functions =============
async function addToWishlist(productId) {
  if (!isLoggedIn()) {
    showNotification('Please login to add to wishlist', 'error');
    modal.classList.remove('closed');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/users/wishlist/add/${productId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (data.success) {
      showNotification('Added to wishlist!');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return false;
  }
}

async function removeFromWishlist(productId) {
  if (!isLoggedIn()) return false;

  try {
    const response = await fetch(`${API_URL}/users/wishlist/remove/${productId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (data.success) {
      showNotification('Removed from wishlist');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return false;
  }
}

// ============= Order Functions =============
async function createOrder(shippingAddress) {
  if (!isLoggedIn()) {
    showNotification('Please login to place order', 'error');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ shippingAddress })
    });

    const data = await response.json();

    if (data.success) {
      showNotification('Order placed successfully!');
      return data.order;
    } else {
      showNotification(data.message || 'Failed to place order', 'error');
      return null;
    }
  } catch (error) {
    console.error('Create order error:', error);
    showNotification('Error placing order', 'error');
    return null;
  }
}

// ============= Search Functions =============
async function performSearch(searchTerm) {
  console.log('performSearch called with', searchTerm);
  let products = await getProducts({ search: searchTerm });
  console.log('search returned', products.length, 'products');
  // if server gave zero but we have static products, show offline results
  if (products.length === 0) {
    const offline = offlineGetProducts({ search: searchTerm });
    if (offline.length > 0) {
      console.log('using offline results instead');
      products = offline;
    }
  }
  displaySearchResults(products);
}

function displaySearchResults(products) {
  const productGrid = document.querySelector('.product-grid');
  if (!productGrid) return;

  if (products.length === 0) {
    productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No products found</p>';
    return;
  }

  productGrid.innerHTML = products.map(product => createProductCard(product)).join('');
  attachProductCardListeners();
}

function createProductCard(product) {
  const discountPercent = product.discount || 0;
  return `
    <div class="showcase">
      <div class="showcase-banner">
        <img src="./assets/images/products/${product.image}" alt="${product.name}" width="300" class="product-img default">
        <p class="showcase-badge">${discountPercent}%</p>
        <div class="showcase-actions">
          <button class="btn-action wishlist-btn" data-product-id="${product._id}">
            <ion-icon name="heart-outline"></ion-icon>
          </button>
          <button class="btn-action quick-view-btn" data-product-id="${product._id}">
            <ion-icon name="eye-outline"></ion-icon>
          </button>
          <button class="btn-action">
            <ion-icon name="repeat-outline"></ion-icon>
          </button>
          <button class="btn-action add-cart-btn" data-product-id="${product._id}">
            <ion-icon name="bag-add-outline"></ion-icon>
          </button>
        </div>
      </div>
      <div class="showcase-content">
        <a href="#" class="showcase-category">${product.category}</a>
        <a href="#">
          <h3 class="showcase-title">${product.name}</h3>
        </a>
        <div class="showcase-rating">
          ${[...Array(Math.floor(product.rating))].map(() => '<ion-icon name="star"></ion-icon>').join('')}
          ${product.rating % 1 !== 0 ? '<ion-icon name="star-half-outline"></ion-icon>' : ''}
        </div>
        <div class="price-box">
          <p class="price">$${product.price}</p>
          <del>$${product.originalPrice || product.price}</del>
        </div>
      </div>
    </div>
  `;
}

function attachProductCardListeners() {
  document.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = btn.dataset.productId;
      if (!productId) {
        showNotification('Product information not available', 'error');
        return;
      }
      addToCart(productId, 1);
    });
  });

  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = btn.dataset.productId;
      if (!productId) {
        showNotification('Product information not available', 'error');
        return;
      }
      btn.classList.toggle('active');
      addToWishlist(productId);
    });
  });

  document.querySelectorAll('.quick-view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = btn.dataset.productId;
      showProductDetail(productId);
    });
  });
}

// ============= Product Detail Modal =============
async function showProductDetail(productId) {
  const product = await getProductById(productId);
  if (!product) return;

  const detailHTML = `
    <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <div>
          <img src="./assets/images/products/${product.image}" alt="${product.name}" style="width: 100%; border-radius: 8px;">
        </div>
        <div>
          <h2>${product.name}</h2>
          <div class="showcase-rating" style="margin: 15px 0;">
            ${[...Array(Math.floor(product.rating))].map(() => '<ion-icon name="star"></ion-icon>').join('')}
            ${product.rating % 1 !== 0 ? '<ion-icon name="star-half-outline"></ion-icon>' : ''}
          </div>
          <p style="margin: 15px 0; font-size: 14px; color: #666;">${product.description}</p>
          <div style="margin: 20px 0;">
            <p style="font-size: 18px; color: #ff6b6b; margin: 5px 0;">Price: <strong>$${product.price}</strong></p>
            <p style="font-size: 14px; color: #999; text-decoration: line-through;">Was: $${product.originalPrice || product.price}</p>
          </div>
          <p style="margin: 15px 0;"><strong>Stock: ${product.stock > 0 ? product.stock : 'Out of stock'}</strong></p>
          <div style="margin: 20px 0; display: flex; gap: 10px;">
            <input type="number" id="quantity" min="1" max="${product.stock}" value="1" style="width: 60px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <button class="add-to-cart-detail-btn" data-product-id="${product._id}" style="flex: 1; padding: 10px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer;">Add to Cart</button>
          </div>
        </div>
      </div>
      <div style="margin-top: 30px;">
        <h3>Product Details</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Category:</strong> ${product.category}</li>
          <li><strong>Subcategory:</strong> ${product.subcategory}</li>
          <li><strong>Stock:</strong> ${product.stock} units</li>
          <li><strong>Discount:</strong> ${product.discount}%</li>
          <li><strong>Rating:</strong> ${product.rating}/5</li>
        </ul>
      </div>
    </div>
  `;

  const modal = document.querySelector('[data-modal]');
  const modalContent = modal.querySelector('.modal-content');
  modalContent.innerHTML = detailHTML;
  modal.classList.remove('closed');

  document.querySelector('.add-to-cart-detail-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const quantity = parseInt(document.querySelector('#quantity').value);
    addToCart(product._id, quantity);
  });
}

// ============= Notification =============
function showNotification(message, type = 'success') {
  // First try toast notification
  const toast = document.querySelector('[data-toast]');
  if (toast) {
    toast.classList.remove('closed');
    const messageElement = toast.querySelector('.toast-message');
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.style.color = type === 'error' ? '#ff6b6b' : '#00d084';
    }
    setTimeout(() => {
      toast.classList.add('closed');
    }, 3000);
  }
  
  // Fallback to console and alert for critical messages
  if (type === 'error') {
    console.error('Notification:', message);
    // Show a temporary alert div if not already showing
    let alertDiv = document.getElementById('notification-alert');
    if (!alertDiv) {
      alertDiv = document.createElement('div');
      alertDiv.id = 'notification-alert';
      alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-size: 14px;
        word-wrap: break-word;
      `;
      document.body.appendChild(alertDiv);
    }
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    setTimeout(() => {
      if (alertDiv) alertDiv.style.display = 'none';
    }, 5000);
  }
}

// ============= Initialize =============
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  // attach search listeners now that DOM is ready
  const searchForm = document.getElementById('search-form');
  const searchBtnLocal = document.querySelector('.search-btn');
  const searchFieldLocal = document.querySelector('.search-field');
  if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('search form submitted');
      const searchTerm = searchFieldLocal.value.trim();
      if (searchTerm) await performSearch(searchTerm);
    });
  }
  if (searchBtnLocal) {
    searchBtnLocal.addEventListener('click', async (e) => {
      console.log('search button click');
      e.preventDefault();
      const searchTerm = searchFieldLocal.value.trim();
      if (searchTerm) await performSearch(searchTerm);
    });
  }
  if (searchFieldLocal) {
    searchFieldLocal.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        const searchTerm = searchFieldLocal.value.trim();
        if (searchTerm) await performSearch(searchTerm);
      }
    });
  }

  if (isLoggedIn()) {
    getCart().then(cart => {
      if (cart) updateCartUI(cart);
    });
  }

  // set up account menu behaviour regardless of login state
  setupAccountMenu();

  // Attach listeners to existing product cards
  attachProductCardListeners();
  
  // Attach listeners to all add-to-cart buttons on page
  document.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = btn.dataset.productId || btn.closest('.showcase').dataset.productId;
      if (!productId) {
        showNotification('Product information not available', 'error');
        return;
      }
      addToCart(productId, 1);
    });
  });

  // Attach listeners to wishlist/heart buttons
  document.querySelectorAll('.btn-action').forEach(btn => {
    if (btn.querySelector('[name="heart-outline"]') || btn.classList.contains('wishlist-btn')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = btn.dataset.productId || btn.closest('.showcase')?.dataset.productId;
        if (!productId) {
          showNotification('Product information not available', 'error');
          return;
        }
        btn.classList.toggle('active');
        addToWishlist(productId);
      });
    }
  });

  // make banner buttons scroll to products section
  document.querySelectorAll('.banner-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const grid = document.querySelector('.product-grid');
      if (grid) {
        grid.scrollIntoView({ behavior: 'smooth' });
      }
      console.log('Banner shop now clicked');
    });
  });
});

// Export functions for use in external scripts if needed
window.ecommerce = {
  login,
  register,
  logout,
  addToCart,
  removeFromCart,
  getCart,
  addToWishlist,
  removeFromWishlist,
  getProducts,
  getProductById,
  createOrder,
  showNotification,
  isLoggedIn
};
