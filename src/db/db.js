import app from "../firebase/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  collection,
  getFirestore,
  serverTimestamp
} from "firebase/firestore";

const db = getFirestore(app);

/**
 * Create a new interview document inside a top-level collection named by the userId.
 * Collection path: /{userId}/
 * Document: auto-generated interview id
 *
 * Returns the created interview document id.
 */
export async function createInterview(userId, domain, level) {
  if (!userId) throw new Error("createInterview: userId is required");

  // Collection named after the userId
  const userCollectionRef = collection(db, userId);

  // Create a new document with an auto id inside that collection
  const interviewRef = doc(userCollectionRef);

  await setDoc(interviewRef, {
    domain,
    level,
    startedAt: serverTimestamp(),
    finalScore: null,
    questions: []
  });

  return interviewRef.id;
}

/**
 * Append a question result to the interview document's questions array.
 * Document path: /{userId}/{interviewId}
 *
 * This function sanitizes the input so there are no `undefined` values.
 */
export async function addInterviewQuestion(userId, interviewId, data) {
  if (!userId || !interviewId) throw new Error("addInterviewQuestion: userId and interviewId are required");

  const interviewDocRef = doc(db, userId, interviewId);

  // sanitize fields: replace undefined with safe defaults
  const sanitized = {
    question: data.question ?? "",
    answer: data.answer ?? "",
    confidence: typeof data.confidence === "number" ? data.confidence : null,
    classification: typeof data.classification === "string" ? data.classification : "unknown",
    key_indicators: Array.isArray(data.key_indicators) ? data.key_indicators : [],
    reasoning: typeof data.reasoning === "string" ? data.reasoning : "",
    human_like_score: typeof data.human_like_score === "number" ? data.human_like_score : null,
    analysis_summary: typeof data.analysis_summary === "string" ? data.analysis_summary : "",
    // savedAt: serverTimestamp()
  };

  await updateDoc(interviewDocRef, {
    questions: arrayUnion(sanitized)
  });
}

/**
 * Save the final score and mark interview as finished.
 * Document path: /{userId}/{interviewId}
 */
export async function finishInterview(userId, interviewId, scoreAi, scoreCorectness) {
  if (!userId || !interviewId) throw new Error("finishInterview: userId and interviewId are required");

  const interviewDocRef = doc(db, userId, interviewId);

  await updateDoc(interviewDocRef, {
    scoreAi: scoreAi,
    scoreCorectness: scoreCorectness,
    endedAt: serverTimestamp()
  });
}

/* Optional helpers you may find useful later */

// Fetch interview document reference (not fetching content here)
export function getInterviewDocRef(userId, interviewId) {
  return doc(db, userId, interviewId);
}