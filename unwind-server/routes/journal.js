const express = require("express");
const router = express.Router();
const Journal = require("../models/Journal");
const aiService = require("../llm/services/aiService");

// Get all journal entries for the authenticated user
router.get("/", async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { date, limit = 50, page = 1 } = req.query;
    console.log(
      `[journal] GET / - userId=${userId} date=${date} page=${page} limit=${limit}`
    );

    const query = { userId };
    if (date) {
      query.date = date;
    }

    const skip = (page - 1) * limit;

    const entries = await Journal.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Journal.countDocuments(query);

    res.json({
      entries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalEntries: total,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get journal entry by ID for the authenticated user
router.get("/:id", async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.params;
    console.log(`[journal] GET /:id - userId=${userId} id=${id}`);

    const entry = await Journal.findOne({ _id: id, userId });

    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new journal entry for the authenticated user
router.post("/", async (req, res) => {
  console.log(req.body);
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { content, date, tags, mood } = req.body;
    console.log(`[journal] POST / - userId=${userId} body=`, {
      contentLength: content?.length,
      date,
      tagsCount: tags?.length,
      mood,
    });

    if (!content || !date) {
      return res.status(400).json({ error: "Content and date are required" });
    }

    // Create journal entry object
    const journalData = {
      userId,
      content,
      date,
      tags: tags || [],
      mood: mood || "neutral",
    };

    // Process with LLM
    console.log(`[journal] Processing with LLM for user ${userId}`);
    try {
      const aiPrompt = `Please provide supportive, empathetic feedback for this journal entry. Keep it encouraging and helpful:\n\n"${content}"`;
      const aiResponse = await aiService.queryAI(aiPrompt, {
        max_tokens: 300,
        temperature: 0.8,
      });

      // Add AI response to journal data
      journalData.aiResponse = aiResponse.response;
      journalData.aiMetadata = {
        provider: aiResponse.provider,
        model: aiResponse.model,
        tokens_used: aiResponse.metadata.tokens_used,
        response_time: aiResponse.metadata.response_time,
        timestamp: new Date(),
      };

      console.log(`[journal] LLM processing successful for user ${userId}`);
    } catch (aiError) {
      console.error(
        `[journal] LLM processing failed for user ${userId}:`,
        aiError.message
      );
      // Still save the journal entry, but with error metadata
      journalData.aiMetadata = {
        error: aiError.message,
        timestamp: new Date(),
      };
    }

    const entry = new Journal(journalData);
    const savedEntry = await entry.save();

    console.log(
      `[journal] CREATED _id=${savedEntry._id} userId=${userId} date=${
        savedEntry.date
      } aiResponse=${!!savedEntry.aiResponse}`
    );

    return res.status(201).json(savedEntry);
  } catch (error) {
    console.error(`[journal] POST error`, error);
    return res.status(500).json({ error: error.message });
  }
});

// Update journal entry for the authenticated user
router.put("/:id", async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.params;
    const { content, tags, mood } = req.body;
    console.log(`[journal] PUT /:id - userId=${userId} id=${id}`);

    const entry = await Journal.findOne({ _id: id, userId });

    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    if (content) entry.content = content;
    if (tags) entry.tags = tags;
    if (mood) entry.mood = mood;

    const updatedEntry = await entry.save();
    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete journal entry for the authenticated user
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.params;
    console.log(`[journal] DELETE /:id - userId=${userId} id=${id}`);

    const entry = await Journal.findOne({ _id: id, userId });

    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    await Journal.deleteOne({ _id: id, userId });
    res.json({ message: "Journal entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual sync - process existing journal entry with LLM
router.post("/sync/:id", async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.params;
    console.log(`[journal] POST /sync/:id - userId=${userId} id=${id}`);

    const entry = await Journal.findOne({ _id: id, userId });

    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    // Check if already processed
    if (entry.aiResponse) {
      return res.json({
        message: "Entry already has AI feedback",
        entry: entry,
      });
    }

    // Process with LLM
    console.log(`[journal] Manual sync processing with LLM for user ${userId}`);
    try {
      const aiPrompt = `Please provide supportive, empathetic feedback for this journal entry. Keep it encouraging and helpful:\n\n"${entry.content}"`;
      const aiResponse = await aiService.queryAI(aiPrompt, {
        max_tokens: 300,
        temperature: 0.8,
      });

      // Update entry with AI response
      entry.aiResponse = aiResponse.response;
      entry.aiMetadata = {
        provider: aiResponse.provider,
        model: aiResponse.model,
        tokens_used: aiResponse.metadata.tokens_used,
        response_time: aiResponse.metadata.response_time,
        timestamp: new Date(),
      };

      console.log(
        `[journal] Manual sync LLM processing successful for user ${userId}`
      );
    } catch (aiError) {
      console.error(
        `[journal] Manual sync LLM processing failed for user ${userId}:`,
        aiError.message
      );
      entry.aiMetadata = {
        error: aiError.message,
        timestamp: new Date(),
      };
      return res.status(500).json({
        error: "Failed to process with AI",
        details: aiError.message,
      });
    }

    const updatedEntry = await entry.save();
    console.log(
      `[journal] Manual sync completed for _id=${updatedEntry._id} userId=${userId}`
    );

    res.json({
      message: "Journal entry processed successfully",
      entry: updatedEntry,
    });
  } catch (error) {
    console.error(`[journal] Manual sync error`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get journal statistics for the authenticated user
router.get("/stats", async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    console.log(`[journal] GET /stats - userId=${userId}`);

    const totalEntries = await Journal.countDocuments({ userId });
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const thisMonthEntries = await Journal.countDocuments({
      userId,
      date: { $regex: `^${thisMonth}` },
    });

    // Get mood distribution
    const moodStats = await Journal.aggregate([
      { $match: { userId } },
      { $group: { _id: "$mood", count: { $sum: 1 } } },
    ]);

    res.json({
      totalEntries,
      thisMonthEntries,
      moodDistribution: moodStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
