// Define the page schema

const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
  PageName: {
    type: String,
    required: true,
  },
  PageBannarImage: {
    type: String,
    default: null,
  },
  Trashed:{
     type: Boolean,
     default:false,
  },
  content: {
    type: String,

  },
});

// Create the Page model
module.exports = mongoose.model('Page', PageSchema);  