# Anon - Fully Functional eCommerce Website

This is now a complete, fully functional eCommerce website with frontend and backend. All features are now working including authentication, product search, shopping cart, wishlist, and order management.

## 🚀 Features Implemented

### ✅ Authentication System
- **Register/Login**: Users can create accounts and login with email/password
- **JWT Tokens**: Secure authentication with JWT tokens
- **Session Management**: User sessions are stored in localStorage

### ✅ Product Catalog
- **Product Listing**: Display all products with filters
- **Search Functionality**: Real-time product search by name/description
- **Category Filtering**: Filter products by category
- **Product Details**: View detailed product information
- **Stock Management**: Real-time stock availability

### ✅ Shopping Cart
- **Add to Cart**: Users can add products to shopping cart
- **Cart Management**: Update quantities, remove items, clear cart
- **Cart Persistence**: Cart data saved in database
- **Real-time Updates**: Cart count updates instantly

### ✅ Wishlist
- **Add/Remove Favorites**: Users can wishlist products
- **Wishlist Management**: View and manage favorite items
- **User-specific**: Each user has their own wishlist

### ✅ Checkout & Orders
- **Checkout Process**: Multi-step checkout with shipping info
- **Order Creation**: Place orders with cart items
- **Order Tracking**: View order history and status
- **Admin Controls**: Manage orders, update status, and payment info

### ✅ User Management
- **User Profile**: View and update user information
- **Address Management**: Save shipping addresses
- **Order History**: View past orders and details
- **Admin Panel**: Only admin users can manage products and orders

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn
- A modern web browser

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Navigate back to root
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```
MONGODB_URI=mongodb://localhost:27017/anon-ecommerce
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

**Windows:**
```bash
mongod
```

**Mac/Linux:**
```bash
brew services start mongodb-community@5.0
# or
mongod
```

### 4. Seed Database with Products

```bash
cd backend
node seed.js
cd ..
```

### 5. Start the Backend Server

```bash
cd backend
npm start
# or for development with auto-reload
npm run dev
```

The backend server will run on `http://localhost:5000`

### 6. Start the Frontend

Open `index.html` in a live server:

**Using VS Code Live Server:**
1. Install "Live Server" extension
2. Right-click on `index.html`
3. Click "Open with Live Server"

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Visit `http://localhost:8000` (or your live server port)

## 📝 Default Admin Account

For testing admin features, create an order first, then use the admin routes directly through API.

To make a user admin, update the user in MongoDB:
```javascript
db.users.updateOne({ email: "your-email@example.com" }, { $set: { role: "admin" } })
```

## 🎯 How to Use

### User Registration & Login
1. Click the person icon in the header
2. Click "Register here" to create a new account
3. Fill in your details and register
4. Use the same form to login

### Shopping
1. Browse products on the homepage
2. Use the search bar to find specific products
3. Filter by category from the sidebar
4. Click on products to view details
5. Click "Add to Cart" to add items

### Checkout
1. Click the cart icon to view your cart
2. Proceed to checkout
3. Fill in shipping information
4. Select payment method
5. Place your order

### Wishlist
1. Click the heart icon on products to add to wishlist
2. View your wishlist items in your profile
3. Click to remove items from wishlist

### Account Management
1. Click on your name (when logged in) to access profile
2. Update your information
3. View your order history

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get all products with filters
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/remove/:productId` - Remove item from cart
- `POST /api/cart/update/:productId` - Update item quantity
- `POST /api/cart/clear` - Clear entire cart

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order details

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/wishlist/add/:productId` - Add to wishlist
- `POST /api/users/wishlist/remove/:productId` - Remove from wishlist

## 🗄️ Database Schema

### User
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password
- `phone` - Phone number
- `address` - Shipping address
- `role` - user/admin
- `wishlist` - Array of product IDs
- `createdAt` - Account creation date

### Product
- `name` - Product name
- `description` - Product description
- `category` - Product category
- `price` - Current price
- `originalPrice` - Original price
- `discount` - Discount percentage
- `stock` - Available quantity
- `rating` - Product rating
- `image` - Product image
- `featured` - Featured product flag
- `reviews` - Array of reviews

### Cart
- `user` - Reference to User
- `items` - Array of {product, quantity, price}
- `totalPrice` - Total cart value
- `totalItems` - Total number of items

### Order
- `user` - Reference to User
- `items` - Array of {product, quantity, price}
- `totalPrice` - Order total
- `shippingAddress` - Delivery address
- `paymentStatus` - Payment status
- `orderStatus` - Order status
- `createdAt` - Order date

## 🐛 Troubleshooting

### Backend not connecting
- Check if MongoDB is running
- Verify MONGODB_URI in .env file
- Check if port 5000 is available

### CORS errors
- Backend already has CORS enabled
- Make sure backend is running on port 5000
- Frontend should access backend at `http://localhost:5000`

### Products not loading
- Run `npm node seed.js` in backend directory to populate products
- Check MongoDB connection

### Authentication issues
- Clear browser localStorage and try again
- Verify JWT_SECRET is set in .env
- Check token is being sent in Authorization header

## 📦 Project Structure

```
anon-ecommerce-website/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── seed.js
│   ├── package.json
│   └── .env
├── assets/
│   ├── css/
│   ├── images/
│   └── js/
│       ├── script.js (original UI logic)
│       └── ecommerce.js (new API functionality)
├── index.html
├── checkout.html
└── README.md
```

## 🚀 Deployment

### Deploy Backend to Heroku

1. Create Heroku account and install Heroku CLI
2. Create new app: `heroku create your-app-name`
3. Add MongoDB Atlas URI to Heroku config: `heroku config:set MONGODB_URI=your_cloud_mongodb_uri`
4. Deploy: `git push heroku main`

### Deploy Frontend to Netlify

1. Build your static site (already ready)
2. Connect your GitHub repo to Netlify
3. Set build command to serve the files
4. Update API_URL in `ecommerce.js` to your deployed backend URL

## 📄 Environment Variables

Create a `.env` file in the backend folder:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/anon-ecommerce
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

## 🎓 What's Now Functional

### Previously Dummy Features - Now Working:
✅ Search Products - Real-time search functionality
✅ Login/Registration - Complete authentication system
✅ Add to Cart - Full shopping cart with database persistence
✅ Wishlist - User favorites management
✅ Product Filtering - Filter by category
✅ Checkout - Multi-step checkout process
✅ Order Management - Track orders
✅ User Profiles - User account management
✅ Newsletter - (Can be extended with email integration)
✅ Product Details - Modal with detailed product information

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements.

## 📝 License

This project is free to use and does not contain any specific license.

## 📞 Support

For issues and questions, please create an issue in the repository.

---

**Happy Shopping! 🛍️**
