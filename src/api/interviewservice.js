import axios from "axios";

class InterviewService {
    constructor(apiKey, baseModel = "gpt-3.5-turbo") {
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

// Usage example and exports
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

// Example questions data structure (you would load this from your file)
const exampleQuestions = {
    "JavaScript": {
        "beginner": [
            "What is the difference between let, const, and var?",
            "Explain what a closure is in JavaScript",
            "What is event bubbling and how does it work?"
        ],
        "intermediate": [
            "How does the 'this' keyword work in different contexts?",
            "Explain the concept of promises and async/await",
            "What are higher-order functions and provide an example"
        ],
        "advanced": [
            "Explain the JavaScript event loop and how it handles asynchronous operations",
            "What are JavaScript generators and how are they different from async/await?",
            "How does JavaScript's prototypal inheritance work?"
        ]
    },
    "React": {
        "beginner": [
            "What are the key differences between functional and class components?",
            "What is JSX and how is it different from HTML?",
            "Explain the purpose of state and props in React"
        ],
        "intermediate": [
            "How does React's virtual DOM improve performance?",
            "What are React hooks and why were they introduced?",
            "Explain the component lifecycle in functional components"
        ],
        "advanced": [
            "How would you optimize a React application's performance?",
            "Explain how React's reconciliation algorithm works",
            "What are React error boundaries and how do they work?"
        ]
    }
};









// Create and configure the service
const interviewService = new InterviewService(apiKey);
interviewService.loadQuestions(exampleQuestions);

// Export for use in your app
export default interviewService;

// Convenience functions for common use cases
export const generateQuestion = (domain, level) => 
    interviewService.generateInterviewQuestion(domain, level);

export const generateFollowUp = (domain, level, originalQuestion, candidateAnswer) =>
    interviewService.generateFollowUpQuestion(domain, level, originalQuestion, candidateAnswer);

export const getDomains = () => interviewService.getAvailableDomains();
export const getLevels = (domain) => interviewService.getAvailableLevels(domain);




// Generate an interview question
const question = await generateQuestion("JavaScript", "intermediate");
console.log(question.interviewerQuestion);
// "As a Senior JavaScript Developer at Google, I'd like to ask: How does the 'this' keyword work in different contexts in JavaScript?"

// Generate follow-up based on candidate's answer
const followUp = await generateFollowUp(
    "JavaScript", 
    "intermediate", 
    question.originalQuestion, 
    candidateAnswer
);