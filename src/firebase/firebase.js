import { firebaseConfig } from "../firebase/firebaseConfig.js";
import { initializeApp } from "firebase/app";

const app = initializeApp(firebaseConfig);

export default app;