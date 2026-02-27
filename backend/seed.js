const mongoose = require('mongoose');
const Product = require('./models/Product');
const Merchant = require('./models/Merchant');
const DeliveryBoy = require('./models/DeliveryBoy');
require('dotenv').config();

// create a couple of dummy merchants to simulate real vendors
const merchants = [
  {
    businessName: 'Urban Outfitters',
    ownerName: 'Alice Johnson',
    email: 'alice@urbanoutfitters.com',
    password: 'password123',
    phone: '1234567890',
    businessType: 'Clothing',
    description: 'Trendy streetwear and everyday clothing.',
    address: { street: '123 Elm St', city: 'Chicago', state: 'IL', zip: '60601', country: 'USA' },
    businessLicense: 'LIC12345',
    logo: 'merchants/urban_logo.png',
    banner: 'merchants/urban_banner.jpg',
  },
  {
    businessName: 'TechGear Store',
    ownerName: 'Bob Smith',
    email: 'bob@techgear.com',
    password: 'password123',
    phone: '0987654321',
    businessType: 'Electronics',
    description: 'Latest gadgets and electronic accessories.',
    address: { street: '456 Oak Ave', city: 'San Francisco', state: 'CA', zip: '94102', country: 'USA' },
    businessLicense: 'LIC67890',
    logo: 'merchants/tech_logo.png',
    banner: 'merchants/tech_banner.jpg',
  }
];

