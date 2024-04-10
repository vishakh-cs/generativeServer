const jwt = require('jsonwebtoken');


const validateTokenMiddleware = (req, res, next) => {

  const token = req.headers.authorization || req.query.token || req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // If token is valid, decoded token to the request object
    req.user = decodedToken;
    next();
  });
};

module.exports = validateTokenMiddleware;
