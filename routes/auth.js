const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');
const User = require('../models/User');
const ShortUrl = require('../models/shortUrl');

const router = express.Router();

// GET: Signup page
router.get('/signup', (req, res) => {
  res.render('signup', { user: null });
});

//  POST: Signup handler
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    //  Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('User already exists.');
    }

    //  Hash password
    const hashed = await bcrypt.hash(password, 10);

    //  Create new user
    const user = new User({ email, password: hashed });
    await user.save();

    console.log(` New user created: ${email}`);
    res.redirect('/login');

  } catch (err) {
    console.error(' Signup error:', err);
    res.status(500).send('Something went wrong.');
  }
});

//  GET: Login page
router.get('/login', (req, res) => {
  res.render('login', { user: null });
});

//  POST: Login handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('User not found.');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).send('Invalid password.');

    //  Generate session ID
    const sessionId = uuidv4();
    user.sessionId = sessionId;
    await user.save();

    res.cookie('sessionId', sessionId, { httpOnly: true });

    console.log(` User logged in: ${email}`);
    res.redirect('/');

  } catch (err) {
    console.error(' Login error:', err);
    res.status(500).send('Something went wrong.');
  }
});

//  GET: Logout
router.get('/logout', async (req, res) => {
  try {
    if (req.cookies.sessionId) {
      await User.updateOne(
        { sessionId: req.cookies.sessionId },
        { $set: { sessionId: null } }
      );
      res.clearCookie('sessionId');
    }
    res.redirect('/login');
  } catch (err) {
    console.error(' Logout error:', err);
    res.status(500).send('Something went wrong.');
  }
});

//  Middleware to get current user
router.use(async (req, res, next) => {
  if (req.cookies.sessionId) {
    const user = await User.findOne({ sessionId: req.cookies.sessionId });
    res.locals.user = user; // so navbar sees it
  } else {
    res.locals.user = null;
  }
  next();
});

//  GET: Home page (protected)
router.get('/', async (req, res) => {
  if (!res.locals.user) {
    return res.redirect('/login');
  }
  const shortUrls = await ShortUrl.find();
  res.render('index', { shortUrls });
});

module.exports = router;
