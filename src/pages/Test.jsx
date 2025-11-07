import { useState } from "react";
import interviewService from "../api/interviewservice.js";

export default function Test() {

    const domain = "JavaScript";
    const level = "beginner";

    const [history, setHistory] = useState([]);
    const [answer, setAnswer] = useState("");
    const [lastQuestion, setLastQuestion] = useState("");

    async function getNextQuestion() {
        const result = await interviewService.generateInterviewQuestion(domain, level, history);
        console.log("Generated Question:", result); 
        setLastQuestion(result.interviewerQuestion);
        setHistory(history => [...history, "Question: " + result.interviewerQuestion]);
    }

    async function sendAnswer() {
        setHistory(history => [...history, "Answer: " + answer]);
        const result = await interviewService.analyzeSingleResponse(answer, {question: lastQuestion, domain: domain, level: level});
        console.log(result);
        setAnswer("");    
    }

    return <div>
        <input type="text" onChange={e => setAnswer(e.target.value)}></input>
        <button onClick={getNextQuestion}>Get next question</button>
        <button onClick={sendAnswer}>Send answer</button>
        {history.map((item, index) => (
            <div key={index}>
                <p>{item}</p>
            </div>
        ))}
    </div>;

}