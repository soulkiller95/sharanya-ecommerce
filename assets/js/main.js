'use strict';

// Main JavaScript file for Anon eCommerce
// This file handles the authentication forms and basic interactions

document.addEventListener('DOMContentLoaded', function() {
    
    // Form switching between login and register
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');

    // Switch to register form
    if (switchToRegister) {
        switchToRegister.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            modalTitle.textContent = 'Register for Anon';
            modalDesc.textContent = 'Create your account to start shopping';
        });
    }

    // Switch to login form
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            modalTitle.textContent = 'Login to Anon';
            modalDesc.textContent = 'Sign in to your account to continue shopping';
        });
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            try {
                // Use the login function from ecommerce.js if available
                if (window.ecommerce && window.ecommerce.login) {
                    const result = await window.ecommerce.login(email, password);
                    if (result) {
                        loginForm.reset();
                        const modal = document.querySelector('[data-modal]');
                        if (modal) modal.classList.add('closed');
                    }
                } else {
                    // Fallback for when ecommerce.js is not loaded
                    showNotification('Login functionality not available', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showNotification('Login failed. Please try again.', 'error');
            }
        });
    }

    // Handle register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm').value;

            // Validation
            if (!name || !email || !password || !confirmPassword) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }

            if (password.length < 6) {
                showNotification('Password must be at least 6 characters', 'error');
                return;
            }

            try {
                // Use the register function from ecommerce.js if available
                if (window.ecommerce && window.ecommerce.register) {
                    const result = await window.ecommerce.register(name, email, password, confirmPassword);
                    if (result) {
                        registerForm.reset();
                        const modal = document.querySelector('[data-modal]');
                        if (modal) modal.classList.add('closed');
                    }
                } else {
                    // Fallback for when ecommerce.js is not loaded
                    showNotification('Registration functionality not available', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showNotification('Registration failed. Please try again.', 'error');
            }
        });
    }

    // Initialize cart count from localStorage
    updateCartCount();

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading states to buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            if (!this.classList.contains('no-loading')) {
                this.classList.add('loading');
                setTimeout(() => {
                    this.classList.remove('loading');
                }, 1000);
            }
        });
    });
});

// Update cart count display
function updateCartCount() {
    const cartCount = localStorage.getItem('cartCount') || '0';
    const cartIcons = document.querySelectorAll('[data-cart-count]');
    cartIcons.forEach(icon => {
        icon.textContent = cartCount;
    });
}

// Show notification (fallback if ecommerce.js is not loaded)
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

// Export functions for global access
window.mainApp = {
    updateCartCount,
    showNotification
};
