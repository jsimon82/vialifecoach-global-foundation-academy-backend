import { acknowledgeQuizRules, hasAcceptedQuizRules } from "../models/Quiz.model.js";

const QUIZ_RULES = {
  title: "Quiz Conditions and Exam Rules",
  intro:
    "Before starting, read and accept these conditions. These rules protect exam fairness and learner integrity.",
  conditions: [
    "You are allowed to move forward and backward between quiz questions.",
    "Copying quiz questions, options, or explanations is not allowed.",
    "Pasting content from outside sources into quiz answers is not allowed.",
    "Do not open external notes, AI tools, or search engines during the quiz.",
    "If time expires, the quiz will auto-submit with current answers.",
    "Any attempt to bypass restrictions may invalidate the attempt.",
  ],
  process: [
    "Step 1: Read the rules carefully.",
    "Step 2: Click accept to confirm you understand the conditions.",
    "Step 3: Start the quiz and answer within the time limit.",
    "Step 4: Submit manually or wait for auto-submit when time ends.",
  ],
};

export async function getQuizRulesController(req, res) {
  return res.json({ success: true, data: QUIZ_RULES });
}

export async function acknowledgeQuizRulesController(req, res) {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const accepted = await acknowledgeQuizRules(req.user.id, courseId);
    return res.json({ success: true, data: accepted });
  } catch (error) {
    console.error("Error acknowledging quiz rules:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getQuizRulesAcceptanceStatusController(req, res) {
  try {
    const { courseId } = req.params;
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const accepted = await hasAcceptedQuizRules(req.user.id, courseId);
    return res.json({ success: true, data: { accepted } });
  } catch (error) {
    console.error("Error getting quiz rules acceptance status:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
