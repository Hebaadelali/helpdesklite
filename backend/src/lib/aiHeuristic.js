// Instant, zero-cost fallback used when ANTHROPIC_API_KEY is not configured,
// or if the Claude call fails/times out. Keeps the AI triage feature from
// ever blocking or breaking ticket submission.

const URGENT_WORDS = ["urgent", "asap", "immediately", "can't work", "cannot work", "down", "outage", "meeting in"];
const HIGH_WORDS = ["blocked", "broken", "not working", "error", "can't connect", "cannot connect", "locked out"];

const CATEGORY_RULES = [
  { category: "Technical / Network", words: ["wifi", "wi-fi", "network", "vpn", "internet", "connection", "connect"] },
  { category: "Hardware / IT Support", words: ["laptop", "monitor", "printer", "mouse", "keyboard", "device", "hardware"] },
  { category: "Permissions / Access", words: ["access", "permission", "locked out", "can't log in", "cannot log in", "role"] },
  { category: "Software / Accounts", words: ["password", "account", "software", "app", "install", "license", "reset"] },
  { category: "Facilities", words: ["office", "desk", "chair", "ac", "air condition", "light", "room"] },
  { category: "HR / People", words: ["payroll", "leave", "hr", "vacation", "benefits", "salary"] },
];

export function heuristicSuggest(text) {
  const t = (text || "").toLowerCase();

  let priority = "Normal";
  let reason = "No urgency or blocking keywords detected.";
  if (URGENT_WORDS.some((w) => t.includes(w))) {
    priority = "Urgent";
    reason = "Language suggests a time-critical, work-blocking issue.";
  } else if (HIGH_WORDS.some((w) => t.includes(w))) {
    priority = "High";
    reason = "Description indicates something is broken or inaccessible.";
  }

  let category = "Software / Accounts";
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some((w) => t.includes(w))) {
      category = rule.category;
      break;
    }
  }

  return { priority, category, reason, source: "heuristic" };
}
