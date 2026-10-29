const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { fullProfile } = require('../utils/friends');

const router = express.Router();

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body || {};
    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'Name, username, email, and password are required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-30 letters, numbers, or underscores' });
    }
    const exists = await User.findOne({
      $or: [{ email: String(email).toLowerCase() }, { username: String(username).toLowerCase() }],
    });
    if (exists) {
      return res.status(409).json({ error: 'Email or username is already in use' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: String(name).trim(),
      username: String(username).toLowerCase(),
      email: String(email).toLowerCase(),
      passwordHash,
    });
    req.session.userId = String(user._id);
    req.session.role = user.role;
    return res.status(201).json({ user: fullProfile(user), message: 'Account created' });
  } catch (err) {
    return res.status(500).json({ error: 'Could not register' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }
    const value = String(identifier).toLowerCase().trim();
    const user = await User.findOne({ $or: [{ email: value }, { username: value }] });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.userId = String(user._id);
    req.session.role = user.role;
    return res.json({ user: fullProfile(user), message: 'Signed in' });
  } catch (err) {
    return res.status(500).json({ error: 'Could not sign in' });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('sid');
    res.json({ message: 'Signed out' });
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Session is no longer valid' });
  }
  return res.json({ user: fullProfile(user) });
});

module.exports = router;
