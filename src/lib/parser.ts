// Smart parser for Droplet entries
// Detects people, action items, and emotional signals from free text

export interface ParsedDroplet {
  originalText: string;
  detectedPeople: string[];
  detectedActions: string[];
  emotionalSignal: "neutral" | "positive" | "negative" | "urgent";
  suggestedPebbles: { title: string; weight: "light" | "steady" | "heavy" }[];
  suggestedRings: { name: string; weather: "warm" | "cloudy" | "still" | "stormy" }[];
}

// Common action verbs that signal a task
const ACTION_PATTERNS = [
  /\bneed(?:s)?\s+to\s+(.+?)(?:\.|,|$)/gi,
  /\bshould\s+(.+?)(?:\.|,|$)/gi,
  /\bhave\s+to\s+(.+?)(?:\.|,|$)/gi,
  /\bgotta\s+(.+?)(?:\.|,|$)/gi,
  /\bremember\s+to\s+(.+?)(?:\.|,|$)/gi,
  /\bdon'?t\s+forget\s+(?:to\s+)?(.+?)(?:\.|,|$)/gi,
  /\bmust\s+(.+?)(?:\.|,|$)/gi,
  /\bwant(?:s)?\s+to\s+(.+?)(?:\.|,|$)/gi,
  /\bgoing\s+to\s+(.+?)(?:\.|,|$)/gi,
  /\bplan(?:ning)?\s+to\s+(.+?)(?:\.|,|$)/gi,
  /\bcall\s+(.+?)(?:\s+back|\s+again)?(?:\.|,|$)/gi,
  /\btext\s+(.+?)(?:\.|,|$)/gi,
  /\bcheck\s+(?:in\s+)?(?:on|with)\s+(.+?)(?:\.|,|$)/gi,
  /\bbuy\s+(.+?)(?:\.|,|$)/gi,
  /\bfix\s+(.+?)(?:\.|,|$)/gi,
  /\bfinish\s+(.+?)(?:\.|,|$)/gi,
  /\bschedule\s+(.+?)(?:\.|,|$)/gi,
  /\bbook\s+(.+?)(?:\.|,|$)/gi,
];

// People detection: words after relational terms
const PEOPLE_PATTERNS = [
  /\b(?:spoke|talked|chatted)\s+(?:to|with)\s+(\w+)/gi,
  /\b(?:called|texted|messaged)\s+(\w+)/gi,
  /\b(?:met|saw|visited)\s+(\w+)/gi,
  /\b(?:with)\s+(\w+)\s+(?:today|yesterday|last)/gi,
  /\b(?:mum|mom|dad|mama|papa|baba|amma|appa)\b/gi,
  /\b(?:brother|sister|bro|sis)\b/gi,
  /\b(?:my\s+(?:friend|partner|girlfriend|boyfriend|wife|husband|roommate))\s+(\w+)?/gi,
  /\bcheck\s+(?:in\s+)?(?:on|with)\s+(\w+)/gi,
  /\bcall\s+(\w+)/gi,
];

// Emotional signal words
const NEGATIVE_SIGNALS = [
  "worried", "anxious", "stressed", "upset", "angry", "frustrated",
  "sad", "lonely", "exhausted", "overwhelmed", "confused", "hurt",
  "not feeling great", "wasn't feeling", "not good", "struggling",
  "tired", "drained", "stuck", "lost", "scared", "nervous",
  "annoyed", "disappointed", "guilty", "broken",
];

const POSITIVE_SIGNALS = [
  "happy", "grateful", "excited", "proud", "peaceful", "calm",
  "inspired", "motivated", "loved", "content", "hopeful", "great",
  "amazing", "wonderful", "beautiful", "good conversation",
  "felt good", "feeling good", "better", "relieved",
];

const URGENT_SIGNALS = [
  "urgent", "asap", "immediately", "right now", "can't wait",
  "deadline", "overdue", "forgot to", "emergency", "critical",
  "running out", "last chance", "expiring",
];

