const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const app = express();
const PORT = 5000;
mongoose.set('strictQuery', false);

mongoose.connect("mongodb://localhost:27017/Invizio", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to database"))
.catch(err => console.error("Database connection error:", err));

// Define User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    date: { type: Date, default: Date.now }
});


const LoggedUserSchema = new mongoose.Schema({
    email_log: { type: String, required: true },
    password_log: { type: String, required: true }, // Added password field
    date: { type: Date, default: Date.now }
});

const LoggedUser = mongoose.model("loggedUsers", LoggedUserSchema);
            
const User = mongoose.model("users", UserSchema);

// Define Inventory Schema
// const InventorySchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     category: { type: String, required: true },
//     price: { type: Number, required: true },
//     stock: { type: Number, required: true },
//     imageUrl: { type: String, required: true }
// });

// const Inventory = mongoose.model("inventory", InventorySchema);

// Middleware
app.use(express.json());
app.use(cors());
const server = http.createServer(app);
// Test Route
app.get("/", (req, res) => {
    res.send("App is Working");
});

// Registration Route
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already registered!" });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Login Route
app.post("/login", async (req, res) => {
    try {
        console.log("Received data:", req.body); // Debugging Log

        const { email_log, password_log } = req.body;
        // console.log(email_log)
        const reg_data= await User.findOne({email : email_log})
        let flag_email=false;
        let flag_password=false;
        if(!reg_data){
            flag_email=false
        } else if(reg_data.email!=email_log){
            flag_email=false
        } else {flag_email=true}

        if(!reg_data){
            flag_password=false;
        } else if(reg_data.password!=password_log){
            flag_password=false
        } else {flag_password=true}

        if(flag_email===true && flag_password===true){
            const newLoggedUser = new LoggedUser({ email_log, password_log });
            const savedLoggedUser = await newLoggedUser.save();


            console.log("User saved:", savedLoggedUser); // Debugging Log
            res.status(201).json({ message: "User registered successfully!" });
        } else {
            console.log("Data doesn't exists")
        }
    } catch (error) {
        console.error("Loggin Error:", error); // Show exact error
        res.status(500).json({ message: "Server error", error: error.message });
    }
});



// new code 
// Add these to your existing Express app

// AI Demand Forecasting Endpoint
app.get('/api/forecast/:productId', async (req, res) => {
    try {
      const { productId } = req.params;
      const product = await Inventory.findById(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      // Simulate AI forecasting (in real implementation, integrate with ML service)
      const forecast = {
        productId,
        date: new Date().toISOString().split('T')[0],
        forecastedDemand: Math.round(product.salesHistory.reduce((acc, sale) => acc + sale.quantity, 0) / product.salesHistory.length * 1.2),
        confidenceInterval: [10, 15], // Example range
        algorithmVersion: "v1.0",
        generatedAt:new Date()
      };
  
      // Save forecast to database
      const newForecast = new DemandForecast(forecast);
      await newForecast.save();
  
      res.json(forecast);
    } catch (error) {
      res.status(500).json({ message: "Error generating forecast", error });
    }
  });
  
  // Real-time Inventory Updates with WebSockets
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ noServer: true });
  
  wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
  
  // Inventory Change Endpoint
  app.post('/api/inventory/:id/adjust', async (req, res) => {
    try {
      const { id } = req.params;
      const { adjustment, notes } = req.body;
      
      const product = await Inventory.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      const previousStock = product.stock;
      product.stock += adjustment;
      await product.save();
  
      // Record movement
      const movement = new InventoryMovement({
        productId: id,
        type: adjustment > 0 ? 'restock' : 'sale',
        quantity: Math.abs(adjustment),
        previousStock,
        newStock: product.stock,
        date: new Date(),
        notes
      });
      await movement.save();
  
      // Broadcast update to all connected clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'inventory_update',
            productId: id,
            newStock: product.stock
          }));
        }
      });
  
      res.json({ message: "Inventory updated", product });
    } catch (error) {
      res.status(500).json({ message: "Error updating inventory", error });
    }
  });
  
  // Get Inventory Analytics
  app.get('/api/analytics', async (req, res) => {
    try {
      const products = await Inventory.find();
      const movements = await InventoryMovement.find().sort({ date: -1 }).limit(50);
      const alerts = await Alert.find({ status: 'active' });
      
      // Calculate analytics
      const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
      const outOfStockItems = products.filter(p => p.stock <= 0).length;
      const lowStockItems = products.filter(p => p.stock < p.minStock).length;
      
      res.json({
        totalProducts: products.length,
        totalInventoryValue,
        outOfStockItems,
        lowStockItems,
        recentMovements: movements,
        activeAlerts: alerts
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics", error });
    }
  });



  // Product Schema
const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    cost: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    minStock: { type: Number, required: true },
    maxStock: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    salesHistory: [{
      date: Date,
      quantity: Number,
      revenue: Number
    }],
    leadTime: Number, // days
    supplier: String,
    lastRestock: Date,
    forecastedDemand: Number,
    reorderPoint: Number,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  const Product = mongoose.model('Product', ProductSchema);
  
  // Create Product
  app.post('/api/products', async (req, res) => {
    try {
      const product = new Product(req.body);
      await product.save();
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Error creating product", error });
    }
  });

  app.post('/api/bulk-import', async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: "Request body should be an array of products" });
      }
  
      const products = await Product.insertMany(req.body);
      res.status(201).json({ message: "Bulk import successful", count: products.length });
    } catch (error) {
      res.status(400).json({ message: "Error during bulk import", error: error.message });
    }
  });


  // Inventory Movement Schema
const InventoryMovementSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['sale', 'restock', 'return', 'adjustment'], required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    notes: String
  });
  
  const InventoryMovement = mongoose.model('InventoryMovement', InventoryMovementSchema);
  
  // Create Inventory Movement
  app.post('/api/inventory-movements', async (req, res) => {
    try {
      const movement = new InventoryMovement({
        ...req.body,
        date: new Date() // Ensure current date is used
      });
      await movement.save();
      
      // Update the product's stock
      await Product.findByIdAndUpdate(req.body.productId, {
        stock: req.body.newStock,
        updatedAt: new Date()
      });
      
      res.status(201).json(movement);
    } catch (error) {
      res.status(400).json({ message: "Error recording movement", error });
    }
  });

  // Demand Forecast Schema
const DemandForecastSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    date: Date,
    forecastedDemand: Number,
    confidenceInterval: [Number],
    algorithmVersion: String,
    generatedAt: { type: Date, default: Date.now }
  });
  
  const DemandForecast = mongoose.model('DemandForecast', DemandForecastSchema);
  
  // Create Demand Forecast
  app.post('/api/demand-forecasts', async (req, res) => {
    try {
      const forecast = new DemandForecast({
        ...req.body,
        date: new Date(req.body.date),
        generatedAt: new Date()
      });
      await forecast.save();
      
      // Update the product with the new forecast
      await Product.findByIdAndUpdate(req.body.productId, {
        forecastedDemand: req.body.forecastedDemand,
        updatedAt: new Date()
      });
      
      res.status(201).json(forecast);
    } catch (error) {
      res.status(400).json({ message: "Error creating forecast", error });
    }
  });

  // Alert Schema
