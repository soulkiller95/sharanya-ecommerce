'use strict';

// Admin Panel JavaScript
const API_URL = 'http://localhost:5000/api';
let adminToken = localStorage.getItem('adminToken');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  loadDashboard();
  loadMerchants();
  loadDeliveryBoys();
  loadUsers();
  loadProducts();
  loadOrders();
  
  // Setup form submission
  document.getElementById('merchant-form').addEventListener('submit', handleMerchantSubmit);
});

// Check authentication (simplified for demo)
function checkAuth() {
  if (!adminToken) {
    // For demo, auto-login as admin
    adminToken = 'admin-demo-token';
    localStorage.setItem('adminToken', adminToken);
  }
}

// Load dashboard stats
async function loadDashboard() {
  try {
    // Simulate loading stats (in real app, these would be API calls)
    const stats = {
      totalUsers: 1250,
      totalMerchants: 45,
      totalDeliveryBoys: 23,
      totalProducts: 892,
      totalOrders: 3421,
      totalRevenue: 125430
    };
    
    document.getElementById('total-users').textContent = stats.totalUsers;
    document.getElementById('total-merchants').textContent = stats.totalMerchants;
    document.getElementById('total-delivery-boys').textContent = stats.totalDeliveryBoys;
    document.getElementById('total-products').textContent = stats.totalProducts;
    document.getElementById('total-orders').textContent = stats.totalOrders;
    document.getElementById('total-revenue').textContent = `$${stats.totalRevenue.toLocaleString()}`;
    
    // Load analytics data
    loadAnalytics();
  } catch (error) {
    console.error('Dashboard error:', error);
  }
}

// Load analytics
function loadAnalytics() {
  // Simulate analytics data
  const topMerchants = [
    { name: 'Tech Store', orders: 234, revenue: '$12,450' },
    { name: 'Fashion Hub', orders: 189, revenue: '$8,920' },
    { name: 'Sports World', orders: 156, revenue: '$6,780' }
  ];
  
  const topProducts = [
    { name: 'Wireless Headphones', sales: 89, merchant: 'Tech Store' },
    { name: 'Running Shoes', sales: 67, merchant: 'Sports World' },
    { name: 'Summer Dress', sales: 54, merchant: 'Fashion Hub' }
  ];
  
  const recentOrders = [
    { id: 'ORD1234', customer: 'John Doe', amount: '$89.99', status: 'Delivered' },
    { id: 'ORD1235', customer: 'Jane Smith', amount: '$45.50', status: 'Out for Delivery' },
    { id: 'ORD1236', customer: 'Bob Johnson', amount: '$120.00', status: 'Preparing' }
  ];
  
  // Display analytics
  document.getElementById('top-merchants').innerHTML = topMerchants.map(merchant => 
    `<p>${merchant.name}: ${merchant.orders} orders (${merchant.revenue})</p>`
  ).join('');
  
  document.getElementById('top-products').innerHTML = topProducts.map(product => 
    `<p>${product.name}: ${product.sales} sold by ${product.merchant}</p>`
  ).join('');
  
  document.getElementById('recent-orders').innerHTML = recentOrders.map(order => 
    `<p>${order.id} - ${order.customer}: ${order.amount} (${order.status})</p>`
  ).join('');
}

// Load merchants
async function loadMerchants() {
  try {
    // Simulate API call
    const merchants = [
      {
        _id: '1',
        businessName: 'Tech Store',
        ownerName: 'Alice Johnson',
        email: 'alice@techstore.com',
        phone: '+1234567890',
        businessType: 'Electronics',
        isVerified: true,
        isActive: true
      },
      {
        _id: '2',
        businessName: 'Fashion Hub',
        ownerName: 'Bob Smith',
        email: 'bob@fashionhub.com',
        phone: '+1234567891',
        businessType: 'Clothing',
        isVerified: false,
        isActive: true
      }
    ];
    
    displayMerchants(merchants);
  } catch (error) {
    console.error('Merchants error:', error);
  }
}

// Display merchants
function displayMerchants(merchants) {
  const tbody = document.getElementById('merchants-tbody');
  
  if (merchants.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No merchants found</td></tr>';
    return;
  }
  
  tbody.innerHTML = merchants.map(merchant => `
    <tr>
      <td>${merchant.businessName}</td>
      <td>${merchant.ownerName}</td>
      <td>${merchant.email}</td>
      <td>${merchant.phone}</td>
      <td>${merchant.businessType}</td>
      <td><span class="status-badge ${merchant.isActive ? 'status-active' : 'status-inactive'}">${merchant.isActive ? 'Active' : 'Inactive'}</span></td>
      <td><span class="status-badge ${merchant.isVerified ? 'status-verified' : 'status-pending'}">${merchant.isVerified ? 'Verified' : 'Pending'}</span></td>
      <td>
        <button class="btn btn-primary" onclick="editMerchant('${merchant._id}')">Edit</button>
        <button class="btn ${merchant.isActive ? 'btn-warning' : 'btn-success'}" onclick="toggleMerchantStatus('${merchant._id}')">${merchant.isActive ? 'Deactivate' : 'Activate'}</button>
        <button class="btn ${merchant.isVerified ? 'btn-warning' : 'btn-success'}" onclick="toggleMerchantVerification('${merchant._id}')">${merchant.isVerified ? 'Unverify' : 'Verify'}</button>
      </td>
    </tr>
  `).join('');
}

