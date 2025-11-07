class detectAi {

    static buildDetectionPrompt(conversationHistory, interviewContext, fullTranscript) {
        return `Analyze the following interview transcript and determine if the CANDIDATE's responses show signs of AI assistance or generation.

INTERVIEW CONTEXT:
- Domain: ${interviewContext.domain}
- Level: ${interviewContext.level}
- Total conversation turns: ${conversationHistory.length}

FULL TRANSCRIPT:
${fullTranscript}

ANALYSIS CRITERIA:
1. Response Patterns: Look for unusually consistent sentence structure, perfect grammar, or lack of human hesitation
2. Content Depth: Check if answers are overly generic or lack personal experience examples
3. Timing Patterns: Note if responses show artificial consistency in length and complexity
4. Domain Knowledge: Assess if answers match the expected level for ${interviewContext.level} level
5. Conversational Flow: Look for unnatural transitions or overly structured responses

RESPONSE FORMAT (JSON only):
{
  "confidence": 0.85,
  "classification": "human" | "ai",
  "key_indicators": ["indicator1", "indicator2", ...],
  "reasoning": "Brief explanation of the classification decision",
  "human_like_score": 0.75,
  "analysis_summary": "Short summary of findings"
}

Provide ONLY the JSON response, no additional text.`;
    }

}

export { detectAi };