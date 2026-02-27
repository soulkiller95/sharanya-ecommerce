'use strict';

// Delivery Boy Panel JavaScript
const API_URL = 'http://localhost:5000/api';
let deliveryToken = localStorage.getItem('deliveryToken');
let currentDeliveryBoy = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  loadDashboard();
  loadAvailableOrders();
  loadMyOrders();
  
  // Setup location tracking
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(updateLocation, handleLocationError);
  }
});

// Check authentication
function checkAuth() {
  if (!deliveryToken) {
    window.location.href = 'delivery-login.html';
    return;
  }
  
  // Verify token and get delivery boy info
  fetch(`${API_URL}/delivery/me`, {
    headers: { 'Authorization': `Bearer ${deliveryToken}` }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      currentDeliveryBoy = data.deliveryBoy;
      updateProfileInfo();
      updateStatusToggles();
    } else {
      logout();
    }
  })
  .catch(error => {
    console.error('Auth error:', error);
    logout();
  });
}

// Update profile information in UI
function updateProfileInfo() {
  document.getElementById('delivery-name').textContent = `Welcome, ${currentDeliveryBoy.name}!`;
  document.getElementById('profile-name').textContent = currentDeliveryBoy.name;
  document.getElementById('profile-email').textContent = currentDeliveryBoy.email;
  document.getElementById('profile-phone').textContent = currentDeliveryBoy.phone;
  document.getElementById('profile-vehicle').textContent = currentDeliveryBoy.vehicleType;
  document.getElementById('profile-vehicle-number').textContent = currentDeliveryBoy.vehicleNumber;
  document.getElementById('profile-rating').textContent = `${currentDeliveryBoy.rating}/5`;
}

// Update status toggles
function updateStatusToggles() {
  const onlineToggle = document.getElementById('online-toggle');
  const availableToggle = document.getElementById('available-toggle');
  const onlineStatusText = document.getElementById('online-status-text');
  const availableStatusText = document.getElementById('available-status-text');
  
  if (currentDeliveryBoy.isOnline) {
    onlineToggle.classList.add('active');
    onlineStatusText.textContent = 'Online';
  } else {
    onlineToggle.classList.remove('active');
    onlineStatusText.textContent = 'Offline';
  }
  
  if (currentDeliveryBoy.isAvailable) {
    availableToggle.classList.add('active');
    availableStatusText.textContent = 'Available';
  } else {
    availableToggle.classList.remove('active');
    availableStatusText.textContent = 'Unavailable';
  }
}

// Load dashboard stats
async function loadDashboard() {
  try {
    const response = await fetch(`${API_URL}/delivery/dashboard`, {
      headers: { 'Authorization': `Bearer ${deliveryToken}` }
    });
    
    const data = await response.json();
    if (data.success) {
      const stats = data.stats;
      document.getElementById('total-orders').textContent = stats.totalOrders;
      document.getElementById('completed-orders').textContent = stats.completedOrders;
      document.getElementById('cancelled-orders').textContent = stats.cancelledOrders;
      document.getElementById('earnings').textContent = `$${stats.totalEarnings.toFixed(2)}`;
      document.getElementById('available-orders').textContent = stats.availableOrders;
    }
  } catch (error) {
    console.error('Dashboard error:', error);
  }
}

// Load available orders
async function loadAvailableOrders() {
  try {
    const response = await fetch(`${API_URL}/delivery/orders/available`, {
      headers: { 'Authorization': `Bearer ${deliveryToken}` }
    });
    
    const data = await response.json();
    if (data.success) {
      displayAvailableOrders(data.orders);
    }
  } catch (error) {
    console.error('Available orders error:', error);
  }
}

// Display available orders
function displayAvailableOrders(orders) {
  const grid = document.getElementById('available-orders-grid');
  
  if (orders.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No available orders at the moment</p>';
    return;
  }
  
  grid.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-header">
        <div class="order-id">${order.orderNumber}</div>
        <div class="order-amount">$${order.totalAmount.toFixed(2)}</div>
      </div>
      <div class="order-customer">
        <div class="customer-name">${order.customer.name}</div>
        <div class="customer-address">
          📍 ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}
        </div>
        <div class="customer-address">
          📞 ${order.shippingAddress.phone}
        </div>
      </div>
      <div class="order-items">
        ${order.items.map(item => `
          <div class="item">
            <span>${item.quantity}x ${item.product.name}</span>
            <span>$${item.total.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      <div class="order-actions">
        <button class="btn btn-accept" onclick="acceptOrder('${order._id}')">Accept Order</button>
        <button class="btn btn-reject" onclick="rejectOrder('${order._id}')">Reject Order</button>
      </div>
    </div>
  `).join('');
}

// Load my orders
async function loadMyOrders() {
  try {
    const response = await fetch(`${API_URL}/delivery/orders/my`, {
      headers: { 'Authorization': `Bearer ${deliveryToken}` }
    });
    
    const data = await response.json();
    if (data.success) {
      displayMyOrders(data.orders);
    }
  } catch (error) {
    console.error('My orders error:', error);
  }
}