// Words to exclude from people detection
const EXCLUDE_NAMES = new Set([
  "i", "me", "my", "we", "us", "you", "they", "them", "it", "the",
  "a", "an", "and", "or", "but", "so", "if", "in", "on", "at",
  "to", "for", "up", "out", "off", "back", "again", "today",
  "yesterday", "tomorrow", "something", "someone", "about", "that",
  "this", "some", "work", "home", "school", "office",
]);

// Family terms that are people but not names
const FAMILY_TERMS: Record<string, string> = {
  mum: "mum", mom: "mom", mama: "mama", amma: "amma",
  dad: "dad", papa: "papa", baba: "baba", appa: "appa",
  brother: "brother", sister: "sister", bro: "brother", sis: "sister",
};

export function parseDroplet(text: string): ParsedDroplet {
  const lower = text.toLowerCase();
  const detectedPeople: string[] = [];
  const detectedActions: string[] = [];

  // --- Detect people ---
  for (const pattern of PEOPLE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(lower)) !== null) {
      // Check for family terms first
      for (const [term, label] of Object.entries(FAMILY_TERMS)) {
        if (match[0].includes(term)) {
          if (!detectedPeople.includes(label)) {
            detectedPeople.push(label);
          }
        }
      }
      // Check captured group for a name
      const captured = match[1]?.trim();
      if (captured && !EXCLUDE_NAMES.has(captured) && !FAMILY_TERMS[captured]) {
        const capitalized = captured.charAt(0).toUpperCase() + captured.slice(1);
        if (!detectedPeople.includes(capitalized) && capitalized.length > 1) {
          detectedPeople.push(capitalized);
        }
      }
    }
  }

  // --- Detect actions ---
  for (const pattern of ACTION_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const action = match[1]?.trim();
      if (action && action.length > 2 && action.length < 80) {
        // Clean up the action
        let cleaned = action.replace(/[.!,]+$/, "").trim();
        // Don't add if it's just a name
        if (!EXCLUDE_NAMES.has(cleaned.toLowerCase()) && cleaned.length > 2) {
          detectedActions.push(cleaned);
        }
      }
    }
  }

  // --- Detect emotional signal ---
  let emotionalSignal: ParsedDroplet["emotionalSignal"] = "neutral";

  if (URGENT_SIGNALS.some((s) => lower.includes(s))) {
    emotionalSignal = "urgent";
  } else if (NEGATIVE_SIGNALS.some((s) => lower.includes(s))) {
    emotionalSignal = "negative";
  } else if (POSITIVE_SIGNALS.some((s) => lower.includes(s))) {
    emotionalSignal = "positive";
  }

  // --- Build suggestions ---
  const suggestedPebbles = detectedActions.map((action) => {
    // Determine weight from emotional signal
    const weight =
      emotionalSignal === "urgent"
        ? "heavy" as const
        : emotionalSignal === "negative"
        ? "steady" as const
        : "light" as const;

    return { title: action, weight };
  });

  // If a person is mentioned with a negative signal, suggest checking in
  for (const person of detectedPeople) {
    if (emotionalSignal === "negative" || emotionalSignal === "urgent") {
      const alreadyHasCheckIn = suggestedPebbles.some(
        (p) => p.title.toLowerCase().includes(person.toLowerCase())
      );
      if (!alreadyHasCheckIn) {
        suggestedPebbles.push({
          title: `check in with ${person}`,
          weight: "steady",
        });
      }
    }
  }

  const suggestedRings = detectedPeople.map((name) => {
    const weather =
      emotionalSignal === "negative" || emotionalSignal === "urgent"
        ? "cloudy" as const
        : emotionalSignal === "positive"
        ? "warm" as const
        : "still" as const;
    return { name, weather };
  });

  return {
    originalText: text,
    detectedPeople,
    detectedActions,
    emotionalSignal,
    suggestedPebbles,
    suggestedRings,
  };
}
