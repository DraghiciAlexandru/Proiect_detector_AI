import app from "../firebase/firebase";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const db = getFirestore(app);

export async function storeInterview(userId, interview) {
    try {
        await setDoc(doc(db, userId, interviewData.id), interview.data);
        console.log("Interview stored with ID: ", interview.id);
    } catch(e) {
        console.error("Error adding document: ", e);
    }
}