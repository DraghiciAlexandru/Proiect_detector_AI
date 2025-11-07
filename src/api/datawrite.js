// Complete storage example
async function storeInterviewSession(domain, level, conversationHistory, structuredData) {
    // 1. Create interview record
    const interview = await db.interviews.create({
        domain: domain,
        level: level,
        start_time: new Date(),
        candidate_id: 'candidate_123' // From your auth system
    });

    // 2. Store each conversation turn
    let turnOrder = 1;
    
    for (const turn of structuredData) {
        await db.conversation_turns.create({
            interview_id: interview.id,
            turn_type: turn.type,
            speaker: turn.type === 'answer' ? 'candidate' : 'interviewer',
            content: turn.content,
            original_question: turn.originalQuestion || null,
            metadata: {
                domain: domain,
                level: level,
                role: turn.role || null,
                timestamp: turn.timestamp
            },
            turn_order: turnOrder++
        });
    }

    // 3. After interview completes, run AI detection
    const fullTranscript = conversationHistory.join('\n\n');
    const detectionResult = await runAIDetection(fullTranscript);
    
    // 4. Store detection results
    await db.ai_detection_logs.create({
        interview_id: interview.id,
        detection_service: 'gptzero',
        confidence_score: detectionResult.confidence,
        raw_response: detectionResult.raw_data
    });

    // 5. Update interview with final classification
    await db.interviews.update(interview.id, {
        end_time: new Date(),
        ai_detection_score: detectionResult.confidence,
        classification: detectionResult.classification
    });

    return interview.id;
}

// Example of what gets stored in conversation_turns:
const exampleStoredTurns = [
    {
        turn_type: 'question',
        speaker: 'interviewer',
        content: "Of course. As a Senior JavaScript Developer at Google, I'd like to test your understanding of closures...",
        original_question: "Explain what a closure is in JavaScript",
        metadata: {
            domain: 'JavaScript',
            level: 'intermediate',
            role: 'Senior JavaScript Developer at Google',
            timestamp: '2024-01-15T10:30:00.000Z'
        },
        turn_order: 1
    },
    {
        turn_type: 'answer',
        speaker: 'candidate',
        content: "A closure is when a function has access to variables from its outer scope even after that outer function has returned...",
        original_question: null,
        metadata: {
            domain: 'JavaScript',
            level: 'intermediate',
            timestamp: '2024-01-15T10:31:00.000Z'
        },
        turn_order: 2
    },
    {
        turn_type: 'follow_up',
        speaker: 'interviewer',
        content: "Good, you've covered the basic definition. Now, could you explain how closures relate to memory management...",
        original_question: null,
        metadata: {
            domain: 'JavaScript',
            level: 'intermediate',
            timestamp: '2024-01-15T10:32:00.000Z'
        },
        turn_order: 3
    }
];