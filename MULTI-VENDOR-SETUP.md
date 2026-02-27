# Multi-Vendor Marketplace Setup Guide

## 🎯 Overview

Your Anon eCommerce website has been transformed into a **complete multi-vendor marketplace** with the following panels:

### 🏪 **Merchant Panel** (`merchant.html`)
- Register and manage business
- Add/edit products with images
- View and manage orders
- Update order status (Pending → Confirmed → Preparing → Ready)
- View dashboard statistics

### 🚚 **Delivery Boy Panel** (`delivery.html`)
- Register as delivery partner
- View available orders
- Accept/reject delivery requests
- Update delivery status (Out for Delivery → Delivered)
- Track location and earnings
- Toggle online/available status

### 👨‍💼 **Admin Panel** (`admin.html`)
- Manage all merchants (verify, activate/deactivate)
- Manage delivery boys
- View all users and orders
- Platform analytics and statistics
- Product management across all merchants

### 🛍️ **Customer Panel** (`index.html`)
- Browse products from multiple merchants
- Place orders from different vendors
- Track order status
- View merchant information

## 🚀 Quick Start

### 1. **Start Backend Server**
```bash
cd backend
npm start
```
Backend runs on: `http://localhost:5000`

### 2. **Start Frontend Server**
```bash
# Option 1: Python
python -m http.server 3000

# Option 2: Node.js
npx http-server -p 3000

# Option 3: Use start.bat (Windows)
start.bat
```
Frontend runs on: `http://localhost:3000`

### 3. **Access Different Panels**

| Panel | URL | Login Credentials |
|-------|-----|------------------|
| **Customer** | `http://localhost:3000` | Register new account |
| **Merchant** | `http://localhost:3000/merchant.html` | Register as merchant |
| **Delivery Boy** | `http://localhost:3000/delivery.html` | Register as delivery boy |
| **Admin** | `http://localhost:3000/admin.html` | Email: `admin@anon.com`, Password: `admin123` |
| **Unified Login** | `http://localhost:3000/login-pages.html` | Choose your role |

## 📋 Registration & Login Flow

### **Customer Registration/Login**
1. Go to `index.html` or `login-pages.html`
2. Select "Customer" role
3. Register with email, name, password
4. Browse products from multiple merchants
5. Add to cart and checkout

### **Merchant Registration/Login**
1. Go to `login-pages.html` → Select "Merchant"
2. Fill business details:
   - Business name, owner name
   - Business email, phone
   - Business type, description
   - Address, business license
   - Bank details
3. After login, access merchant panel at `merchant.html`
4. Add products, manage orders

### **Delivery Boy Registration/Login**
1. Go to `login-pages.html` → Select "Delivery Boy"
2. Fill delivery details:
   - Name, email, phone
   - Vehicle type, vehicle number
   - License number, address
   - ID proof
3. After login, access delivery panel at `delivery.html`
4. View available orders, accept deliveries

### **Admin Access**
1. Go to `login-pages.html` → Select "Admin"
2. Login with: `admin@anon.com` / `admin123`
3. Access admin panel at `admin.html`
4. Manage entire platform

## 🔄 Order Flow Process

### **Customer Places Order**
1. Customer browses products from multiple merchants
2. Adds items to cart (can be from different merchants)
3. Places order with shipping address
4. Order status: **Pending**

### **Merchant Actions**
1. Merchant receives order notification
2. Confirms order → Status: **Confirmed**
3. Prepares order → Status: **Preparing**
4. Marks as ready → Status: **Ready**

### **Delivery Boy Actions**
1. Order appears in "Available Orders"
2. Delivery boy accepts order
3. Picks up from merchant → Status: **Out for Delivery**
4. Delivers to customer → Status: **Delivered**

### **Admin Oversight**
- Admin can view all orders at any stage
- Can intervene if needed
- Can manage merchant/delivery boy status

## 🛠️ Technical Architecture

### **Backend API Endpoints**

#### Authentication
- `POST /api/auth/login` - Customer login
- `POST /api/auth/register` - Customer registration
- `POST /api/merchants/login` - Merchant login
- `POST /api/merchants/register` - Merchant registration
- `POST /api/delivery/login` - Delivery boy login
- `POST /api/delivery/register` - Delivery boy registration

