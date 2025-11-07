import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import app from "../firebase/firebase";

const auth = getAuth(app);

export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("User signed up:", userCredential.user);
    return true;
  } catch (e) {
    console.error("Error signing up:", e);
    return false;
  }
}

export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("User signed in:", userCredential.user);
    return true;
  } catch (e) {
    console.error("Error signing in:", e);
    return false;
  }
}

export async function logout() {
  await signOut(auth);
  console.log("User signed out");
}

// 👇 THIS is the one that was missing
export async function getCurrentUser() {
  return auth.currentUser;
}
