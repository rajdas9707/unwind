const express = require("express");
const router = express.Router();
const Todo = require("../models/Todo");

// Get all todos for the authenticated user
router.get("/", async (req, res) => {
  console.log(`[todos] GET / - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[todos] GET / - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { category, limit = 50, page = 1 } = req.query;
    console.log(`[todos] GET / - userId=${userId} category=${category} page=${page} limit=${limit}`);

    // Build query explicitly
    const query = { userId };
    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * limit;
    console.log(`[todos] GET / - Query:`, query, `Skip: ${skip}`);

    const todos = await Todo.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Todo.countDocuments(query);

    const response = {
      todos,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTodos: total,
      },
    };

    console.log(`[todos] GET / - Success: Found ${todos.length} todos, total: ${total}`);
    res.json(response);
  } catch (error) {
    console.log(`[todos] GET / - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get todo by ID for the authenticated user
router.get("/:id", async (req, res) => {
  console.log(`[todos] GET /:id - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[todos] GET /:id - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { id } = req.params;
    console.log(`[todos] GET /:id - userId=${userId} id=${id}`);

    const todo = await Todo.findOne({ _id: id, userId });

    if (!todo) {
      console.log(`[todos] GET /:id - Not found: id=${id} userId=${userId}`);
      return res.status(404).json({ error: "Todo not found" });
    }

    console.log(`[todos] GET /:id - Success: Found todo ${id}`);
    res.json(todo);
  } catch (error) {
    console.log(`[todos] GET /:id - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create new todo for the authenticated user
router.post("/", async (req, res) => {
  console.log(`[todos] POST / - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[todos] POST / - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { title, description, category, priority, dueDate } = req.body;
    console.log(`[todos] POST / - userId=${userId}`, {
      title,
      description: description?.length || 0,
      category,
      priority,
      dueDate,
    });

    if (!title) {
      console.log(`[todos] POST / - Bad request: Missing title`);
      return res.status(400).json({ error: "Title is required" });
    }

    // Create todo data explicitly
    const todoData = {
      userId,
      title,
      description: description || "",
      category: category || "2-Minute",
      priority: priority || "medium",
    };
    
    if (dueDate) {
      todoData.dueDate = new Date(dueDate);
    }

    console.log(`[todos] POST / - Creating todo with data:`, todoData);
    const todo = new Todo(todoData);
    const savedTodo = await todo.save();

    console.log(`[todos] POST / - Success: Created todo ${savedTodo._id} for user ${userId}`);
    return res.status(201).json(savedTodo);
  } catch (error) {
    console.log(`[todos] POST / - Error:`, error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Update todo for the authenticated user
router.put("/:id", async (req, res) => {
  console.log(`[todos] PUT /:id - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[todos] PUT /:id - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { id } = req.params;
    const { title, description, category, priority, dueDate, completed } = req.body;
    console.log(`[todos] PUT /:id - userId=${userId} id=${id}`, {
      title,
      description: description?.length || 0,
      category,
      priority,
      dueDate,
      completed,
    });

    const todo = await Todo.findOne({ _id: id, userId });

    if (!todo) {
      console.log(`[todos] PUT /:id - Not found: id=${id} userId=${userId}`);
      return res.status(404).json({ error: "Todo not found" });
    }

    // Update fields explicitly
    if (title !== undefined) todo.title = title;
    if (description !== undefined) todo.description = description;
    if (category !== undefined) todo.category = category;
    if (priority !== undefined) todo.priority = priority;
    if (completed !== undefined) todo.completed = completed;
    if (dueDate !== undefined) {
      todo.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updatedTodo = await todo.save();
    
    console.log(`[todos] PUT /:id - Success: Updated todo ${id} for user ${userId}`);
    res.json(updatedTodo);
  } catch (error) {
    console.log(`[todos] PUT /:id - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete todo for the authenticated user
router.delete("/:id", async (req, res) => {
  console.log(`[todos] DELETE /:id - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[todos] DELETE /:id - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { id } = req.params;
    console.log(`[todos] DELETE /:id - userId=${userId} id=${id}`);

    const todo = await Todo.findOne({ _id: id, userId });

    if (!todo) {
      console.log(`[todos] DELETE /:id - Not found: id=${id} userId=${userId}`);
      return res.status(404).json({ error: "Todo not found" });
    }

    await Todo.deleteOne({ _id: id, userId });
    
    console.log(`[todos] DELETE /:id - Success: Deleted todo ${id} for user ${userId}`);
    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.log(`[todos] DELETE /:id - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Toggle todo completion status
router.patch("/:id/toggle", async (req, res) => {
  console.log(`[todos] PATCH /:id/toggle - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[todos] PATCH /:id/toggle - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { id } = req.params;
    console.log(`[todos] PATCH /:id/toggle - userId=${userId} id=${id}`);

    const todo = await Todo.findOne({ _id: id, userId });

    if (!todo) {
      console.log(`[todos] PATCH /:id/toggle - Not found: id=${id} userId=${userId}`);
      return res.status(404).json({ error: "Todo not found" });
    }

    todo.completed = !todo.completed;
    const updatedTodo = await todo.save();

    console.log(`[todos] PATCH /:id/toggle - Success: Toggled todo ${id} to completed=${todo.completed} for user ${userId}`);
    res.json(updatedTodo);
  } catch (error) {
    console.log(`[todos] PATCH /:id/toggle - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get todo statistics for the authenticated user
router.get("/stats", async (req, res) => {
  console.log(`[todos] GET /stats - Request received`);
  try {
    const userId = req.user?.uid;
    if (!userId) {
      console.log(`[todos] GET /stats - Unauthorized: No userId in token`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    console.log(`[todos] GET /stats - userId=${userId}`);

    const totalTodos = await Todo.countDocuments({ userId });
    const completedTodos = await Todo.countDocuments({
      userId,
      completed: true,
    });
    const pendingTodos = await Todo.countDocuments({
      userId,
      completed: false,
    });

    // Get category distribution
    const categoryStats = await Todo.aggregate([
      { $match: { userId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Get priority distribution
    const priorityStats = await Todo.aggregate([
      { $match: { userId } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    // Get overdue todos
    const overdueTodos = await Todo.countDocuments({
      userId,
      completed: false,
      dueDate: { $lt: new Date() },
    });

    const stats = {
      totalTodos,
      completedTodos,
      pendingTodos,
      overdueTodos,
      completionRate:
        totalTodos > 0
          ? ((completedTodos / totalTodos) * 100).toFixed(1)
          : 0,
      categoryDistribution: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      priorityDistribution: priorityStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
    };

    console.log(`[todos] GET /stats - Success:`, stats);
    res.json(stats);
  } catch (error) {
    console.log(`[todos] GET /stats - Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;