const AlertSchema = new mongoose.Schema({
    type: { type: String, enum: ['low_stock', 'overstock', 'reorder'], required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    currentValue: Number,
    thresholdValue: Number,
    status: { type: String, enum: ['active', 'resolved'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: Date
  });
  
  const Alert = mongoose.model('Alert', AlertSchema);
  
  // Create Alert
  app.post('/api/alerts', async (req, res) => {
    try {
      const alert = new Alert({
        ...req.body,
        status: 'active',
        createdAt: new Date()
      });
      await alert.save();
      res.status(201).json(alert);
    } catch (error) {
      res.status(400).json({ message: "Error creating alert", error });
    }
  });
  
  // Resolve Alert
  app.patch('/api/alerts/:id/resolve', async (req, res) => {
    try {
      const alert = await Alert.findByIdAndUpdate(
        req.params.id,
        { 
          status: 'resolved',
          resolvedAt: new Date() 
        },
        { new: true }
      );
      res.json(alert);
    } catch (error) {
      res.status(400).json({ message: "Error resolving alert", error });
    }
  });


  // Bulk Inventory Movements
app.post('/api/inventory-movements/bulk', async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: "Request body should be an array" });
      }
      
      const movements = await InventoryMovement.insertMany(req.body);
      
      // Update all affected products' stock
      for (const movement of movements) {
        await Product.findByIdAndUpdate(movement.productId, {
          stock: movement.newStock,
          updatedAt: new Date()
        });
      }
      
      res.status(201).json({ message: "Bulk import successful", count: movements.length });
    } catch (error) {
      res.status(400).json({ message: "Error during bulk import", error: error.message });
    }
  });
  
  // Bulk Demand Forecasts
  app.post('/api/demand-forecasts/bulk', async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: "Request body should be an array" });
      }
      
      const forecasts = await DemandForecast.insertMany(req.body.map(forecast => ({
        ...forecast,
        date: new Date(forecast.date),
        generatedAt: new Date()
      })));
      
      // Update all products with their forecasts
      for (const forecast of forecasts) {
        await Product.findByIdAndUpdate(forecast.productId, {
          forecastedDemand: forecast.forecastedDemand,
          updatedAt: new Date()
        });
      }
      
      res.status(201).json({ message: "Bulk import successful", count: forecasts.length });
    } catch (error) {
      res.status(400).json({ message: "Error during bulk import", error: error.message });
    }
  });
  
  // Bulk Alerts
  app.post('/api/alerts/bulk', async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: "Request body should be an array" });
      }
      
      const alerts = await Alert.insertMany(req.body.map(alert => ({
        ...alert,
        status: 'active',
        createdAt: new Date()
      })));
      
      res.status(201).json({ message: "Bulk import successful", count: alerts.length });
    } catch (error) {
      res.status(400).json({ message: "Error during bulk import", error: error.message });
    }
  });



  app.get('/api/products', async (req, res) => {
    try {
      const products = await Product.find();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products", error });
    }
  });
  
  // Get single product
  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product", error });
    }
  });
  
  // Update product
  app.put('/api/products/:id', async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Error updating product", error });
    }
  });
  
  // Delete product
  app.delete('/api/products/:id', async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Clean up related data
      await InventoryMovement.deleteMany({ productId: req.params.id });
      await DemandForecast.deleteMany({ productId: req.params.id });
      await Alert.deleteMany({ productId: req.params.id });
      
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting product", error });
    }
  });
  
  // ========== INVENTORY MOVEMENT ENDPOINTS ========== //
  // Get all movements
  app.get('/api/inventory-movements', async (req, res) => {
    try {
      const movements = await InventoryMovement.find()
        .sort({ date: -1 })
        .populate('productId', 'name');
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching movements", error });
    }
  });
  
  // Get single movement
  app.get('/api/inventory-movements/:id', async (req, res) => {
    try {
      const movement = await InventoryMovement.findById(req.params.id)
        .populate('productId', 'name');
      if (!movement) {
        return res.status(404).json({ message: "Movement not found" });
      }
      res.json(movement);
    } catch (error) {
      res.status(500).json({ message: "Error fetching movement", error });
    }
  });
  
  // ========== DEMAND FORECAST ENDPOINTS ========== //
  // Get all forecasts
  app.get('/api/demand-forecasts', async (req, res) => {
    try {
      const forecasts = await DemandForecast.find()
        .sort({ date: -1 })
        .populate('productId', 'name');
      res.json(forecasts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching forecasts", error });
    }
  });
  
  // Get single forecast
  app.get('/api/demand-forecasts/:id', async (req, res) => {
    try {
      const forecast = await DemandForecast.findById(req.params.id)
        .populate('productId', 'name');
      if (!forecast) {
        return res.status(404).json({ message: "Forecast not found" });
      }
      res.json(forecast);
    } catch (error) {
      res.status(500).json({ message: "Error fetching forecast", error });
    }
  });
  
  // ========== ALERT ENDPOINTS ========== //
  // Get all alerts
  app.get('/api/alerts', async (req, res) => {
    try {
      const alerts = await Alert.find()
        .sort({ createdAt: -1 })
        .populate('productId', 'name');
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching alerts", error });
    }
  });
  
  // Get single alert
  app.get('/api/alerts/:id', async (req, res) => {
    try {
      const alert = await Alert.findById(req.params.id)
        .populate('productId', 'name');
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: "Error fetching alert", error });
    }
  });
  
  // WebSocket upgrade
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });


  app.post('/api/checkout', async (req, res) => {
    try {
        const { userId, products } = req.body;
        
        // 1. Create order record
        const order = new Order({
            userId,
            products,
            total: products.reduce((sum, p) => sum + p.price, 0),
            status: 'completed'
        });
        await order.save();
        
        // 2. Update user's order history
        await User.findByIdAndUpdate(userId, {
            $push: { orderHistory: order._id }
        });
        
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: "Checkout failed", error });
    }
});
  exports.getRecommendations = async (userId) => {
    const user = await User.findById(userId).populate('orderHistory');
    
    // Simple recommendation logic - get products from same category as previous orders
    const orderedCategories = user.orderHistory
      .flatMap(order => order.products)
      .map(product => product.category);
    
    const mostOrderedCategory = [...new Set(orderedCategories)]
      .sort((a, b) => 
        orderedCategories.filter(c => c === a).length - 
        orderedCategories.filter(c => c === b).length
      )
      .pop();
    
    return Product.find({ 
      category: mostOrderedCategory,
      stock: { $gt: 0 }
    }).limit(3);
  };

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));









