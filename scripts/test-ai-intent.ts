/**
 * Comprehensive Automated Test Suite for KaamWala AI Intent & Vernacular Extraction Engine
 */

import { extractIntent } from "../src/lib/ai/intentExtractor";
import { SessionContext } from "../src/lib/ai/types";

interface TestCase {
  name: string;
  query: string;
  context?: SessionContext;
  expected: {
    intent?: string;
    canonicalCategory?: string | null;
    location?: string | null;
    urgency?: string;
    budget?: number | null;
    clarificationNeeded?: boolean;
  };
}

const TEST_CASES: TestCase[] = [
  {
    name: "1. Basic Hindi Carpenter Request",
    query: "mujhe ek carpenter chahiye",
    expected: {
      intent: "find_worker",
      canonicalCategory: "carpenter",
      clarificationNeeded: false,
    },
  },
  {
    name: "2. Simple Hindi Carpenter Request",
    query: "mujhe carpenter chahiye",
    expected: {
      intent: "find_worker",
      canonicalCategory: "carpenter",
      clarificationNeeded: false,
    },
  },
  {
    name: "3. Location + Service Extraction",
    query: "Mathura me carpenter chahiye",
    expected: {
      intent: "find_worker",
      canonicalCategory: "carpenter",
      location: "Mathura",
    },
  },
  {
    name: "4. Vernacular Bijli Wala (Electrician)",
    query: "bijli wala bula do",
    expected: {
      intent: "find_worker",
      canonicalCategory: "electrician",
    },
  },
  {
    name: "5. Problem + Service (Nal kharab hai plumber)",
    query: "nal kharab hai plumber chahiye",
    expected: {
      intent: "find_worker",
      canonicalCategory: "plumber",
    },
  },
  {
    name: "6. Vernacular House-maid / Bai",
    query: "ghar saaf karne wali bai chahiye",
    expected: {
      intent: "find_worker",
      canonicalCategory: "house-maid",
    },
  },
  {
    name: "7. Urgent AC Repair",
    query: "AC repair urgent",
    expected: {
      intent: "find_worker",
      canonicalCategory: "ac-repair",
      urgency: "immediate",
    },
  },
  {
    name: "8. Ambiguous Mistri query",
    query: "mistri chahiye",
    expected: {
      intent: "clarification_needed",
      clarificationNeeded: true,
      canonicalCategory: null,
    },
  },
  {
    name: "9. Qualified Mistri - Raj Mistri (Mason)",
    query: "raj mistri chahiye",
    expected: {
      intent: "find_worker",
      canonicalCategory: "mason",
      clarificationNeeded: false,
    },
  },
  {
    name: "10. Qualified Mistri - Car Mistri (Mechanic)",
    query: "car mistri chahiye",
    expected: {
      intent: "find_worker",
      canonicalCategory: "mechanic",
      clarificationNeeded: false,
    },
  },
  {
    name: "11. Budget Extraction (500 ke andar)",
    query: "500 ke andar carpenter chahiye",
    expected: {
      intent: "find_worker",
      canonicalCategory: "carpenter",
      budget: 500,
    },
  },
  {
    name: "12. Urgency Extraction (Aaj hi plumber chahiye)",
    query: "aaj hi plumber chahiye",
    expected: {
      intent: "find_worker",
      canonicalCategory: "plumber",
      urgency: "immediate",
    },
  },
  {
    name: "13. Pure Vernacular Badhai (Carpenter)",
    query: "badhai chahiye",
    expected: {
      intent: "find_worker",
      canonicalCategory: "carpenter",
    },
  },
  {
    name: "14. Problem Phrase Only (Pipe leak ho gaya)",
    query: "pipe leak ho gaya",
    expected: {
      intent: "find_worker",
      canonicalCategory: "plumber",
    },
  },
  {
    name: "15. Multi-Turn Session Continuation (Location addition)",
    query: "Mathura me",
    context: {
      lastCategory: "carpenter",
    },
    expected: {
      intent: "find_worker",
      canonicalCategory: "carpenter",
      location: "Mathura",
    },
  },
];