// Load delivery boys
async function loadDeliveryBoys() {
  try {
    // Simulate API call
    const deliveryBoys = [
      {
        _id: '1',
        name: 'Charlie Brown',
        email: 'charlie@delivery.com',
        phone: '+1234567892',
        vehicleType: 'Motorcycle',
        rating: 4.8,
        isOnline: true,
        isActive: true
      },
      {
        _id: '2',
        name: 'Diana Prince',
        email: 'diana@delivery.com',
        phone: '+1234567893',
        vehicleType: 'Car',
        rating: 4.9,
        isOnline: false,
        isActive: true
      }
    ];
    
    displayDeliveryBoys(deliveryBoys);
  } catch (error) {
    console.error('Delivery boys error:', error);
  }
}

// Display delivery boys
function displayDeliveryBoys(deliveryBoys) {
  const tbody = document.getElementById('delivery-tbody');
  
  if (deliveryBoys.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No delivery boys found</td></tr>';
    return;
  }
  
  tbody.innerHTML = deliveryBoys.map(deliveryBoy => `
    <tr>
      <td>${deliveryBoy.name}</td>
      <td>${deliveryBoy.email}</td>
      <td>${deliveryBoy.phone}</td>
      <td>${deliveryBoy.vehicleType}</td>
      <td>${deliveryBoy.rating}/5</td>
      <td><span class="status-badge ${deliveryBoy.isActive ? 'status-active' : 'status-inactive'}">${deliveryBoy.isActive ? 'Active' : 'Inactive'}</span></td>
      <td><span class="status-badge ${deliveryBoy.isOnline ? 'status-online' : 'status-offline'}">${deliveryBoy.isOnline ? 'Online' : 'Offline'}</span></td>
      <td>
        <button class="btn btn-primary" onclick="editDeliveryBoy('${deliveryBoy._id}')">Edit</button>
        <button class="btn ${deliveryBoy.isActive ? 'btn-warning' : 'btn-success'}" onclick="toggleDeliveryBoyStatus('${deliveryBoy._id}')">${deliveryBoy.isActive ? 'Deactivate' : 'Activate'}</button>
      </td>
    </tr>
  `).join('');
}

// Load users
async function loadUsers() {
  try {
    // Simulate API call
    const users = [
      {
        _id: '1',
        name: 'Eve Wilson',
        email: 'eve@example.com',
        phone: '+1234567894',
        createdAt: '2024-01-15',
        totalOrders: 12,
        totalSpent: 456.78
      },
      {
        _id: '2',
        name: 'Frank Miller',
        email: 'frank@example.com',
        phone: '+1234567895',
        createdAt: '2024-02-20',
        totalOrders: 8,
        totalSpent: 234.56
      }
    ];
    
    displayUsers(users);
  } catch (error) {
    console.error('Users error:', error);
  }
}

