const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const app = express();

// Import routes
const verifyToken = require("./verifyToken");
const authRoutes = require("./routes/auth");
const journalRoutes = require("./routes/journal");
const overthinkingRoutes = require("./routes/overthinking");
const mistakeRoutes = require("./routes/mistakes");
const todoRoutes = require("./routes/todos");
const llmRoutes = require("./llm/routes/llm");
const dataRoutes = require("./routes/data");
const membershipRoutes = require("./routes/membership");
const planRoutes = require("./routes/plan");


// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Serve static Help Center
const publicDir = path.join(__dirname, "public");
app.use(
  "/help-center",
  express.static(path.join(publicDir, "help-center"), {
    maxAge: process.env.NODE_ENV === "production" ? "1d" : 0,
    setHeaders: (res) => {
      res.setHeader(
        "Cache-Control",
        process.env.NODE_ENV === "production"
          ? "public, max-age=86400"
          : "no-cache"
      );
    },
  })
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/journal", verifyToken, journalRoutes);
app.use("/api/overthinking", verifyToken, overthinkingRoutes);
app.use("/api/mistakes", verifyToken, mistakeRoutes);

app.use("/api/llm", llmRoutes);
app.use("/api/data", dataRoutes);
// Membership routes - /plans is public, others are protected
app.use("/api/membership", membershipRoutes);
app.use("/api/plans", planRoutes);



// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// LLM health check endpoint
app.get("/api/health/llm", async (req, res) => {
  try {
    const aiService = require("./llm/services/aiService");
    const health = await aiService.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/mental-clarity"
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Help Center available at /help-center`);
  });
});

module.exports = app;
