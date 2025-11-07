
class followUpQuestion {

    buildFollowUpPrompt(domain, level, originalQuestion, candidateAnswer, role) {
            const role = this.getInterviewerRole(domain);

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

}

export { followUpQuestion };