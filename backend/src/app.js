const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { attachUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const friendRoutes = require('./routes/friends');
const postRoutes = require('./routes/posts');
const albumRoutes = require('./routes/albums');
const searchRoutes = require('./routes/search');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');

function createApp() {
  const app = express();
  const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

  app.set('trust proxy', 1);
  app.use(morgan('dev'));
  app.use(
    cors({
      origin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.use(
    session({
      name: 'sid',
      secret: process.env.SESSION_SECRET || 'dev-only-change-me',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
      }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.COOKIE_SECURE === 'true',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );
  app.use(attachUser);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/friends', friendRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/albums', albumRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.use((err, _req, res, _next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Image is too large. The maximum allowed size is 5 MB.',
      });
    }
  
    if (err.message === 'Only JPEG, PNG, GIF, WebP, or SVG images are allowed') {
      return res.status(400).json({
        error: 'Unsupported image format. Please upload a JPEG, PNG, GIF, WebP, or SVG image.',
      });
    }
  
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

  return app;
}

module.exports = { createApp };
