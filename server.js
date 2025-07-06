require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const ShortUrl = require('./models/shortUrl');
const authRoutes = require('./routes/auth');
const User = require('./models/User');

const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB Atlas');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Middleware setup
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));

// Load current user
app.use(async (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    const user = await User.findOne({ sessionId });
    res.locals.user = user;
  } else {
    res.locals.user = null;
  }
  next();
});

// Routes
app.use(authRoutes);

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/dashboard', async (req, res) => {
  if (!res.locals.user) return res.redirect('/login');
  const shortUrls = await ShortUrl.find();
  res.render('index', { shortUrls });
});

app.post('/shortUrls', async (req, res) => {
  if (!res.locals.user) return res.redirect('/login');
  await ShortUrl.create({ full: req.body.fullUrl });
  res.redirect('/dashboard');
});

app.get('/:shortUrl', async (req, res) => {
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (shortUrl == null) return res.sendStatus(404);
  shortUrl.clicks++;
  shortUrl.save();
  res.redirect(shortUrl.full);
});

app.listen(process.env.PORT || 5000, () => {
  console.log('🚀 Server started on http://localhost:5000');
});
