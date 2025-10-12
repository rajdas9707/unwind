const express = require("express");
const verifyToken = require("../verifyToken");
const User = require("../models/User");
const router = express.Router();

// (Removed) Forgot password is handled on Mobile via Firebase client SDK

// Example protected route
router.get("/profile", verifyToken, async (req, res) => {
  const { uid } = req.query;

  if (!uid) {
    return res.status(400).json({ error: "UID is required" });
  }

  const user = await User.findOne({ firebaseUid: uid });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ message: "Secure profile data", user: user });
});

router.post("/signup", async (req, res) => {
  console.log("Signup request body:", req.body);
  const trialPeriodDays = 7; // Define the trial period duration

  const { uid, email, name, trialStart } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: "UID and email are required" });
  }
  // Here you would typically create the user in your database
  try {
    const user = new User({
      firebaseUid: uid,
      email,
      name,
      trialStart,
      trialEnd: trialStart
        ? new Date(
            new Date(trialStart).getTime() +
              trialPeriodDays * 24 * 60 * 60 * 1000
          )
        : null,
    });

    await user.save();

    return res.status(201).json({
      message: "User signed up successfully",
      user: { uid, email, name },
    });
  } catch (error) {
    console.log("Error creating user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
  // For demonstration, we'll just return the received data
});




// PUT route to update user name
router.put("/update-name",verifyToken, async (req, res) => {
  
  const user=req.user;
  console.log("User from token:", user);
  const { newName } = req.body;
  // if (!newName) {
  //   return res.status(400).json({ error: "UID and name are required" });
  // }
  // try {
  //   const user = await User.findOneAndUpdate(
  //     { firebaseUid: uid },
  //     { name },
  //     { new: true }
  //   );
  //   if (!user) {
  //     return res.status(404).json({ error: "User not found" });
  //   }
  //   return res.json({ message: "User name updated successfully", user });
  // } catch (error) {
  //   console.error("Error updating user name:", error);
  //   return res.status(500).json({ error: "Internal server error" });
  // }
});

module.exports = router; // ✅ must export router