function runTests() {
  console.log("==================================================");
  console.log("  Running KaamWala AI Intent & Vernacular Tests  ");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  for (const test of TEST_CASES) {
    const result = extractIntent(test.query, test.context);
    const failures: string[] = [];

    if (test.expected.intent && result.intent !== test.expected.intent) {
      failures.push(`Intent: expected '${test.expected.intent}', got '${result.intent}'`);
    }

    if (test.expected.canonicalCategory !== undefined && result.canonicalCategory !== test.expected.canonicalCategory) {
      failures.push(`Category: expected '${test.expected.canonicalCategory}', got '${result.canonicalCategory}'`);
    }

    if (test.expected.location && result.extractedEntities.location?.toLowerCase() !== test.expected.location.toLowerCase()) {
      failures.push(`Location: expected '${test.expected.location}', got '${result.extractedEntities.location}'`);
    }

    if (test.expected.urgency && result.extractedEntities.urgency !== test.expected.urgency) {
      failures.push(`Urgency: expected '${test.expected.urgency}', got '${result.extractedEntities.urgency}'`);
    }

    if (test.expected.budget !== undefined && result.extractedEntities.budget !== test.expected.budget) {
      failures.push(`Budget: expected ${test.expected.budget}, got ${result.extractedEntities.budget}`);
    }

    if (test.expected.clarificationNeeded !== undefined && result.clarificationNeeded !== test.expected.clarificationNeeded) {
      failures.push(`ClarificationNeeded: expected ${test.expected.clarificationNeeded}, got ${result.clarificationNeeded}`);
    }

    if (failures.length === 0) {
      console.log(`✅ PASS: ${test.name}`);
      console.log(`   Query: "${test.query}"`);
      console.log(`   Result: Category=${result.canonicalCategory || "none"}, Loc=${result.extractedEntities.location || "none"}, Urg=${result.extractedEntities.urgency}, Bud=${result.extractedEntities.budget || "none"}, Lang=${result.detectedLanguage}`);
      console.log(`   Reply: "${result.replyMessage}"\n`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${test.name}`);
      console.error(`   Query: "${test.query}"`);
      for (const f of failures) {
        console.error(`   - ${f}`);
      }
      console.error(`   Full Result:`, JSON.stringify(result, null, 2), "\n");
      failed++;
    }
  }

  // Also test 4-step multi-turn flow end-to-end
  console.log("--- End-to-End Multi-Turn Session Test ---");
  let sessionCtx: SessionContext = {};
  
  // Turn 1
  const turn1 = extractIntent("badhai chahiye", sessionCtx);
  console.log(`Turn 1: "badhai chahiye" -> Category: ${turn1.canonicalCategory}`);
  sessionCtx = { lastCategory: turn1.canonicalCategory || undefined };

  // Turn 2
  const turn2 = extractIntent("Mathura me", sessionCtx);
  console.log(`Turn 2: "Mathura me" -> Category: ${turn2.canonicalCategory}, Location: ${turn2.extractedEntities.location}`);
  sessionCtx = { ...sessionCtx, lastLocation: turn2.extractedEntities.location || undefined };

  // Turn 3
  const turn3 = extractIntent("jo abhi available ho", sessionCtx);
  console.log(`Turn 3: "jo abhi available ho" -> Category: ${turn3.canonicalCategory}, Location: ${turn3.extractedEntities.location}, Urgency: ${turn3.extractedEntities.urgency}`);
  sessionCtx = { ...sessionCtx, lastUrgency: turn3.extractedEntities.urgency };

  // Turn 4
  const turn4 = extractIntent("500 ke andar", sessionCtx);
  console.log(`Turn 4: "500 ke andar" -> Category: ${turn4.canonicalCategory}, Location: ${turn4.extractedEntities.location}, Urgency: ${turn4.extractedEntities.urgency}, Budget: ${turn4.extractedEntities.budget}`);

  const multiTurnValid =
    turn4.canonicalCategory === "carpenter" &&
    turn4.extractedEntities.location?.toLowerCase() === "mathura" &&
    turn4.extractedEntities.urgency === "immediate" &&
    turn4.extractedEntities.budget === 500;

  if (multiTurnValid) {
    console.log("✅ PASS: 4-turn conversational state preserved accurately across turns!\n");
    passed++;
  } else {
    console.error("❌ FAIL: Multi-turn state did not preserve all entities.\n");
    failed++;
  }

  console.log("==================================================");
  console.log(`  Summary: ${passed} Passed, ${failed} Failed out of ${TEST_CASES.length + 1} tests`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
