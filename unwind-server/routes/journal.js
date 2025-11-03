const express = require("express");
const router = express.Router();
const Journal = require("../models/Journal");
const aiService = require("../llm/services/aiService");
const journalService = require("../services/journalService");

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
    const { content, date, mood } = req.body;
    console.log(`[journal] POST / - userId=${userId} body=`, {
      contentLength: content?.length,
      date,
      mood,
    });

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Auto-generate date if not provided (use today's date)
    const entryDate = new Date().toISOString().split("T")[0];

    // Check if user already has a journal entry for today
    const existingEntry = await Journal.findOne({ userId, date: entryDate });
    if (existingEntry) {
      return res.status(400).json({
        error: "You can only create one journal entry per day",
        code: "ONE_JOURNAL_PER_DAY",
        existingEntryId: existingEntry._id,
      });
    }

    // Process raw content through AI to get structured summary - REQUIRED
    console.log(`[journal] Processing raw content with AI for user ${userId}`);
    let processedResult;
    try {
      processedResult = await journalService.processJournalEntry(content);
      console.log(`[journal] AI processing successful for user ${userId}`);
    } catch (aiError) {
      console.error(
        `[journal] AI processing failed for user ${userId}:`,
        aiError.message
      );
      // Don't save the entry if AI processing fails completely
      return res.status(503).json({
        error: "AI service is currently unavailable. Please try again later.",
        code: "LLM_UNAVAILABLE",
        details:
          "The journal entry could not be processed because our AI analysis service is temporarily unreachable.",
      });
    }

    // Create journal entry object with processed structured content
    const journalData = {
      userId,
      date: entryDate,
      mood: mood || "neutral",
      // AI-processed structured content
      summary: processedResult.processedContent.summary,
      positives: processedResult.processedContent.positives,
      negatives: processedResult.processedContent.negatives,
      lessons: processedResult.processedContent.lessons,
      intensity: processedResult.processedContent.intensity,
      rating: processedResult.processedContent.rating,
      aiMetadata: processedResult.aiMetadata,
      editHistory: [], // Initialize empty edit history
    };

    const entry = new Journal(journalData);
    const savedEntry = await entry.save();

    console.log(
      `[journal] CREATED _id=${savedEntry._id} userId=${userId} date=${savedEntry.date} summaryPoints=${savedEntry.summary.length}`
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
    const {
      content,
      mood,
      summary,
      positives,
      negatives,
      lessons,
      intensity,
      rating,
    } = req.body;
    console.log(`[journal] PUT /:id - userId=${userId} id=${id}`);

    const entry = await Journal.findOne({ _id: id, userId });

    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    // Only allow editing today's journal entry
    const today = new Date().toISOString().split("T")[0];
    if (entry.date !== today) {
      return res.status(403).json({
        error: "Cannot edit past journal entries",
        code: "EDIT_PAST_JOURNAL_NOT_ALLOWED",
        message: "You can only edit today's journal entry. Past entries cannot be modified.",
        entryDate: entry.date,
        todayDate: today,
      });
    }

    // Check edit limit: maximum 3 edits per day (server-side enforcement)
    const editsToday = entry.editHistory.filter(
      (edit) => edit.editDate === today
    ).length;

    if (editsToday >= 3) {
      return res.status(400).json({
        error: "Maximum edit limit reached",
        code: "MAX_EDITS_PER_DAY",
        message:
          "You can only edit a journal entry 3 times per day. Try again tomorrow.",
        editsToday: editsToday,
        editCount: entry.editCount || 0,
        maxEdits: 3,
      });
    }

    // If raw content is provided, reprocess it through AI
    if (content) {
      console.log(`[journal] Reprocessing content with AI for entry ${id}`);
      try {
        const processedResult = await journalService.processJournalEntry(
          content
        );
        entry.summary = processedResult.processedContent.summary;
        entry.positives = processedResult.processedContent.positives;
        entry.negatives = processedResult.processedContent.negatives;
        entry.lessons = processedResult.processedContent.lessons;
        entry.intensity = processedResult.processedContent.intensity;
        entry.rating = processedResult.processedContent.rating;
        entry.aiMetadata = processedResult.aiMetadata;
      } catch (aiError) {
        console.error(
          `[journal] AI reprocessing failed for entry ${id}:`,
          aiError.message
        );
        return res.status(503).json({
          error: "AI service is currently unavailable for content update",
          code: "LLM_UNAVAILABLE",
        });
      }
    } else {
      // Allow direct updates to structured fields (for admin/manual edits)
      if (summary) entry.summary = summary;
      if (positives) entry.positives = positives;
      if (negatives) entry.negatives = negatives;
      if (lessons) entry.lessons = lessons;
      if (intensity) entry.intensity = intensity;
      if (rating !== undefined && rating >= 1 && rating <= 10)
        entry.rating = rating;
    }

    if (mood) entry.mood = mood;

    // Record this edit in the edit history
    entry.editHistory.push({
      editedAt: new Date(),
      editDate: new Date().toISOString().split("T")[0],
    });

    // Increment edit count
    entry.editCount = (entry.editCount || 0) + 1;

    const updatedEntry = await entry.save();

    // Include edit count info in response
    const editsTodayCount = updatedEntry.editHistory.filter(
      (edit) => edit.editDate === new Date().toISOString().split("T")[0]
    ).length;

    console.log(
      `[journal] UPDATED _id=${updatedEntry._id} userId=${userId} editCount=${updatedEntry.editCount} editsToday=${editsTodayCount}`
    );

    res.json({
      ...updatedEntry.toObject(),
      editInfo: {
        editsToday: editsTodayCount,
        remainingEdits: Math.max(0, 3 - editsTodayCount),
        totalEdits: updatedEntry.editCount,
      },
    });
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

    // Check if entry has structured content (already processed)
    if (entry.summary && entry.summary.length > 0) {
      return res.json({
        message: "Entry already has structured content",
        entry: entry,
      });
    }

    // Note: This sync route is for legacy entries that might have raw content
    // For new entries, all content is processed during creation
    return res.status(400).json({
      error: "Manual sync not supported for new journal structure",
      message: "All journal entries are now processed during creation",
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
