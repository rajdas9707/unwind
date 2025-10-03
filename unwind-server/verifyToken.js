// Verify Firebase ID token middleware
const admin = require("./firebase");

// Verify Firebase ID token middleware
const verifyToken = async function (req, res, next) {
  // console.log("Verifying token for request", req.method, req.path);

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  // console.log(token);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("Token verification failed:", err);
    res.status(401).json({ error: "Invalid token" });
  }
};
module.exports = verifyToken;
