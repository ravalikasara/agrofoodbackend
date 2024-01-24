// schemas.js
const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

const User = mongoose.model('User', userSchema);

// Item Schema
const itemSchema = new mongoose.Schema({
  id:{type: Number},
  category_id : {type : Number},
  name: { type: String},
 price: { type: Number },
  image_url: { type: String},

  // Add other fields as needed
});

const Item = mongoose.model('Items', itemSchema);




// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  // Add other fields as needed
});



const Category = mongoose.model('Category', categorySchema);





const cartSchema = new mongoose.Schema({
  
  id:{type: Number},
  user_id:{type:String},
  product_id: {type:Number},
  category_id : {type : Number},
  name: { type: String},
 price: { type: Number },
  image_url: { type: String},
  quantity:{type:Number}
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = { User, Item, Category, Cart };
