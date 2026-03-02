import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { api } from "./api";
import { isFirebaseConfigured } from "./firebase";
import type { User } from "@/types";

export interface AuthResponse {
  user: User;
  token: string;
}

// ── Inscription email / mot de passe ────────────────────────
export async function registerWithEmail(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<AuthResponse> {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase non configuré — ajoute EXPO_PUBLIC_FIREBASE_API_KEY dans ton fichier .env");
  }
  const auth = getAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseToken = await credential.user.getIdToken();

  const { data } = await api.post<AuthResponse>("/api/auth/register", {
    firebaseToken,
    firstName,
    lastName,
  });
  return data;
}

// ── Connexion email / mot de passe ───────────────────────────
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse> {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase non configuré — ajoute EXPO_PUBLIC_FIREBASE_API_KEY dans ton fichier .env");
  }
  const auth = getAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseToken = await credential.user.getIdToken();

  const { data } = await api.post<AuthResponse>("/api/auth/login", { firebaseToken });
  return data;
}

// ── Connexion Google (via expo-auth-session + credential Firebase) ──
export async function loginWithGoogleCredential(idToken: string): Promise<AuthResponse> {
  const auth = getAuth();
  const googleCredential = GoogleAuthProvider.credential(idToken);
  const credential = await signInWithCredential(auth, googleCredential);
  const firebaseToken = await credential.user.getIdToken();

  // Le backend gère l'upsert : si l'user n'existe pas, il sera créé via /login
  const { data } = await api.post<AuthResponse>("/api/auth/login", { firebaseToken });
  return data;
}

// ── Connexion Apple ──────────────────────────────────────────
export async function loginWithAppleCredential(identityToken: string, nonce: string): Promise<AuthResponse> {
  const auth = getAuth();
  const provider = new OAuthProvider("apple.com");
  const appleCredential = provider.credential({ idToken: identityToken, rawNonce: nonce });
  const credential = await signInWithCredential(auth, appleCredential);
  const firebaseToken = await credential.user.getIdToken();

  const { data } = await api.post<AuthResponse>("/api/auth/login", { firebaseToken });
  return data;
}

// ── Déconnexion ──────────────────────────────────────────────
export async function logout(): Promise<void> {
  const auth = getAuth();
  await signOut(auth);
}

// ── Mot de passe oublié ──────────────────────────────────────
export async function sendPasswordReset(email: string): Promise<void> {
  const auth = getAuth();
  await sendPasswordResetEmail(auth, email);
}
