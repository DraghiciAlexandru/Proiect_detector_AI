import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import app from "../firebase/firebase";

const auth = getAuth(app);

// ✅ make session persist across refreshes
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence set to local.");
  })
  .catch((err) => console.error("Persistence error:", err));

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

// ✅ simple getter (can return null initially)
export function getCurrentUser() {
  return auth.currentUser;
}

// ✅ new: live auth state listener
export function listenToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}