const products = [
  {
    name: "Mens Winter Leathers Jackets",
    description: "Premium quality leather jacket perfect for winter season",
    category: "Winter wear",
    subcategory: "jacket",
    price: 48,
    originalPrice: 75,
    discount: 36,
    rating: 4,
    image: "jacket-3.jpg",
    stock: 15,
    sold: 0,
    featured: true,
  },
  {
    name: "Pure Garment Dyed Cotton Shirt",
    description: "High quality cotton shirt with perfect fit",
    category: "Clothes",
    subcategory: "shirt",
    price: 45,
    originalPrice: 56,
    discount: 20,
    rating: 4,
    image: "shirt-1.jpg",
    stock: 25,
    sold: 0,
    featured: true,
  },
  {
    name: "MEN Yarn Fleece Full-Zip Jacket",
    description: "Comfortable fleece jacket for all seasons",
    category: "Winter wear",
    subcategory: "jacket",
    price: 58,
    originalPrice: 65,
    discount: 11,
    rating: 4,
    stock: 18,
    sold: 0,
    featured: true,
  },
  {
    name: "Black Floral Wrap Midi Skirt",
    description: "Elegant midi skirt with floral design",
    category: "Clothes",
    subcategory: "skirt",
    price: 25,
    originalPrice: 35,
    discount: 29,
    rating: 5,
    image: "clothes-3.jpg",
    stock: 30,
    sold: 0,
    featured: true,
  },
  {
    name: "Casual Men's Brown shoes",
    description: "Comfortable casual shoes for everyday wear",
    category: "Footwear",
    subcategory: "casual",
    price: 99,
    originalPrice: 105,
    discount: 6,
    rating: 5,
    image: "shoe-2.jpg",
    stock: 20,
    sold: 0,
    featured: true,
  },
  {
    name: "Pocket Watch Leather Pouch",
    description: "Premium leather pouch for pocket watches",
    category: "Watches",
    subcategory: "watches",
    price: 150,
    originalPrice: 170,
    discount: 12,
    rating: 4,
    image: "watch-3.jpg",
    stock: 12,
    sold: 0,
    featured: true,
  },
  {
    name: "Smart watche Vital Plus",
    description: "Advanced smartwatch with health monitoring",
    category: "Watches",
    subcategory: "watches",
    price: 100,
    originalPrice: 120,
    discount: 17,
    rating: 4.5,
    image: "watch-1.jpg",
    stock: 22,
    sold: 0,
    featured: true,
  },
  {
    name: "Womens Party Wear Shoes",
    description: "Elegant party wear shoes for special occasions",
    category: "Footwear",
    subcategory: "formal",
    price: 25,
    originalPrice: 30,
    discount: 17,
    rating: 4,
    image: "party-wear-1.jpg",
    stock: 16,
    sold: 0,
    featured: true,
  },
  {
    name: "Running & Trekking Shoes - White",
    description: "Professional running and trekking shoes",
    category: "Footwear",
    subcategory: "sports",
    price: 49,
    originalPrice: 65,
    discount: 25,
    rating: 4.5,
    image: "sports-1.jpg",
    stock: 28,
    sold: 0,
    featured: true,
  },
  {
    name: "Trekking & Running Shoes - black",
    description: "High-performance trekking shoes in black",
    category: "Footwear",
    subcategory: "sports",
    price: 58,
    originalPrice: 64,
    discount: 9,
    rating: 4,
    image: "sports-2.jpg",
    stock: 24,
    sold: 0,
    featured: true,
  },
  {
    name: "Better Basics French Terry Sweatshorts",
    description: "Comfortable and stylish french terry shorts",
    category: "Clothes",
    subcategory: "shorts",
    price: 78,
    originalPrice: 85,
    discount: 8,
    rating: 4,
    image: "shorts-1.jpg",
    stock: 19,
    sold: 0,
    featured: true,
  },
  {
    name: "Rose Gold Peacock Earrings",
    description: "Beautiful rose gold plated earrings with peacock design",
    category: "Jewelry",
    subcategory: "earrings",
    price: 20,
    originalPrice: 30,
    discount: 33,
    rating: 5,
    image: "jewellery-1.jpg",
    stock: 35,
    sold: 0,
    featured: true,
  },
  {
    name: "Silver Deer Heart Necklace",
    description: "Elegant silver necklace with heart design",
    category: "Jewelry",
    subcategory: "necklace",
    price: 84,
    originalPrice: 100,
    discount: 16,
    rating: 4.5,
    image: "jewellery-3.jpg",
    stock: 14,
    sold: 0,
    featured: true,
  },
  {
    name: "Shampoo Conditioner & Facewash packs",
    description: "Complete beauty care set with premium products",
    category: "Cosmetics",
    subcategory: "shampoo",
    price: 150,
    originalPrice: 200,
    discount: 25,
    rating: 4,
    image: "shampoo.jpg",
    stock: 40,
    sold: 20,
    featured: true,
  },
  {
    name: "Titan 100 Ml Womens Perfume",
    description: "Premium quality women's fragrance",
    category: "Perfume",
    subcategory: "perfume",
    price: 42,
    originalPrice: 56,
    discount: 25,
    rating: 4,
    image: "perfume.jpg",
    stock: 18,
    sold: 0,
    featured: true,
  },
  {
    name: "Men's Leather Reversible Belt",
    description: "High quality reversible leather belt",
    category: "Clothes",
    subcategory: "accessories",
    price: 24,
    originalPrice: 32,
    discount: 25,
    rating: 4.5,
    image: "belt.jpg",
    stock: 40,
    sold: 0,
    featured: true,
  },
  {
    name: "Platinum Zircon Classic Ring",
    description: "Elegant platinum ring with zircon stone",
    category: "Jewelry",
    subcategory: "rings",
    price: 62,
    originalPrice: 80,
    discount: 23,
    rating: 4.5,
    image: "jewellery-2.jpg",
    stock: 20,
    sold: 0,
    featured: true,
  },
  {
    name: "Relaxed Short full Sleeve T-Shirt",
    description: "Comfortable relaxed fit t-shirt",
    category: "Clothes",
    subcategory: "tshirt",
    price: 45,
    originalPrice: 60,
    discount: 25,
    rating: 4,
    image: "clothes-1.jpg",
    stock: 35,
    sold: 0,
    featured: true,
  },
  {
    name: "Girls pink Embro design Top",
    description: "Stylish embroidered top for girls",
    category: "Clothes",
    subcategory: "tshirt",
    price: 61,
    originalPrice: 75,
    discount: 19,
    rating: 4,
    image: "clothes-2.jpg",
    stock: 26,
    sold: 0,
    featured: true,
  },
  {
    name: "Men's Leather Formal Wear shoes",
    description: "Premium leather shoes for formal occasions",
    category: "Footwear",
    subcategory: "formal",
    price: 50,
    originalPrice: 75,
    discount: 33,
    rating: 4.5,
    image: "shoe-1.jpg",
    stock: 17,
    sold: 0,
    featured: true,
  },
  {
    name: "Boot With Suede Detail",
    description: "Stylish boots with suede details",
    category: "Footwear",
    subcategory: "boots",
    price: 20,
    originalPrice: 35,
    discount: 43,
    rating: 4,
    image: "shoe-3.jpg",
    stock: 22,
    sold: 0,
    featured: true,
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anon-ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await Merchant.deleteMany({});
    await DeliveryBoy.deleteMany({});
    console.log('Cleared existing products, merchants, delivery boys');

    // Create merchants first
    const createdMerchants = await Merchant.insertMany(merchants);
    console.log(`${createdMerchants.length} merchants inserted`);

    // assign each product to a merchant in round-robin fashion
    const productsWithMerchant = products.map((p, idx) => {
      return { ...p, merchant: createdMerchants[idx % createdMerchants.length]._id };
    });

    const createdProducts = await Product.insertMany(productsWithMerchant);
    console.log(`${createdProducts.length} products inserted successfully`);

    // create some delivery boys for testing
    const deliveryData = [
      { name: 'Charlie Rider', email: 'charlie@delivery.com', password: 'pass123', phone: '5550001111', vehicleType: 'Motorcycle', vehicleNumber: 'MOTO123', licenseNumber: 'LIC999', address: { street: '1 Delivery Rd', city: 'Austin', state: 'TX', zip: '73301', country: 'USA' }, idProof: 'ID1234' },
      { name: 'Dana Swift', email: 'dana@delivery.com', password: 'pass123', phone: '5550002222', vehicleType: 'Bicycle', vehicleNumber: 'BIKE456', licenseNumber: 'LIC888', address: { street: '2 Delivery Rd', city: 'Austin', state: 'TX', zip: '73301', country: 'USA' }, idProof: 'ID5678' }
    ];
    const createdDelivery = await DeliveryBoy.insertMany(deliveryData);
    console.log(`${createdDelivery.length} delivery boys inserted`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