// Display users
function displayUsers(users) {
  const tbody = document.getElementById('users-tbody');
  
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No users found</td></tr>';
    return;
  }
  
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.phone}</td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td>${user.totalOrders}</td>
      <td>$${user.totalSpent.toFixed(2)}</td>
      <td>
        <button class="btn btn-primary" onclick="viewUserDetails('${user._id}')">View Details</button>
        <button class="btn btn-danger" onclick="suspendUser('${user._id}')">Suspend</button>
      </td>
    </tr>
  `).join('');
}

// Load products
async function loadProducts() {
  try {
    // Simulate API call
    const products = [
      {
        _id: '1',
        name: 'Wireless Headphones',
        merchant: 'Tech Store',
        category: 'Electronics',
        price: 89.99,
        stock: 45,
        status: 'Active'
      },
      {
        _id: '2',
        name: 'Running Shoes',
        merchant: 'Sports World',
        category: 'Footwear',
        price: 120.00,
        stock: 23,
        status: 'Active'
      }
    ];
    
    displayProducts(products);
  } catch (error) {
    console.error('Products error:', error);
  }
}

// Display products
function displayProducts(products) {
  const tbody = document.getElementById('products-tbody');
  
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No products found</td></tr>';
    return;
  }
  
  tbody.innerHTML = products.map(product => `
    <tr>
      <td>${product.name}</td>
      <td>${product.merchant}</td>
      <td>${product.category}</td>
      <td>$${product.price.toFixed(2)}</td>
      <td>${product.stock}</td>
      <td><span class="status-badge ${product.status === 'Active' ? 'status-active' : 'status-inactive'}">${product.status}</span></td>
      <td>
        <button class="btn btn-primary" onclick="viewProductDetails('${product._id}')">View</button>
        <button class="btn ${product.status === 'Active' ? 'btn-warning' : 'btn-success'}" onclick="toggleProductStatus('${product._id}')">${product.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
      </td>
    </tr>
  `).join('');
}

// Load orders
async function loadOrders() {
  try {
    // Simulate API call
    const orders = [
      {
        _id: '1',
        orderNumber: 'ORD1234',
        customer: 'John Doe',
        merchant: 'Tech Store',
        totalAmount: 89.99,
        orderStatus: 'Delivered',
        createdAt: '2024-03-15'
      },
      {
        _id: '2',
        orderNumber: 'ORD1235',
        customer: 'Jane Smith',
        merchant: 'Fashion Hub',
        totalAmount: 45.50,
        orderStatus: 'Out for Delivery',
        createdAt: '2024-03-16'
      }
    ];
    
    displayOrders(orders);
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
  
  tbody.innerHTML = orders.map(order => `
    <tr>
      <td>${order.orderNumber}</td>
      <td>${order.customer}</td>
      <td>${order.merchant}</td>
      <td>$${order.totalAmount.toFixed(2)}</td>
      <td><span class="status-badge status-${order.orderStatus.toLowerCase().replace(' ', '-')}">${order.orderStatus}</span></td>
      <td>${new Date(order.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-primary" onclick="viewOrderDetails('${order._id}')">View</button>
        <button class="btn btn-warning" onclick="updateOrderStatus('${order._id}')">Update Status</button>
      </td>
    </tr>
  `).join('');
}

// Modal functions
function openAddMerchantModal() {
  document.getElementById('merchant-modal-title').textContent = 'Add Merchant';
  document.getElementById('merchant-form').reset();
  document.getElementById('merchant-modal').style.display = 'block';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function handleMerchantSubmit(e) {
  e.preventDefault();
  
  const formData = {
    businessName: document.getElementById('merchant-business-name').value,
    ownerName: document.getElementById('merchant-owner-name').value,
    email: document.getElementById('merchant-email').value,
    phone: document.getElementById('merchant-phone').value,
    businessType: document.getElementById('merchant-business-type').value,
    isVerified: document.getElementById('merchant-is-verified').value === 'true',
    isActive: document.getElementById('merchant-is-active').value === 'true'
  };
  
  // Simulate API call
  console.log('Adding merchant:', formData);
  showNotification('Merchant added successfully!');
  closeModal('merchant-modal');
  loadMerchants();
  loadDashboard();
}

// Action functions
function editMerchant(id) {
  showNotification('Edit merchant feature coming soon!', 'info');
}

function toggleMerchantStatus(id) {
  showNotification('Merchant status updated!', 'success');
  loadMerchants();
}

function toggleMerchantVerification(id) {
  showNotification('Merchant verification updated!', 'success');
  loadMerchants();
}

function editDeliveryBoy(id) {
  showNotification('Edit delivery boy feature coming soon!', 'info');
}

function toggleDeliveryBoyStatus(id) {
  showNotification('Delivery boy status updated!', 'success');
  loadDeliveryBoys();
}

function viewUserDetails(id) {
  showNotification('User details feature coming soon!', 'info');
}

function suspendUser(id) {
  if (confirm('Are you sure you want to suspend this user?')) {
    showNotification('User suspended!', 'success');
    loadUsers();
  }
}

function viewProductDetails(id) {
  showNotification('Product details feature coming soon!', 'info');
}

function toggleProductStatus(id) {
  showNotification('Product status updated!', 'success');
  loadProducts();
}

function viewOrderDetails(id) {
  showNotification('Order details feature coming soon!', 'info');
}

function updateOrderStatus(id) {
  showNotification('Order status update feature coming soon!', 'info');
}

// Search functions
function searchMerchants() {
  const searchTerm = document.getElementById('merchant-search').value;
  console.log('Searching merchants:', searchTerm);
  showNotification('Search feature coming soon!', 'info');
}

function searchDeliveryBoys() {
  const searchTerm = document.getElementById('delivery-search').value;
  console.log('Searching delivery boys:', searchTerm);
  showNotification('Search feature coming soon!', 'info');
}

function searchUsers() {
  const searchTerm = document.getElementById('user-search').value;
  console.log('Searching users:', searchTerm);
  showNotification('Search feature coming soon!', 'info');
}

function searchProducts() {
  const searchTerm = document.getElementById('product-search').value;
  console.log('Searching products:', searchTerm);
  showNotification('Search feature coming soon!', 'info');
}

function searchOrders() {
  const searchTerm = document.getElementById('order-search').value;
  console.log('Searching orders:', searchTerm);
  showNotification('Search feature coming soon!', 'info');
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
  localStorage.removeItem('adminToken');
  window.location.href = 'index.html';
}

// Export functions
window.adminPanel = {
  loadMerchants,
  loadDeliveryBoys,
  loadUsers,
  loadProducts,
  loadOrders,
  loadDashboard,
  openAddMerchantModal,
  closeModal,
  showTab,
  logout
};
