'use strict';

// Login Pages JavaScript
const API_URL = 'http://localhost:5000/api';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Setup toast close button
  const toastCloseBtn = document.querySelector('[data-toast-close]');
  if (toastCloseBtn) {
    toastCloseBtn.addEventListener('click', function () {
      document.querySelector('[data-toast]').classList.add('closed');
    });
  }
});

// Show login form based on user type
function showLoginForm(userType) {
  // Hide all forms
  document.querySelectorAll('.login-form').forEach(form => {
    form.classList.remove('active');
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('.user-type-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected form
  document.getElementById(`${userType}-form`).classList.add('active');
  
  // Add active class to clicked button
  event.target.classList.add('active');
}

// Handle customer login
async function handleCustomerLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('customer-email').value;
  const password = document.getElementById('customer-password').value;
  
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
      showNotification('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } else {
      showNotification(data.message || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Customer login error:', error);
    showNotification('Login error. Please try again.', 'error');
  }
}

// Handle merchant login
async function handleMerchantLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('merchant-email').value;
  const password = document.getElementById('merchant-password').value;
  
  try {
    const response = await fetch(`${API_URL}/merchants/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('merchantToken', data.token);
      localStorage.setItem('currentMerchant', JSON.stringify(data.merchant));
      showNotification('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = 'merchant.html';
      }, 1500);
    } else {
      showNotification(data.message || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Merchant login error:', error);
    showNotification('Login error. Please try again.', 'error');
  }
}

// Handle delivery boy login
async function handleDeliveryLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('delivery-email').value;
  const password = document.getElementById('delivery-password').value;
  
  try {
    const response = await fetch(`${API_URL}/delivery/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('deliveryToken', data.token);
      localStorage.setItem('currentDeliveryBoy', JSON.stringify(data.deliveryBoy));
      showNotification('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = 'delivery.html';
      }, 1500);
    } else {
      showNotification(data.message || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Delivery login error:', error);
    showNotification('Login error. Please try again.', 'error');
  }
}

// Handle admin login
async function handleAdminLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  
  // Simple admin authentication (in real app, this would be server-side)
  if (email === 'admin@anon.com' && password === 'admin123') {
    localStorage.setItem('adminToken', 'admin-demo-token');
    showNotification('Admin login successful! Redirecting...');
    setTimeout(() => {
      window.location.href = 'admin.html';
    }, 1500);
  } else {
    showNotification('Invalid admin credentials', 'error');
  }
}

// Show registration form (placeholder)
function showRegisterForm(userType) {
  showNotification(`${userType.charAt(0).toUpperCase() + userType.slice(1)} registration coming soon!`, 'info');
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

// Export functions
window.loginPages = {
  showLoginForm,
  handleCustomerLogin,
  handleMerchantLogin,
  handleDeliveryLogin,
  handleAdminLogin,
  showRegisterForm
};
