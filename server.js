const express = require('express');
const dotenv = require('dotenv');

//load env
dotenv.config({ path: './config/config.env' })

const app = express();

//Route files
const hotels = require('./routes/hotels')
const auth = require('./routes/auth');
const bookings = require('./routes/bookings');

//Query Parser
app.set('query parser', 'extended');

//Body parser
app.use(express.json());

//Mount routers
app.use('/api/v1/hotels', hotels);
app.use('/api/v1/auth', auth);
app.use('/api/v1/bookings', bookings);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));

//Handle unhanded promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error:${err.message}`);
  //close server & exit process
  server.close(() => process.exit(1));
});