// //Backend
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const { Db } = require("mongodb");

// const app = express();
// const PORT = 5000;
// mongoose.set('strictQuery', false);

// mongoose.connect("mongodb://localhost:27017/Invizio", {
//     useNewUrlParser: true, //to use the new MongoDB connection string parser
//     useUnifiedTopology: true //to use the new Server Discovery and Monitoring engine
// })
// .then(() => console.log("Connected to database"))
// .catch(err => console.error("Database connection error:", err));


// // Define User Schema
// const UserSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true }, // Added password field
//     date: { type: Date, default: Date.now }
// });

// const LoggedUserSchema = new mongoose.Schema({
//     email_log: { type: String, required: true },
//     password_log: { type: String, required: true }, // Added password field
//     date: { type: Date, default: Date.now }
// });

// const User = mongoose.model("users", UserSchema);
// const LoggedUser = mongoose.model("loggedUsers", LoggedUserSchema);
            
// // Middleware
// app.use(express.json());
// app.use(cors());

// // Test Route
// app.get("/", (req, res) => {
//     res.send("App is Working");
// });

// // Registration Route
// app.post("/register", async (req, res) => {
//     try {
//         console.log("Received data:", req.body); // Debugging Log

//         const { name, email, password } = req.body;
//         if (!name || !email || !password) {
//             return res.status(400).json({ message: "All fields are required!" });
//         }

//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ message: "User already registered!" });
//         }

//         const newUser = new User({ name, email, password });
//         const savedUser = await newUser.save();

//         console.log("User saved:", savedUser); // Debugging Log
//         res.status(201).json({ message: "User registered successfully!" });

//     } catch (error) {
//         console.error("Registration Error:", error); // Show exact error
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// });

// app.post("/login", async (req, res) => {
//     try {
//         console.log("Received data:", req.body); // Debugging Log

//         const { email_log, password_log } = req.body;
//         // console.log(email_log)
//         const reg_data= await User.findOne({email : email_log})
//         let flag_email=false;
//         let flag_password=false;
//         if(!reg_data){
//             flag_email=false
//         } else if(reg_data.email!=email_log){
//             flag_email=false
//         } else {flag_email=true}

//         if(!reg_data){
//             flag_password=false;
//         } else if(reg_data.password!=password_log){
//             flag_password=false
//         } else {flag_password=true}

//         if(flag_email===true && flag_password===true){
//             const newLoggedUser = new LoggedUser({ email_log, password_log });
//             const savedLoggedUser = await newLoggedUser.save();


//             console.log("User saved:", savedLoggedUser); // Debugging Log
//             res.status(201).json({ message: "User registered successfully!" });
//         } else {
//             console.log("Data doesn't exists")
//         }
//     } catch (error) {
//         console.error("Loggin Error:", error); // Show exact error
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// });

// // Start Server
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));





// Get All Inventory Items
// app.get("/api/inventory", async (req, res) => {
//     try {
//         const items = await Inventory.find();
//         res.json(items);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching inventory", error });
//     }
// });


// app.post("/api/inventory", async (req, res) => {
//     try {
//         if (!Array.isArray(req.body) || req.body.length === 0) {
//             return res.status(400).json({ message: "Invalid request format or empty array!" });
//         }

//         // Validate each item in the array
//         for (const item of req.body) {
//             const { name, category, price, stock, imageUrl } = item;
//             if (!name || !category || !price || !stock || !imageUrl) {
//                 return res.status(400).json({ message: "All fields are required for each item!" });
//             }
//         }

//         // Insert all items in the database
//         const newItems = await Inventory.insertMany(req.body);
//         res.status(201).json({ message: "Items added successfully!", newItems });
//     } catch (error) {
//         res.status(500).json({ message: "Error adding inventory items", error });
//     }
// });

