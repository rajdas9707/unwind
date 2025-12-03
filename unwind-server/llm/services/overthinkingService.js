const { queryAI } = require("./aiService");
const { logError } = require("../utils/errorHandler");

/**
 * AI-powered Overthinking Processing Service
 * Generates solutions, categorizes thoughts, and determines intensity levels
 */

/**
 * Process overthinking entry with AI analysis
 * @param {string} thought - The overthinking description (required)
 * @param {string} userSolution - Optional solution provided by user
 * @returns {Object} Processed overthinking data with AI-generated fields
 */
async function processOverthinkingEntry(
  title,
  thought,
  userSolution = solution
) {
  console.log(title, thought, userSolution);
  if (!thought || !thought.trim()) {
    throw new Error("Thought description is required");
  }

  try {
    // Create comprehensive prompt for AI processing
    const analysisPrompt = `Analyze the user's overthinking input and respond ONLY in the JSON format below.

Tone: calm, brief,neutral, and supportive. No diagnosing or long explanations.

User Input:"${title}"
Description: "${thought}"
Suggested Solution: "${userSolution || ""}"

Rules:
- Keep each field short.
- Max word limits:
  thought (≤50 words)
  solution (≤20 words)
  triggers (each ≤6 words)
  patterns (each ≤5 words)
  coping_strategies (each ≤8 words)
  reframe (≤20 words)
- Choose ONE category: work, relationships, health, finance, future, past, other.
- Intensity: 1–10 based on emotional weight.

Return ONLY this JSON:

{
  "thought": "",
  "solution": "",
  "triggers": [""],
  "patterns": [""],
  "coping_strategies": [""],
  "reframe": "",
  "category": "",
  "intensity": 0
}
`;

    const aiResponse = await queryAI(analysisPrompt, {
      max_tokens: 300,
      temperature: 0.7,
    });

    // Parse the AI response

    // Validate and sanitize the response

    // Attempt to parse JSON directly
    let parsedResponse;

    try {
      const clean = aiResponse.response.replace(/```json|```/g, "").trim();
      parsedResponse = JSON.parse(clean);
    } catch (err) {
      console.error("AI did not return valid JSON:", aiResponse.response);
      throw new Error("Invalid AI response format");
    }

    // --- Return parsed safely with fallbacks on missing fields --- //

    return {
      thought: parsedResponse.thought ?? "",
      solution: parsedResponse.solution ?? "",
      triggers: parsedResponse.triggers ?? [],
      patterns: parsedResponse.patterns ?? [],
      coping_strategies: parsedResponse.coping_strategies ?? [],
      reframe: parsedResponse.reframe ?? "",
      category: parsedResponse.category ?? "other",
      intensity: Math.min(Math.max(parsedResponse.intensity ?? 5, 1), 10),
    };
  } catch (error) {
    logError(error, "Overthinking Processing Service");
    console.error("Error processing overthinking entry:", error);
    // Return fallback values if AI processing fails
    // return {
    //   thought_summary:
    //     "Experiencing personal concerns and overthinking patterns.",
    //   solution:
    //     userSolution ||
    //     "Take a moment to breathe deeply. Consider writing down your thoughts to help process them more clearly.",
    //   category: "other",
    //   intensity: 5,
    //   triggers: [],
    //   patterns: [],
    //   coping_strategies: ["Take deep breaths", "Focus on what you can control"],
    //   reframe: "",
    //   urgency: "medium",
    // };
  }
}

/**
 * Validate and normalize category
 * @param {string} category
 * @returns {string} Valid category
 */
function validateCategory(category) {
  const validCategories = [
    "work",
    "relationships",
    "health",
    "finance",
    "future",
    "past",
    "other",
  ];

  if (!category || typeof category !== "string") {
    return "other";
  }

  const normalizedCategory = category.toLowerCase().trim();
  return validCategories.includes(normalizedCategory)
    ? normalizedCategory
    : "other";
}

/**
 * Validate and normalize intensity
 * @param {number|string} intensity
 * @returns {number} Valid intensity (1-10)
 */
function validateIntensity(intensity) {
  const numericIntensity =
    typeof intensity === "string" ? parseInt(intensity) : intensity;

  if (isNaN(numericIntensity)) {
    return 5; // Default to moderate intensity
  }

  return Math.min(Math.max(Math.round(numericIntensity), 1), 10);
}

/**
 * Generate enhanced solution based on existing entry
 * @param {string} thought - The original thought
 * @param {string} currentSolution - Current solution in DB
 * @returns {Object} Enhanced solution
 */
async function enhanceSolution(thought, currentSolution = "") {
  try {
    const enhancementPrompt = `
Improve and enhance this solution for the overthinking pattern:

Original Thought: "${thought}"
Current Solution: "${currentSolution}"

Please provide an improved, more detailed solution that:
- Builds upon the current solution if it exists
- Adds specific, actionable steps
- Includes coping strategies
- Remains supportive and encouraging

Keep the response concise but helpful (max 200 words).
    `.trim();

    const aiResponse = await queryAI(enhancementPrompt, {
      max_tokens: 250,
      temperature: 0.6,
    });

    return {
      solution: aiResponse.response,
    };
  } catch (error) {
    logError(error, "Solution Enhancement Service");
    return {
      solution:
        currentSolution ||
        "Focus on taking one step at a time and remember that this feeling will pass.",
    };
  }
}

/**
 * Validate and clean array fields
 * @param {Array} array
 * @returns {Array} Valid array with max 3 items
 */
function validateArrayField(array) {
  if (!Array.isArray(array)) {
    return [];
  }

  return array
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .slice(0, 3)
    .map((item) => item.trim());
}

/**
 * Validate and normalize urgency
 * @param {string} urgency
 * @returns {string} Valid urgency level
 */
function validateUrgency(urgency) {
  const validUrgencies = ["low", "medium", "high"];

  if (!urgency || typeof urgency !== "string") {
    return "medium";
  }

  const normalizedUrgency = urgency.toLowerCase().trim();
  return validUrgencies.includes(normalizedUrgency)
    ? normalizedUrgency
    : "medium";
}

module.exports = {
  processOverthinkingEntry,
  enhanceSolution,
  validateCategory,
  validateIntensity,
  validateArrayField,
  validateUrgency,
};
