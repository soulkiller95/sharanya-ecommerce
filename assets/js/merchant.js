'use strict';

// Merchant Panel JavaScript
const API_URL = 'http://localhost:5000/api';
let merchantToken = localStorage.getItem('merchantToken');
let currentMerchant = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  loadDashboard();
  loadProducts();
  loadOrders();
  
  // Setup form submission
  document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
});

// Check authentication
function checkAuth() {
  if (!merchantToken) {
    window.location.href = 'merchant-login.html';
    return;
  }
  
  // Verify token and get merchant info
  fetch(`${API_URL}/merchants/me`, {
    headers: { 'Authorization': `Bearer ${merchantToken}` }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      currentMerchant = data.merchant;
      updateMerchantInfo();
    } else {
      logout();
    }
  })
  .catch(error => {
    console.error('Auth error:', error);
    logout();
  });
}

// Update merchant info in UI
function updateMerchantInfo() {
  document.getElementById('merchant-name').textContent = `Welcome, ${currentMerchant.businessName}!`;
  document.getElementById('merchant-business').textContent = currentMerchant.description || 'Manage your products and orders';
}

// Load dashboard stats
async function loadDashboard() {
  try {
    const response = await fetch(`${API_URL}/merchants/dashboard`, {
      headers: { 'Authorization': `Bearer ${merchantToken}` }
    });
    
    const data = await response.json();
    if (data.success) {
      const stats = data.stats;
      document.getElementById('total-products').textContent = stats.totalProducts;
      document.getElementById('active-products').textContent = stats.activeProducts;
      document.getElementById('total-orders').textContent = stats.totalOrders;
      document.getElementById('pending-orders').textContent = stats.pendingOrders;
      document.getElementById('revenue').textContent = `$${stats.totalRevenue.toFixed(2)}`;
    }
  } catch (error) {
    console.error('Dashboard error:', error);
  }
}

// Load products
async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/merchants/products`, {
      headers: { 'Authorization': `Bearer ${merchantToken}` }
    });
    
    const data = await response.json();
    if (data.success) {
      displayProducts(data.products);
    }
  } catch (error) {
    console.error('Products error:', error);
  }
}

// Display products
function displayProducts(products) {
  const grid = document.getElementById('products-grid');
  
  if (products.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No products found. Add your first product!</p>';
    return;
  }
  
  grid.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${product.image || './assets/images/products/default.jpg'}" alt="${product.name}" class="product-image">
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-price">$${product.price}</p>
        <p>Stock: ${product.stock}</p>
        <p>Status: ${product.status}</p>
        <div class="product-actions">
          <button class="btn btn-small" onclick="editProduct('${product._id}')">Edit</button>
          <button class="btn btn-small" onclick="deleteProduct('${product._id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Handle add product
async function handleAddProduct(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const productData = {
    name: formData.get('name'),
    category: formData.get('category'),
    price: parseFloat(formData.get('price')),
    stock: parseInt(formData.get('stock')),
    description: formData.get('description'),
    specifications: {
      brand: '',
      material: '',
      warranty: ''
    }
  };
  
  // Add product data as JSON string for FormData
  const newFormData = new FormData();
  newFormData.append('productData', JSON.stringify(productData));
  
  // Add image if selected
  const imageFile = formData.get('image');
  if (imageFile && imageFile.size > 0) {
    newFormData.append('images', imageFile);
  }
  
  try {
    const response = await fetch(`${API_URL}/merchants/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${merchantToken}` },
      body: newFormData
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Product added successfully!');
      e.target.reset();
      loadProducts();
      loadDashboard();
      showTab('products');
    } else {
      showNotification(data.message || 'Failed to add product', 'error');
    }
  } catch (error) {
    console.error('Add product error:', error);
    showNotification('Error adding product', 'error');
  }
}

// Edit product (placeholder)
function editProduct(productId) {
  showNotification('Edit product feature coming soon!', 'info');
}

// Delete product
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  try {
    const response = await fetch(`${API_URL}/merchants/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${merchantToken}` }
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Product deleted successfully!');
      loadProducts();
      loadDashboard();
    } else {
      showNotification(data.message || 'Failed to delete product', 'error');
    }
  } catch (error) {
    console.error('Delete product error:', error);
    showNotification('Error deleting product', 'error');
  }
}

// Load orders
async function loadOrders() {
  try {
    const response = await fetch(`${API_URL}/merchants/orders`, {
      headers: { 'Authorization': `Bearer ${merchantToken}` }
    });
    
    const data = await response.json();
    if (data.success) {
      displayOrders(data.orders);
    }
  } catch (error) {
    console.error('Orders error:', error);
  }
}

// Display orders
function displayOrders(orders) {
  const tbody = document.getElementById('orders-tbody');
  
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No orders found</td></tr>';
    return;
  }
  
  tbody.innerHTML = orders.map(order => {
    const items = order.items.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
    const statusClass = `status-${order.orderStatus.toLowerCase()}`;
    
    return `
      <tr>
        <td>${order.orderNumber}</td>
        <td>${order.customer.name}</td>
        <td>${items}</td>
        <td>$${order.totalAmount.toFixed(2)}</td>
        <td><span class="status-badge ${statusClass}">${order.orderStatus}</span></td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        <td>
          <select class="btn btn-small" onchange="updateOrderStatus('${order._id}', this.value)">
            <option value="Pending" ${order.orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Confirmed" ${order.orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Preparing" ${order.orderStatus === 'Preparing' ? 'selected' : ''}>Preparing</option>
            <option value="Ready" ${order.orderStatus === 'Ready' ? 'selected' : ''}>Ready</option>
            <option value="Cancelled" ${order.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`${API_URL}/merchants/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${merchantToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderStatus: newStatus })
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Order status updated successfully!');
      loadOrders();
      loadDashboard();
    } else {
      showNotification(data.message || 'Failed to update order status', 'error');
    }
  } catch (error) {
    console.error('Update order status error:', error);
    showNotification('Error updating order status', 'error');
  }
}

// Tab switching
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active class from all tab buttons
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  // Add active class to clicked tab button
  event.target.classList.add('active');
}

// Show notification
function showNotification(message, type = 'success') {
  const toast = document.querySelector('[data-toast]');
  if (!toast) return;

  const messageElement = document.getElementById('toast-message');
  const titleElement = document.getElementById('toast-title');
  
  if (messageElement) messageElement.textContent = message;
  if (titleElement) titleElement.textContent = type.charAt(0).toUpperCase() + type.slice(1);

  toast.classList.remove('closed');
  
  setTimeout(() => {
    toast.classList.add('closed');
  }, 3000);
}

// Logout
function logout() {
  localStorage.removeItem('merchantToken');
  localStorage.removeItem('currentMerchant');
  window.location.href = 'index.html';
}

// Export functions
window.merchantPanel = {
  loadProducts,
  loadOrders,
  loadDashboard,
  editProduct,
  deleteProduct,
  updateOrderStatus,
  showTab,
  logout
};