// Display my orders
function displayMyOrders(orders) {
  const grid = document.getElementById('my-orders-grid');
  
  if (orders.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">You haven\'t accepted any orders yet</p>';
    return;
  }
  
  grid.innerHTML = orders.map(order => {
    const statusClass = `status-${order.orderStatus.toLowerCase().replace(' ', '-')}`;
    
    return `
      <div class="order-card">
        <div class="order-header">
          <div class="order-id">${order.orderNumber}</div>
          <div class="order-amount">$${order.totalAmount.toFixed(2)}</div>
        </div>
        <div class="order-customer">
          <div class="customer-name">${order.customer.name}</div>
          <div class="customer-address">
            📍 ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}
          </div>
          <div class="customer-address">
            📞 ${order.shippingAddress.phone}
          </div>
          ${order.items && order.items[0] && order.items[0].merchant ? `
          <div class="customer-address">
            🏪 ${order.items[0].merchant.businessName}
          </div>
          ` : ''}
        </div>
        <div class="order-items">
          ${order.items.map(item => `
            <div class="item">
              <span>${item.quantity}x ${item.product.name}</span>
              <span>$${item.total.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div style="margin-bottom: 15px;">
          <span class="status-badge ${statusClass}">${order.orderStatus}</span>
        </div>
        ${order.orderStatus === 'Out for Delivery' ? `
        <div class="order-actions">
          <button class="btn btn-update" onclick="markAsDelivered('${order._id}')">Mark as Delivered</button>
        </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// Accept order
async function acceptOrder(orderId) {
  try {
    const response = await fetch(`${API_URL}/delivery/orders/${orderId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${deliveryToken}` }
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Order accepted successfully!');
      loadAvailableOrders();
      loadMyOrders();
      loadDashboard();
    } else {
      showNotification(data.message || 'Failed to accept order', 'error');
    }
  } catch (error) {
    console.error('Accept order error:', error);
    showNotification('Error accepting order', 'error');
  }
}

// Reject order
async function rejectOrder(orderId) {
  const reason = prompt('Please provide a reason for rejecting this order:');
  if (!reason) return;
  
  try {
    const response = await fetch(`${API_URL}/delivery/orders/${orderId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deliveryToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Order rejected successfully!');
      loadAvailableOrders();
      loadMyOrders();
      loadDashboard();
    } else {
      showNotification(data.message || 'Failed to reject order', 'error');
    }
  } catch (error) {
    console.error('Reject order error:', error);
    showNotification('Error rejecting order', 'error');
  }
}

// Mark order as delivered
async function markAsDelivered(orderId) {
  if (!confirm('Are you sure you want to mark this order as delivered?')) return;
  
  try {
    // Get current location
    let location = null;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        updateOrderStatus(orderId, 'Delivered', location);
      }, () => {
        updateOrderStatus(orderId, 'Delivered');
      });
    } else {
      updateOrderStatus(orderId, 'Delivered');
    }
  } catch (error) {
    console.error('Mark delivered error:', error);
    showNotification('Error marking order as delivered', 'error');
  }
}

// Update order status
async function updateOrderStatus(orderId, status, location = null) {
  try {
    const requestBody = { orderStatus: status };
    if (location) {
      requestBody.location = location;
    }
    
    const response = await fetch(`${API_URL}/delivery/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${deliveryToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification(`Order marked as ${status}!`);
      loadMyOrders();
      loadDashboard();
    } else {
      showNotification(data.message || 'Failed to update order status', 'error');
    }
  } catch (error) {
    console.error('Update order status error:', error);
    showNotification('Error updating order status', 'error');
  }
}

// Toggle online status
async function toggleOnlineStatus() {
  const newStatus = !currentDeliveryBoy.isOnline;
  
  try {
    const response = await fetch(`${API_URL}/delivery/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${deliveryToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isOnline: newStatus })
    });
    
    const data = await response.json();
    if (data.success) {
      currentDeliveryBoy.isOnline = newStatus;
      updateStatusToggles();
      showNotification(`Status updated to ${newStatus ? 'Online' : 'Offline'}`);
    } else {
      showNotification(data.message || 'Failed to update status', 'error');
    }
  } catch (error) {
    console.error('Toggle status error:', error);
    showNotification('Error updating status', 'error');
  }
}

// Toggle available status
async function toggleAvailableStatus() {
  const newStatus = !currentDeliveryBoy.isAvailable;
  
  try {
    const response = await fetch(`${API_URL}/delivery/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${deliveryToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isAvailable: newStatus })
    });
    
    const data = await response.json();
    if (data.success) {
      currentDeliveryBoy.isAvailable = newStatus;
      updateStatusToggles();
      showNotification(`Availability updated to ${newStatus ? 'Available' : 'Unavailable'}`);
    } else {
      showNotification(data.message || 'Failed to update availability', 'error');
    }
  } catch (error) {
    console.error('Toggle availability error:', error);
    showNotification('Error updating availability', 'error');
  }
}

// Update location
function updateLocation(position) {
  const location = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };
  
  fetch(`${API_URL}/delivery/location`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${deliveryToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(location)
  }).catch(error => {
    console.error('Location update error:', error);
  });
}

// Handle location errors
function handleLocationError(error) {
  console.error('Location error:', error);
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
  localStorage.removeItem('deliveryToken');
  localStorage.removeItem('currentDeliveryBoy');
  window.location.href = 'index.html';
}

// Export functions
window.deliveryPanel = {
  loadAvailableOrders,
  loadMyOrders,
  loadDashboard,
  acceptOrder,
  rejectOrder,
  markAsDelivered,
  updateOrderStatus,
  toggleOnlineStatus,
  toggleAvailableStatus,
  showTab,
  logout
};
