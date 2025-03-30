//Backend
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Db } = require("mongodb");

const app = express();
const PORT = 5000;
mongoose.set('strictQuery', false);

mongoose.connect("mongodb://localhost:27017/Invizio", {
    useNewUrlParser: true, //to use the new MongoDB connection string parser
    useUnifiedTopology: true //to use the new Server Discovery and Monitoring engine
})
.then(() => console.log("Connected to database"))
.catch(err => console.error("Database connection error:", err));


// Define User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Added password field
    date: { type: Date, default: Date.now }
});

const LoggedUserSchema = new mongoose.Schema({
    email_log: { type: String, required: true },
    password_log: { type: String, required: true }, // Added password field
    date: { type: Date, default: Date.now }
});

const User = mongoose.model("users", UserSchema);
const LoggedUser = mongoose.model("loggedUsers", LoggedUserSchema);
            
// Middleware
app.use(express.json());
app.use(cors());

// Test Route
app.get("/", (req, res) => {
    res.send("App is Working");
});

// Registration Route
app.post("/register", async (req, res) => {
    try {
        console.log("Received data:", req.body); // Debugging Log

        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already registered!" });
        }

        const newUser = new User({ name, email, password });
        const savedUser = await newUser.save();

        console.log("User saved:", savedUser); // Debugging Log
        res.status(201).json({ message: "User registered successfully!" });

    } catch (error) {
        console.error("Registration Error:", error); // Show exact error
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

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

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
