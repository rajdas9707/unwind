const express = require("express");
const router = express.Router();
const Overthinking = require("../models/Overthinking");

// Get all overthinking entries for the authenticated user
router.get("/", async (req, res) => {
  console.log(`[overthinking] GET / - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[overthinking] GET / - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { date, category, limit = 50, page = 1 } = req.query;
    console.log(`[overthinking] GET / - userId=${userId} date=${date} category=${category} page=${page} limit=${limit}`);

    // Build query explicitly
    const query = { userId };
    if (date) {
      query.date = date;
    }
    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * limit;
    console.log(`[overthinking] GET / - Query:`, query, `Skip: ${skip}`);

    const entries = await Overthinking.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Overthinking.countDocuments(query);

    const response = {
      entries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalEntries: total,
      },
    };

    console.log(`[overthinking] GET / - Success: Found ${entries.length} entries, total: ${total}`);
    res.json(response);
  } catch (error) {
    console.log(`[overthinking] GET / - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get overthinking entry by ID for the authenticated user
router.get("/:id", async (req, res) => {
  console.log(`[overthinking] GET /:id - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[overthinking] GET /:id - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { id } = req.params;
    console.log(`[overthinking] GET /:id - userId=${userId} id=${id}`);

    const entry = await Overthinking.findOne({ _id: id, userId });

    if (!entry) {
      console.log(`[overthinking] GET /:id - Not found: id=${id} userId=${userId}`);
      return res.status(404).json({ error: "Overthinking entry not found" });
    }

    console.log(`[overthinking] GET /:id - Success: Found entry ${id}`);
    res.json(entry);
  } catch (error) {
    console.log(`[overthinking] GET /:id - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create new overthinking entry for the authenticated user
router.post("/", async (req, res) => {
  console.log(`[overthinking] POST / - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[overthinking] POST / - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { thought, solution, date, category, intensity, tags } = req.body;
    console.log(`[overthinking] POST / - userId=${userId}`, {
      thoughtLength: thought?.length,
      solutionLength: solution?.length,
      date,
      category,
      intensity,
      tagsCount: tags?.length,
    });

    if (!thought || !date) {
      console.log(`[overthinking] POST / - Bad request: Missing required fields`);
      return res.status(400).json({ error: "Thought and date are required" });
    }

    // Create entry data explicitly
    const entryData = {
      userId,
      thought,
      solution: solution || "",
      date,
      category: category || "other",
      intensity: intensity || 5,
      tags: tags || [],
    };

    console.log(`[overthinking] POST / - Creating entry with data:`, entryData);
    const entry = new Overthinking(entryData);
    const savedEntry = await entry.save();

    console.log(`[overthinking] POST / - Success: Created entry ${savedEntry._id} for user ${userId}`);
    return res.status(201).json(savedEntry);
  } catch (error) {
    console.log(`[overthinking] POST / - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update overthinking entry for the authenticated user
router.put("/:id", async (req, res) => {
  console.log(`[overthinking] PUT /:id - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[overthinking] PUT /:id - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { id } = req.params;
    const { thought, solution, category, intensity, dumped, tags } = req.body;
    console.log(`[overthinking] PUT /:id - userId=${userId} id=${id}`, {
      thoughtLength: thought?.length,
      solutionLength: solution?.length,
      category,
      intensity,
      dumped,
      tagsCount: tags?.length,
    });

    const entry = await Overthinking.findOne({ _id: id, userId });

    if (!entry) {
      console.log(`[overthinking] PUT /:id - Not found: id=${id} userId=${userId}`);
      return res.status(404).json({ error: "Overthinking entry not found" });
    }

    // Update fields explicitly
    if (thought !== undefined) entry.thought = thought;
    if (solution !== undefined) entry.solution = solution;
    if (category !== undefined) entry.category = category;
    if (intensity !== undefined) entry.intensity = intensity;
    if (dumped !== undefined) entry.dumped = dumped;
    if (tags !== undefined) entry.tags = tags;

    const updatedEntry = await entry.save();
    
    console.log(`[overthinking] PUT /:id - Success: Updated entry ${id} for user ${userId}`);
    res.json(updatedEntry);
  } catch (error) {
    console.log(`[overthinking] PUT /:id - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete overthinking entry for the authenticated user
router.delete("/:id", async (req, res) => {
  console.log(`[overthinking] DELETE /:id - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[overthinking] DELETE /:id - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { id } = req.params;
    console.log(`[overthinking] DELETE /:id - userId=${userId} id=${id}`);

    const entry = await Overthinking.findOne({ _id: id, userId });

    if (!entry) {
      console.log(`[overthinking] DELETE /:id - Not found: id=${id} userId=${userId}`);
      return res.status(404).json({ error: "Overthinking entry not found" });
    }

    await Overthinking.deleteOne({ _id: id, userId });
    
    console.log(`[overthinking] DELETE /:id - Success: Deleted entry ${id} for user ${userId}`);
    res.json({ message: "Overthinking entry deleted successfully" });
  } catch (error) {
    console.log(`[overthinking] DELETE /:id - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Dump a thought (mark as released) for the authenticated user
router.patch("/:id/dump", async (req, res) => {
  console.log(`[overthinking] PATCH /:id/dump - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[overthinking] PATCH /:id/dump - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { id } = req.params;
    console.log(`[overthinking] PATCH /:id/dump - userId=${userId} id=${id}`);

    const entry = await Overthinking.findOne({ _id: id, userId });

    if (!entry) {
      console.log(`[overthinking] PATCH /:id/dump - Not found: id=${id} userId=${userId}`);
      return res.status(404).json({ error: "Overthinking entry not found" });
    }

    entry.dumped = true;
    const updatedEntry = await entry.save();

    console.log(`[overthinking] PATCH /:id/dump - Success: Dumped entry ${id} for user ${userId}`);
    res.json(updatedEntry);
  } catch (error) {
    console.log(`[overthinking] PATCH /:id/dump - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get overthinking statistics for the authenticated user
router.get("/stats", async (req, res) => {
  console.log(`[overthinking] GET /stats - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[overthinking] GET /stats - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    console.log(`[overthinking] GET /stats - userId=${userId}`);

    const totalEntries = await Overthinking.countDocuments({ userId });
    const dumpedEntries = await Overthinking.countDocuments({
      userId,
      dumped: true,
    });

    // Get category distribution
    const categoryStats = await Overthinking.aggregate([
      { $match: { userId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Get average intensity
    const intensityStats = await Overthinking.aggregate([
      { $match: { userId } },
      { $group: { _id: null, avgIntensity: { $avg: "$intensity" } } },
    ]);

    const stats = {
      totalEntries,
      dumpedEntries,
      releaseRate:
        totalEntries > 0
          ? ((dumpedEntries / totalEntries) * 100).toFixed(1)
          : 0,
      categoryDistribution: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      averageIntensity: intensityStats[0]?.avgIntensity?.toFixed(1) || 0,
    };

    console.log(`[overthinking] GET /stats - Success:`, stats);
    res.json(stats);
  } catch (error) {
    console.log(`[overthinking] GET /stats - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
