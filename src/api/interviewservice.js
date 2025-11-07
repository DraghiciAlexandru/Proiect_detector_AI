import axios from "axios";

import questions from "../questions/questions.js";
// Usage example and exports
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;


class InterviewService {
    constructor(apiKey, baseModel = "gpt-4") {
        this.apiKey = apiKey;
        this.baseModel = baseModel;
        this.baseUrl = "https://api.openai.com/v1/chat/completions";
        this.questionsDatabase = new Map(); // Will store questions by domain and level
        this.askedQuestions = new Set(); // Track asked questions to avoid repetition
    }

    // Initialize with questions from your file
    loadQuestions(questionsData) {
        // Expected structure: { domain: { level: [array of questions] } }
        // Example: { "JavaScript": { "beginner": ["What is closure?", ...], "advanced": [...] } }
        this.questionsDatabase = new Map(Object.entries(questionsData));
    }

    // Define interviewer roles for different domains
    getInterviewerRole(domain) {
        const roles = {
            "JavaScript": "Senior JavaScript Developer at Google",
            "Python": "Python Tech Lead at a AI startup",
            "React": "React Core Team Member",
            "Node.js": "Backend Architect at Netflix",
            "AI/ML": "Machine Learning Research Scientist",
            "DevOps": "Site Reliability Engineer at AWS",
            "default": "Technical Interviewer"
        };
        return roles[domain] || roles.default;
    }

    // Build the main interview question prompt
    buildQuestionPrompt(domain, level, currentQuestion, conversationHistory = []) {
        const role = this.getInterviewerRole(domain);

        return `You are ${role}, conducting a technical interview for a ${level} level candidate.

DOMAIN: ${domain}
LEVEL: ${level}
CURRENT QUESTION: "${currentQuestion}"

INTERVIEW INSTRUCTIONS:
1. Ask this question clearly and professionally
2. Adapt the phrasing based on the candidate's level (${level})
3. Maintain your role as ${role}
4. Be concise but clear
5. Do not provide hints or answers
6. Wait for the candidate's response

${conversationHistory.length > 0 ? 'CONVERSATION HISTORY:\n' + conversationHistory.join('\n') + '\n' : ''}

Ask the question now:`;
    }

    // Get a random question from the database
    getRandomQuestion(domain, level) {
        if (!this.questionsDatabase.has(domain)) {
            throw new Error(`Domain "${domain}" not found in questions database`);
        }

        const domainQuestions = this.questionsDatabase.get(domain);
        if (!domainQuestions[level]) {
            throw new Error(`Level "${level}" not found for domain "${domain}"`);
        }

        const availableQuestions = domainQuestions[level].filter(
            q => !this.askedQuestions.has(`${domain}-${level}-${q}`)
        );

        if (availableQuestions.length === 0) {
            // Reset if all questions have been asked
            this.askedQuestions.clear();
            return domainQuestions[level][0];
        }

        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const selectedQuestion = availableQuestions[randomIndex];

        // Mark as asked
        this.askedQuestions.add(`${domain}-${level}-${selectedQuestion}`);

        return selectedQuestion;
    }

    // Generate an interview question with context
    async generateInterviewQuestion(domain, level, conversationHistory = []) {
        const currentQuestion = this.getRandomQuestion(domain, level);
        const prompt = this.buildQuestionPrompt(domain, level, currentQuestion, conversationHistory);

        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
        };

