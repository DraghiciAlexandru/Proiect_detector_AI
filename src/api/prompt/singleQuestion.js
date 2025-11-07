
class singleQuestion {

    buildQuestionPrompt(domain, level, currentQuestion, conversationHistory = [], role) {
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

}

export { singleQuestion };