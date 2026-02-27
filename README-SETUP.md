# Anon eCommerce Website - Setup Guide

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (installed and running)
- Git

### Installation Steps

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set Up Environment Variables**
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your actual configuration
   
   ```bash
   cp .env.example .env
   ```

3. **Seed the Database**
   ```bash
   node seed.js
   ```

4. **Start the Backend Server**
   ```bash
   npm start
   ```
   Backend will run on http://localhost:5000

5. **Start the Frontend Server**
   Open a new terminal and run:
   ```bash
   # Option 1: Using Python
   python -m http.server 3000
   
   # Option 2: Using Node.js (if you have http-server installed)
   npx http-server -p 3000
   
   # Option 3: Using serve
   npx serve -s . -l 3000
   ```
   Frontend will run on http://localhost:3000

### Using the Start Script (Windows)

For Windows users, simply run:
```bash
start.bat
```

This will automatically start both the backend and frontend servers.

## Features

### ✅ Completed Features
- **User Authentication**: Login, Register, Logout with JWT tokens
- **Product Management**: View products, search, filter by category
- **Shopping Cart**: Add/remove items, update quantities
- **Wishlist**: Add/remove products from wishlist
- **Product Details**: Quick view modal with full product information
- **Responsive Design**: Mobile-friendly interface
- **Offline Mode**: Basic functionality works without backend
- **Modern UI**: Smooth animations and transitions
- **Toast Notifications**: User-friendly feedback system

### 🔧 Technical Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Icons**: Ionicons
- **Styling**: Custom CSS with animations

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `GET /api/products/featured/all` - Get featured products

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/remove/:productId` - Remove item from cart
- `POST /api/cart/update/:productId` - Update cart item quantity

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders

### Users
- `POST /api/users/wishlist/add/:productId` - Add to wishlist
- `POST /api/users/wishlist/remove/:productId` - Remove from wishlist

## Environment Variables

Create a `.env` file in the backend directory with:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/anon-ecommerce
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Make sure MongoDB is running
   - Check the MONGODB_URI in your .env file

2. **Port Already in Use**
   - Change the PORT in .env file
   - Kill the process using the port

3. **CORS Errors**
   - Ensure frontend is running on the correct port
   - Check CORS configuration in server.js

4. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT_SECRET in .env

### Development Tips

- Backend logs will show in the terminal
- Use browser DevTools to debug frontend issues
- Check Network tab for API requests
- Console logs are enabled for debugging

## Project Structure

```
anon-ecommerce-website-master/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── seed.js          # Database seeder
│   ├── server.js        # Main server file
│   └── package.json     # Backend dependencies
├── assets/
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── images/         # Product images
├── index.html          # Main homepage
├── cart.html           # Shopping cart page
├── checkout.html       # Checkout page
└── start.bat           # Windows start script
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is free to use and does not contain any license restrictions.
