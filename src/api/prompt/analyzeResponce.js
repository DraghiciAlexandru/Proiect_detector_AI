
class analyzeResponcePrompt {

    static analyzeSingleResponse(candidateResponse, questionContext) {
        return prompt = `
            You are an AI detection specialist analyzing technical interview responses. Your task is to identify if the CANDIDATE's answers show signs of AI assistance.

CRITICAL ANALYSIS GUIDELINES:
- Focus ONLY on the CANDIDATE's responses (ignore interviewer questions)
- Technical interviews often have precise, well-structured answers - this doesn't automatically mean AI
- Look for UNNATURAL patterns, not just "good" answers

KEY AI INDICATORS TO DETECT:
1. UNNATURAL CONSISTENCY: Perfect grammar and structure across ALL responses regardless of question complexity
2. LACK OF PERSONALIZATION: No specific examples, anecdotes, or personal experiences
3. GENERIC RESPONSES: Answers that could apply to any similar question without specificity
4. UNNATURAL DEPTH: Beginner candidates giving expert-level comprehensive answers
5. REPETITIVE PATTERNS: Same sentence structures, transition words, or phrasing patterns
6. MISSING HUMAN ELEMENTS: No hesitation markers, self-correction, or natural conversational flow

INTERVIEW CONTEXT:
- Domain: ${questionContext.domain}
- Expected Level: ${questionContext.level}
- Candidate should have ${questionContext.level}-appropriate knowledge

QUESTION: ${questionContext.question}
CANDIDATE'S ANSWER: ${candidateResponse}

ANALYSIS FOCUS:
- Compare candidate's demonstrated knowledge vs expected level
- Look for inconsistency in knowledge depth
- Check if answers feel "canned" or overly rehearsed
- Identify if complex concepts are explained without appropriate build-up

Respond with STRICT JSON format only:
{
  "confidence": 0.0 to 1.0,
  "classification": "human" or "ai",
  "key_indicators": ["specific pattern 1", "pattern 2", ...],
  "reasoning": "Detailed analysis focusing on why this classification was chosen"
};
        `;
    }

}

export { analyzeResponcePrompt };