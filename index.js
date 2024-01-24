const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require('bcrypt')
const token = require('jsonwebtoken')
const mongoose = require('mongoose');
const { User, Item, Cart, Category } = require('./schemas'); // Adjust the path accordingly

const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json())

mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;

const initializeDBAndServer = async () => {
  try {
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/items", async (request, response) => {
  try {
    const data = await Item.find();
    response.json(data);
  } catch (error) {
    console.error("Error fetching items:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});

app.get("/categories", async (request, response) => {
  try {
    const data = await Category.find();
    response.json(data);
  } catch (error) {
    response.status(500).json({ message: "Internal server error" });
  }
});

app.post('/login', async (request, response) => {
  try {
    const { username, password } = request.body;
    const user = await User.findOne({ username });

 

    if (!user) {

      response.status(400).json({ message: "Invalid Username, please Register" });
    } else {
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
    
      if (isPasswordCorrect) {
        const payload = {username: user.username };
       
        const jwtToken = token.sign(payload, process.env.JWT_SECRET);
      
        response.status(200).json({ jwtToken });
      } else {
        response.status(400).json({ message: "Invalid Password" });
      }
    }
  } catch (error) {
    response.status(500).json({ message: "Internal server error" });
  }
});

app.post('/register', async (request, response) => {
  try {
    const { username, password, email } = request.body;

    

    try {
      const existingUser = await User.findOne({ username });

      if (existingUser) {
        return response.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, password: hashedPassword, email });
      await newUser.save();
      response.json({ message: "User registered successfully" });

       
   } catch (findError) {
      console.error("Error finding user:", findError);
      response.status(500).json({ message: "Internal server error" });
    }
  } catch (error) {
    console.error("Error in registration endpoint:", error);
    response.status(500).json({ message: "Internal server error" });
  }
});


app.post('/user-info', async (request, response) => {
  let jwtToken;
  
  const authHeader = request.headers['authorization'];
 

  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }



  if (jwtToken === undefined) {
    response.status(401).json({ message: "Invalid JWT Token" });
  } else {
 
    token.verify(jwtToken, process.env.JWT_SECRET, async (error, user) => {
      if (error) {
        console.log(error)
        response.status(401).json({ message: "Invalid Access Token" });
      } else {
        try {
          const data = await User.findOne({ username: user.username });
          response.status(200).json({ data });
        } catch (error) {
          response.status(500).json({ message: "Internal server error" });
        }
      }
    });
  }
});

app.get('/add-cart', async (request, response) => {

  try {
    const { id, user_id, quantity } = request.query;
   
    const productDetails = await Item.findOne({ id });


    const cartData = await Cart.findOne({ product_id: id, user_id})
     
    if (cartData===null) {
   
      const newCartItem = new Cart({
        user_id,
        product_id: productDetails.id,
        category_id: productDetails.category_id,
        name: productDetails.name,
        price: productDetails.price,
        image_url: productDetails.image_url,
        quantity:parseInt(quantity),
      });
      try {
        await newCartItem.save();

        response.status(200).json({ message: "Success" });
      } catch (error) {
        console.error("Save Error:", error);
        response.status(500).json({ message: "Internal server error", error });
      }
      
      
      
    


    } else {
      response.status(400).json({ message: "Already exists in the cart" });
    }
  } catch (error) {
    response.status(500).json({ message: "Internal server error" });
  }
});

app.get('/cart', async (req, res) => {
  try {
    const { user_id } = req.query;

    const data = await Cart.find({ user_id:user_id });
    
   
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/remove-cart', async (req, res) => {
  try {
    const { user_id, product_id } = req.query;

    await Cart.findOneAndDelete({ user_id, product_id });
    res.json({ message: "Removed from the cart" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/add-quantity', async (req, res) => {
  try {
    const { id, user_id } = req.query;
    const productDetails = await Cart.findOne({ product_id: id, user_id });

    if (productDetails) {
      const newQuantity = productDetails.quantity + 1;

      await Cart.findOneAndUpdate(
        { user_id, product_id: id },
        { $set: { quantity: newQuantity } }
      );
      res.json({ message: "Quantity updated successfully" });
    } else {
      res.status(404).json({ message: "Product not found in the cart" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get('/remove-quantity', async (req, res) => {
    try {
      const { id, user_id } = req.query;
      const productDetails = await Cart.findOne({ product_id: id, user_id });
  
      if (productDetails) {
        const newQuantity = Math.max(1, productDetails.quantity - 1);
  
        await Cart.findOneAndUpdate(
          { user_id, product_id: id },
          { $set: { quantity: newQuantity } }
        );
        res.json({ message: "Quantity updated successfully" });
      } else {
        res.status(404).json({ message: "Product not found in the cart" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // ... (other routes)
  
  // Add a generic error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
  });

