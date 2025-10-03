const express = require("express");
const router = express.Router();
const Mistake = require("../models/Mistake");

// Get all mistake entries for the authenticated user
router.get("/", async (req, res) => {
  console.log(`[mistakes] GET / - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[mistakes] GET / - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { date, category, limit = 50, page = 1 } = req.query;
    console.log(`[mistakes] GET / - userId=${userId} date=${date} category=${category} page=${page} limit=${limit}`);

    // Build query explicitly
    const query = { userId };
    if (date) {
      query.date = date;
    }
    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * limit;
    console.log(`[mistakes] GET / - Query:`, query, `Skip: ${skip}`);

    const entries = await Mistake.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Mistake.countDocuments(query);

    const response = {
      entries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalEntries: total,
      },
    };

    console.log(`[mistakes] GET / - Success: Found ${entries.length} entries, total: ${total}`);
    res.json(response);
  } catch (error) {
    console.log(`[mistakes] GET / - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get mistake entry by ID for the authenticated user
router.get("/:id", async (req, res) => {
  console.log(`[mistakes] GET /:id - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[mistakes] GET /:id - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { id } = req.params;
    console.log(`[mistakes] GET /:id - userId=${userId} id=${id}`);

    const entry = await Mistake.findOne({ _id: id, userId });

    if (!entry) {
      console.log(`[mistakes] GET /:id - Not found: id=${id} userId=${userId}`);
      return res.status(404).json({ error: "Mistake entry not found" });
    }

    console.log(`[mistakes] GET /:id - Success: Found entry ${id}`);
    res.json(entry);
  } catch (error) {
    console.log(`[mistakes] GET /:id - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create new mistake entry for the authenticated user
router.post("/", async (req, res) => {
  console.log(`[mistakes] POST / - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[mistakes] POST / - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { mistake, solution, category, date, tags } = req.body;
    console.log(`[mistakes] POST / - userId=${userId}`, {
      mistakeLength: mistake?.length,
      solutionLength: solution?.length,
      category,
      date,
      tagsCount: tags?.length,
    });

    if (!mistake || !solution || !date) {
      console.log(`[mistakes] POST / - Bad request: Missing required fields`);
      return res.status(400).json({ error: "Mistake, solution, and date are required" });
    }

    // Create entry data explicitly
    const entryData = {
      userId,
      mistake,
      solution,
      category: category || "other",
      date,
      tags: tags || [],
    };

    console.log(`[mistakes] POST / - Creating entry with data:`, entryData);
    const entry = new Mistake(entryData);
    const savedEntry = await entry.save();

    console.log(`[mistakes] POST / - Success: Created entry ${savedEntry._id} for user ${userId}`);
    res.status(201).json(savedEntry);
  } catch (error) {
    console.log(`[mistakes] POST / - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update mistake entry for the authenticated user
router.put("/:id", async (req, res) => {
  console.log(`[mistakes] PUT /:id - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[mistakes] PUT /:id - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { id } = req.params;
    const { mistake, solution, category, avoided, tags } = req.body;
    console.log(`[mistakes] PUT /:id - userId=${userId} id=${id}`, {
      mistakeLength: mistake?.length,
      solutionLength: solution?.length,
      category,
      avoided,
      tagsCount: tags?.length,
    });

    const entry = await Mistake.findOne({ _id: id, userId });

    if (!entry) {
      console.log(`[mistakes] PUT /:id - Not found: id=${id} userId=${userId}`);
      return res.status(404).json({ error: "Mistake entry not found" });
    }

    // Update fields explicitly
    if (mistake !== undefined) entry.mistake = mistake;
    if (solution !== undefined) entry.solution = solution;
    if (category !== undefined) entry.category = category;
    if (avoided !== undefined) {
      entry.avoided = avoided;

      // Update streak info
      if (avoided) {
        const today = new Date().toISOString().split("T")[0];
        const lastAvoidedDate = entry.streakInfo.lastAvoidedDate;

        if (lastAvoidedDate) {
          const lastDate = new Date(lastAvoidedDate);
          const currentDate = new Date(today);
          const daysDiff = Math.floor(
            (currentDate - lastDate) / (1000 * 60 * 60 * 24)
          );

          if (daysDiff === 1) {
            // Consecutive day
            entry.streakInfo.currentStreak += 1;
          } else {
            // Not consecutive, reset streak
            entry.streakInfo.currentStreak = 1;
          }
        } else {
          // First time avoiding
          entry.streakInfo.currentStreak = 1;
        }

        entry.streakInfo.lastAvoidedDate = today;

        // Update best streak
        if (entry.streakInfo.currentStreak > entry.streakInfo.bestStreak) {
          entry.streakInfo.bestStreak = entry.streakInfo.currentStreak;
        }
      }
    }
    if (tags !== undefined) entry.tags = tags;

    const updatedEntry = await entry.save();
    
    console.log(`[mistakes] PUT /:id - Success: Updated entry ${id} for user ${userId}`);
    res.json(updatedEntry);
  } catch (error) {
    console.log(`[mistakes] PUT /:id - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete mistake entry for the authenticated user
router.delete("/:id", async (req, res) => {
  console.log(`[mistakes] DELETE /:id - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[mistakes] DELETE /:id - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { id } = req.params;
    console.log(`[mistakes] DELETE /:id - userId=${userId} id=${id}`);

    const entry = await Mistake.findOne({ _id: id, userId });

    if (!entry) {
      console.log(`[mistakes] DELETE /:id - Not found: id=${id} userId=${userId}`);
      return res.status(404).json({ error: "Mistake entry not found" });
    }

    await Mistake.deleteOne({ _id: id, userId });
    
    console.log(`[mistakes] DELETE /:id - Success: Deleted entry ${id} for user ${userId}`);
    res.json({ message: "Mistake entry deleted successfully" });
  } catch (error) {
    console.log(`[mistakes] DELETE /:id - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Toggle avoided status for the authenticated user
router.patch("/:id/toggle-avoided", async (req, res) => {
  console.log(`[mistakes] PATCH /:id/toggle-avoided - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[mistakes] PATCH /:id/toggle-avoided - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { id } = req.params;
    console.log(`[mistakes] PATCH /:id/toggle-avoided - userId=${userId} id=${id}`);

    const entry = await Mistake.findOne({ _id: id, userId });

    if (!entry) {
      console.log(`[mistakes] PATCH /:id/toggle-avoided - Not found: id=${id} userId=${userId}`);
      return res.status(404).json({ error: "Mistake entry not found" });
    }

    entry.avoided = !entry.avoided;
    console.log(`[mistakes] PATCH /:id/toggle-avoided - Toggling to avoided=${entry.avoided}`);

    // Update streak info when marking as avoided
    if (entry.avoided) {
      const today = new Date().toISOString().split("T")[0];
      const lastAvoidedDate = entry.streakInfo.lastAvoidedDate;

      if (lastAvoidedDate) {
        const lastDate = new Date(lastAvoidedDate);
        const currentDate = new Date(today);
        const daysDiff = Math.floor(
          (currentDate - lastDate) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          entry.streakInfo.currentStreak += 1;
        } else {
          entry.streakInfo.currentStreak = 1;
        }
      } else {
        entry.streakInfo.currentStreak = 1;
      }

      entry.streakInfo.lastAvoidedDate = today;

      if (entry.streakInfo.currentStreak > entry.streakInfo.bestStreak) {
        entry.streakInfo.bestStreak = entry.streakInfo.currentStreak;
      }
    }

    const updatedEntry = await entry.save();
    
    console.log(`[mistakes] PATCH /:id/toggle-avoided - Success: Toggled entry ${id} for user ${userId}`);
    res.json(updatedEntry);
  } catch (error) {
    console.log(`[mistakes] PATCH /:id/toggle-avoided - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get mistake statistics for the authenticated user
router.get("/stats", async (req, res) => {
  console.log(`[mistakes] GET /stats - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[mistakes] GET /stats - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    console.log(`[mistakes] GET /stats - userId=${userId}`);

    const totalEntries = await Mistake.countDocuments({ userId });
    const avoidedEntries = await Mistake.countDocuments({
      userId,
      avoided: true,
    });

    // Get category distribution
    const categoryStats = await Mistake.aggregate([
      { $match: { userId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Get best streak across all mistakes
    const bestStreakStats = await Mistake.aggregate([
      { $match: { userId } },
      { $group: { _id: null, bestStreak: { $max: "$streakInfo.bestStreak" } } },
    ]);

    const stats = {
      totalEntries,
      avoidedEntries,
      avoidanceRate:
        totalEntries > 0
          ? ((avoidedEntries / totalEntries) * 100).toFixed(1)
          : 0,
      categoryDistribution: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      bestStreak: bestStreakStats[0]?.bestStreak || 0,
    };

    console.log(`[mistakes] GET /stats - Success:`, stats);
    res.json(stats);
  } catch (error) {
    console.log(`[mistakes] GET /stats - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
