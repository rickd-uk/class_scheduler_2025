// server/middleware/isAdmin.js
function isAdmin(req, res, next) {
  // Assumes authenticateToken middleware has already run and attached req.user
  if (!req.user) {
    // This case should ideally be caught by authenticateToken first
    return res.status(401).json({ message: "Authentication required." });
  }

  if (!req.user.isAdmin) {
    console.warn(
      `User ${req.user.id} (${req.user.username}) attempted admin action without privileges.`,
    );
    return res
      .status(403)
      .json({ message: "Forbidden: Administrator privileges required." });
  }

  // User is authenticated and is an admin
  console.log(
    `Admin access granted for user ${req.user.id} (${req.user.username})`,
  );
  next(); // Proceed to the next middleware or route handler
}

module.exports = isAdmin;
