import axios from "axios";

import questions from "../questions/questions.js";
import { singleQuestion } from "./prompt/singleQuestion.js"
import { followUpQuestion } from "./prompt/followUp.js";
import { wellcomePrompt } from "./prompt/wellcomePrompt.js";
import { detectAi } from "./prompt/detectAi.js";
import { analyzeResponcePrompt } from "./prompt/analyzeResponce.js";

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
            "JavaScript": "Senior JavaScript Developer",
            "Python": "Python Tech Lead",
            "React": "React Core Developer",
            "Node.js": "Backend Architect",
            "AI/ML": "Machine Learning Research Scientist",
            "DevOps": "Site Reliability Engineer",
            "default": "Technical Interviewer"
        };
        return roles[domain] || roles.default;
    }

    // Build the main interview question prompt
    buildQuestionPrompt(domain, level, currentQuestion, conversationHistory = []) {
        const role = this.getInterviewerRole(domain);

        return singleQuestion.buildQuestionPrompt(domain, level, currentQuestion, conversationHistory, role);
    }

    async getIntroductionMessage(domain, level) {
        const role = this.getInterviewerRole(domain);
        const prompt =  wellcomePrompt.buildIntroductionPrompt(domain, level, role);

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
            const msg = response.data.choices[0].message.content;
            
            return msg;
        } catch (error) {
            console.error(
                "Error generating welcome message:",
                error.response ? error.response.data : error.message
            );
            throw error;
        }

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
        return followUpQuestion.buildFollowUpPrompt(domain, level, originalQuestion, candidateAnswer, role);
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

        return detectAi.buildDetectionPrompt(conversationHistory, interviewContext, fullTranscript);
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
        const prompt = analyzeResponcePrompt.analyzeSingleResponse(candidateResponse, questionContext);

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