#### Products
- `GET /api/products` - Get all products (multi-vendor)
- `POST /api/merchants/products` - Add product (merchant only)
- `PUT /api/merchants/products/:id` - Update product
- `DELETE /api/merchants/products/:id` - Delete product

#### Orders
- `POST /api/orders` - Create order
- `GET /api/merchants/orders` - Get merchant orders
- `GET /api/delivery/orders/available` - Get available orders
- `GET /api/delivery/orders/my` - Get my delivery orders
- `PUT /api/merchants/orders/:id/status` - Update order status (merchant)
- `PUT /api/delivery/orders/:id/status` - Update order status (delivery)

#### Admin
- `GET /api/admin/dashboard` - Platform statistics
- `GET /api/admin/merchants` - All merchants
- `GET /api/admin/delivery-boys` - All delivery boys
- `PUT /api/admin/merchants/:id/status` - Update merchant status

### **Database Models**

#### **Merchant Model**
- Business information, address, verification
- Products association
- Order management
- Bank details for payments

#### **Delivery Boy Model**
- Personal information, vehicle details
- Location tracking
- Order history, ratings
- Online/available status

#### **Order Model** (Enhanced)
- Multi-vendor support
- Order tracking timeline
- Delivery boy assignment
- Status management
- Customer/merchant/delivery addresses

#### **Product Model** (Enhanced)
- Merchant association
- Inventory management
- SEO fields
- Shipping details

## 🎨 Frontend Features

### **Responsive Design**
- Mobile-friendly interface
- Modern UI with animations
- Real-time notifications
- Progress tracking

### **Interactive Elements**
- Drag & drop image uploads
- Real-time order status updates
- Interactive maps for delivery tracking
- Live chat support (future feature)

### **Security Features**
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- Secure file uploads

## 📱 Mobile Responsiveness

All panels are fully responsive:
- **Desktop**: Full-featured interface
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly interface

## 🔧 Configuration

### **Environment Variables** (backend/.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/anon-marketplace
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
```

### **File Upload Settings**
- Max file size: 5MB
- Supported formats: JPEG, PNG, GIF
- Upload directory: `backend/uploads/`

## 🚀 Deployment

### **Development**
```bash
# Backend
cd backend && npm start

# Frontend
python -m http.server 3000
```

### **Production**
```bash
# Backend (with PM2)
pm2 start server.js --name "anon-marketplace"

# Frontend (with Nginx)
# Configure Nginx to serve static files
# Proxy API requests to backend
```

## 🎯 Next Steps

### **Phase 2 Features** (Future Enhancements)
1. **Payment Integration**: Stripe, PayPal, UPI
2. **Real-time Notifications**: WebSocket integration
3. **Live Chat**: Customer-merchant communication
4. **Rating System**: Customer reviews for merchants/delivery
5. **Analytics Dashboard**: Advanced reporting
6. **Mobile Apps**: React Native apps
7. **API Documentation**: Swagger/OpenAPI
8. **Email Notifications**: Order status updates
9. **SMS Integration**: Delivery notifications
10. **Multi-language Support**: Internationalization

### **Advanced Features**
- **Geolocation**: Advanced delivery tracking
- **AI Recommendations**: Product suggestions
- **Inventory Management**: Stock alerts
- **Commission Management**: Automated payments
- **Dispute Resolution**: Order conflict handling

## 🐛 Troubleshooting

### **Common Issues**

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env

2. **CORS Issues**
   - Backend allows frontend origin
   - Check API URL configuration

3. **File Upload Errors**
   - Ensure uploads directory exists
   - Check file size limits

4. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT secret configuration

### **Debug Mode**
```bash
# Backend debug
DEBUG=* npm start

# Frontend debug
# Open browser DevTools
# Check console for errors
```

## 📞 Support

For issues and questions:
1. Check browser console for errors
2. Verify backend API responses
3. Check MongoDB connection
4. Review environment configuration

---

**🎉 Congratulations! Your multi-vendor marketplace is now ready!**

The platform supports unlimited merchants, delivery boys, and customers with complete order management, real-time tracking, and admin oversight.
