const express = require('express');
const db = require('./db/config')
const route = require('./controllers/route');
const bodyParser = require('body-parser');
const cors = require('cors');

// Load environment variables
require('dotenv').config()

const port = process.env.PORT || 5001
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000'

const fs = require('fs');
const path = require('path');

//Setup Express App
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up CORS with proper configuration
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
//API Routes
app.use('/api', route);


app.get('/', async (req, res) => {
    res.send('Welcome to my world...')
});

// Get port from environment and store in Express.

const server = app.listen(port, () => {
    const protocol = (process.env.HTTPS === true || process.env.NODE_ENV === 'production') ? 'https' : 'http';
    const { address, port } = server.address();
    const host = address === '::' ? '127.0.0.1' : address;
    console.log(`Server listening at ${protocol}://${host}:${port}/`);
});


// Connect to MongoDB
const DATABASE_URL = process.env.DATABASE_URL || process.env.DB_URL || 'mongodb://127.0.0.1:27017'
const DATABASE = process.env.DATABASE_NAME || process.env.DB || 'Prolink'

db(DATABASE_URL, DATABASE);
