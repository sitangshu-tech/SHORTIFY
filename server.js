const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const ShortUrl = require('./models/shortUrl');
const authRoutes = require('./routes/auth');
const User = require('./models/User');

const app = express();

mongoose.connect('mongodb://localhost/urlShortener', {

});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/', require('./routes/auth'));

//  Make user available in all EJS templates
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

//  Always redirect '/' to login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Auth routes
app.use(authRoutes);

//  Dashboard (protected)
app.get('/dashboard', async (req, res) => {
  if (!res.locals.user) return res.redirect('/login');
  const shortUrls = await ShortUrl.find();
  res.render('index', { shortUrls });
});

//  Create short URL (protected)
app.post('/shortUrls', async (req, res) => {
  if (!res.locals.user) return res.redirect('/login');
  await ShortUrl.create({ full: req.body.fullUrl });
  res.redirect('/dashboard');
});

//  Short URL redirect
app.get('/:shortUrl', async (req, res) => {
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (shortUrl == null) return res.sendStatus(404);

  shortUrl.clicks++;
  shortUrl.save();

  res.redirect(shortUrl.full);
});

app.listen(process.env.PORT || 5000, () => {
  console.log('Server started on http://localhost:5000');
});
