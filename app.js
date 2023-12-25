const express = require('express');
const app = express();
var cors = require('cors');
app.use(cors());

require('dotenv').config();
// Import routes
const plantsRouter = require('./routes/plants');
const aiml = require("./routes/aiml")
const products = require("./routes/products")
const users = require("./routes/users")

// Use routes
app.use('/plants', plantsRouter);
app.use('/aiml', aiml);
app.use('/products', products)
app.use('/users', users)

// Define a default route
app.get('/', (req, res) => {
    res.send({name:"Affa Alfiandy"});
});

// Start the server
const port = process.env.PORT || 3100;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
