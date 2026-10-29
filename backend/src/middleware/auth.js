function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Sign in required' });
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Sign in required' });
  }
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  return next();
}

function attachUser(req, _res, next) {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    req.userRole = req.session.role;
  }
  next();
}

module.exports = { requireAuth, requireAdmin, attachUser };
