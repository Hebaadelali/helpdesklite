import "dotenv/config";
import { CATEGORIES, PRIORITIES } from "./constants.js";
import { heuristicSuggest } from "./aiHeuristic.js";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
const TIMEOUT_MS = 6000;

export async function suggestPriorityAndCategory({ subject, description }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const text = `${subject}\n${description}`;

  if (!apiKey) {
    return heuristicSuggest(text);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const prompt = [
      "You triage internal IT support tickets.",
      `Allowed priorities: ${PRIORITIES.join(", ")}.`,
      `Allowed categories: ${CATEGORIES.join(", ")}.`,
      "Given the ticket subject and description below, respond with ONLY a JSON object",
      'like {"priority":"High","category":"Technical / Network","reason":"one short sentence"}.',
      "No markdown, no extra text.",
      "",
      `Subject: ${subject}`,
      `Description: ${description}`,
    ].join("\n");

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Anthropic API returned ${res.status}`);

    const data = await res.json();
    const raw = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const parsed = JSON.parse(raw);
    if (!PRIORITIES.includes(parsed.priority) || !CATEGORIES.includes(parsed.category)) {
      throw new Error("Model returned an out-of-range priority/category");
    }

    return { ...parsed, source: "claude" };
  } catch (err) {
    // Any failure (timeout, bad JSON, network) silently degrades to the
    // heuristic so the ticket form never blocks on the AI call.
    return heuristicSuggest(text);
  } finally {
    clearTimeout(timeout);
  }
}