        const data = {
            model: this.baseModel,
            messages: [
                {
                    role: "system",
                    content: `You are a technical interviewer. Stay in character and ask questions clearly.`
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 150
        };

        try {
            const response = await axios.post(this.baseUrl, data, { headers });
            const interviewerQuestion = response.data.choices[0].message.content;

            return {
                originalQuestion: currentQuestion,
                interviewerQuestion: interviewerQuestion,
                domain: domain,
                level: level,
                role: this.getInterviewerRole(domain)
            };
        } catch (error) {
            console.error(
                "Error generating interview question:",
                error.response ? error.response.data : error.message
            );
            throw error;
        }
    }

    // Build follow-up question based on candidate's answer
    buildFollowUpPrompt(domain, level, originalQuestion, candidateAnswer, role) {
        return `You are ${role}. The candidate just answered your question.

ORIGINAL QUESTION: "${originalQuestion}"
CANDIDATE'S ANSWER: "${candidateAnswer}"
DOMAIN: ${domain}
LEVEL: ${level}

Based on their answer, provide:
1. A brief acknowledgment
2. A relevant follow-up question or clarification request
3. Keep it professional and focused

Your response:`;
    }

    async generateFollowUpQuestion(domain, level, originalQuestion, candidateAnswer) {
        const role = this.getInterviewerRole(domain);
        const prompt = this.buildFollowUpPrompt(domain, level, originalQuestion, candidateAnswer, role);

        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
        };

        const data = {
            model: this.baseModel,
            messages: [
                {
                    role: "system",
                    content: `You are a technical interviewer conducting a follow-up.`
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 100
        };

        try {
            const response = await axios.post(this.baseUrl, data, { headers });
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error(
                "Error generating follow-up question:",
                error.response ? error.response.data : error.message
            );
            throw error;
        }
    }

    async runAIDetection(conversationHistory, interviewContext) {
        const detectionPrompt = this.buildDetectionPrompt(conversationHistory, interviewContext);

        const url = "https://api.openai.com/v1/chat/completions";

        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        };

        const data = {
            model: this.baseModel,
            messages: [
                {
                    role: "system",
                    content: "You are an AI detection specialist. Analyze text for signs of AI generation."
                },
                {
                    role: "user",
                    content: detectionPrompt
                }
            ],
            temperature: 0.3 // Lower for more consistent analysis
        };

        try {
            const response = await axios.post(url, data, { headers });
            const detectionResult = response.data.choices[0].message.content;

            return this.parseDetectionResult(detectionResult, conversationHistory);
        } catch (error) {
            console.error('AI detection failed:', error);
            return this.getFallbackDetection(conversationHistory);
        }
    }

    buildDetectionPrompt(conversationHistory, interviewContext) {
        const fullTranscript = conversationHistory.join('\n\n');

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


    parseDetectionResult(detectionResult, conversationHistory) {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(detectionResult);
            return {
                ...parsed,
                raw_data: detectionResult,
                service: 'chatgpt-ai-detection',
                transcript_length: conversationHistory.length
            };
        } catch (error) {
            // Fallback: extract information from text response
            return parseTextDetectionResult(detectionResult, conversationHistory);
        }
    }

    parseTextDetectionResult(textResult, conversationHistory) {
        // Simple text parsing as fallback
        const confidence = textResult.toLowerCase().includes('high confidence') ? 0.8 :
            textResult.toLowerCase().includes('low confidence') ? 0.3 : 0.5;

        const classification = textResult.toLowerCase().includes('ai') ? 'ai' :
            textResult.toLowerCase().includes('human') ? 'human' : 'uncertain';

        return {
            confidence,
            classification,
            key_indicators: ['fallback_analysis'],
            reasoning: textResult.substring(0, 200), // Truncate long responses
            human_like_score: classification === 'human' ? confidence : 1 - confidence,
            analysis_summary: 'Fallback analysis due to JSON parsing failure',
            raw_data: textResult,
            service: 'chatgpt-ai-detection-fallback',
            transcript_length: conversationHistory.length
        };
    }

    getFallbackDetection(conversationHistory) {
        // Ultimate fallback if everything fails
        return {
            confidence: 0.5,
            classification: 'uncertain',
            key_indicators: ['system_failure'],
            reasoning: 'Detection system unavailable, manual review required',
            human_like_score: 0.5,
            analysis_summary: 'System error in AI detection',
            raw_data: null,
            service: 'fallback',
            transcript_length: conversationHistory.length
        };
    }

    // Real-time analysis during interview (optional)
    async analyzeSingleResponse(candidateResponse, questionContext) {
        const prompt = `
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

        const url = "https://api.openai.com/v1/chat/completions";

        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        };

        const data = {
            model: this.baseModel,
            messages: [
                {
                    role: "system",
                    content: "You are an AI detection specialist. Analyze text for signs of AI generation."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.3 // Lower for more consistent analysis
        };

        try {
            const response = await axios.post(url, data, { headers });
            const result = response.data.choices[0].message.content;

            return JSON.parse(result);
        } catch (error) {
            return { ai_likelihood: "unknown", red_flags: [], notes: "Analysis failed" };
        }
    }

    // Get available domains and levels
    getAvailableDomains() {
        return Array.from(this.questionsDatabase.keys());
    }

    getAvailableLevels(domain) {
        if (!this.questionsDatabase.has(domain)) return [];
        return Object.keys(this.questionsDatabase.get(domain));
    }

    // Reset interview session
    resetInterview() {
        this.askedQuestions.clear();
    }

    // Configuration methods
    setModel(model) {
        this.baseModel = model;
        return this;
    }

    addCustomRole(domain, roleDescription) {
        this.customRoles = this.customRoles || {};
        this.customRoles[domain] = roleDescription;
        return this;
    }
}


// Create and configure the service
const interviewService = new InterviewService(apiKey);
interviewService.loadQuestions(questions);

// Export for use in your app
export default interviewService;

// Convenience functions for common use cases
// export const generateQuestion = (domain, level) =>
//     interviewService.generateInterviewQuestion(domain, level);

// export const generateFollowUp = (domain, level, originalQuestion, candidateAnswer) =>
//     interviewService.generateFollowUpQuestion(domain, level, originalQuestion, candidateAnswer);

// export const getDomains = () => interviewService.getAvailableDomains();
// export const getLevels = (domain) => interviewService.getAvailableLevels(domain);