const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // Get token from Authorization header (Bearer TOKEN)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token after 'Bearer '

  if (token == null) {
    console.log("Auth Middleware: No token provided.");
    return res.status(401).json({ message: 'Authentication token required.' }); // if there isn't any token
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
       console.log("Auth Middleware: Token verification failed.", err.message);
      // Differentiate between expired and invalid tokens
      if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token has expired.' });
      }
      return res.status(403).json({ message: 'Invalid or malformed token.' }); // Forbidden if token is invalid
    }

    // Token is valid, attach user payload to request object
    req.user = user; // Contains { id: ..., username: ..., iat: ..., exp: ... }
    console.log("Auth Middleware: Token verified for user:", user.username);
    next(); // Pass the execution to the next middleware or route handler
  });
}

module.exports = authenticateToken;

