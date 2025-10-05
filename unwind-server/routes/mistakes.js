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
    
    const { description, mistake, category, learning, date } = req.body;
    
    // Support both old and new field names for backward compatibility
    const mistakeDescription = description || mistake;
    
    console.log(`[mistakes] POST / - userId=${userId}`, {
      descriptionLength: mistakeDescription?.length,
      category,
      learningLength: learning?.length,
      date,
      requestBody: JSON.stringify(req.body), // Log full body as JSON string
      rawDescription: description,
      rawMistake: mistake,
      finalDescription: mistakeDescription
    });

    if (!mistakeDescription || !mistakeDescription.trim() || !category || !date) {
      console.log(`[mistakes] POST / - Bad request: Missing required fields. Got:`, {
        description: mistakeDescription,
        descriptionTrimmed: mistakeDescription?.trim(),
        category: category,
        date: date
      });
      return res.status(400).json({ 
        error: "Description (or mistake), category, and date are required",
        received: {
          description: mistakeDescription,
          category: category,
          date: date
        }
      });
    }

    // Validate category
    const { validateCategory } = require('../llm/services/mistakeService');
    if (!validateCategory(category)) {
      console.log(`[mistakes] POST / - Invalid category: ${category}`);
      return res.status(400).json({ error: "Invalid category provided" });
    }

    // Process with AI to generate learning, solution, and intensity
    console.log(`[mistakes] POST / - Processing with AI...`);
    const { processMistakeEntry } = require('../llm/services/mistakeService');
    
    const aiProcessedData = await processMistakeEntry(mistakeDescription, category, learning);
    console.log(`[mistakes] POST / - AI processing complete:`, aiProcessedData);
    console.log(`[mistakes] POST / - Raw description length: ${mistakeDescription.length}, Summary length: ${aiProcessedData.description_summary?.length}`);

    // Create entry data with AI-generated fields
    const entryData = {
      userId,
      description: aiProcessedData.description_summary, // ✅ Use AI-generated summary, not raw text
      category,
      learning: aiProcessedData.learning,
      solution: aiProcessedData.solution,
      intensity: aiProcessedData.intensity,
      date
    };

    console.log(`[mistakes] POST / - Creating entry with AI-processed data:`, entryData);
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
    const { description, category, learning } = req.body;
    console.log(`[mistakes] PUT /:id - userId=${userId} id=${id}`, {
      descriptionLength: description?.length,
      category,
      learningLength: learning?.length,
    });

    const entry = await Mistake.findOne({ _id: id, userId });

    if (!entry) {
      console.log(`[mistakes] PUT /:id - Not found: id=${id} userId=${userId}`);
      return res.status(404).json({ error: "Mistake entry not found" });
    }

    // Update fields explicitly (learning, solution, intensity are AI-generated)
    if (description !== undefined || category !== undefined) {
      // If description or category changes, re-process with AI
      console.log(`[mistakes] PUT /:id - Re-processing with AI due to content update...`);
      const { processMistakeEntry } = require('../llm/services/mistakeService');
      
      const newDescription = description || entry.description;
      const newCategory = category || entry.category;
      const userLearning = learning || entry.learning;
      
      const aiProcessedData = await processMistakeEntry(newDescription, newCategory, userLearning);
      console.log(`[mistakes] PUT /:id - AI re-processing complete:`, aiProcessedData);
      
      entry.description = aiProcessedData.description_summary; // ✅ Use AI-generated summary, not raw text
      entry.category = newCategory;
      entry.learning = aiProcessedData.learning;
      entry.solution = aiProcessedData.solution;
      entry.intensity = aiProcessedData.intensity;
    } else if (learning !== undefined) {
      // Only learning update, enhance it with AI
      console.log(`[mistakes] PUT /:id - Enhancing learning with AI...`);
      const { enhanceLearning } = require('../llm/services/mistakeService');
      
      const enhancedLearning = await enhanceLearning(entry.description, entry.category, learning);
      entry.learning = enhancedLearning.learning;
    }

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

    // Get category distribution
    const categoryStats = await Mistake.aggregate([
      { $match: { userId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Get average intensity
    const intensityStats = await Mistake.aggregate([
      { $match: { userId } },
      { $group: { _id: null, avgIntensity: { $avg: "$intensity" } } },
    ]);

    const stats = {
      totalEntries,
      categoryDistribution: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      averageIntensity: intensityStats[0]?.avgIntensity?.toFixed(1) || 0,
    };

    console.log(`[mistakes] GET /stats - Success:`, stats);
    res.json(stats);
  } catch (error) {
    console.log(`[mistakes] GET /stats - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
