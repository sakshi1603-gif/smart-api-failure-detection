const jwt = require("jsonwebtoken");

// Generates a signed JWT containing the user's id, valid for 7 days
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

module.exports = generateToken;
