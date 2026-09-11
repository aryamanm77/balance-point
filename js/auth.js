import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from "./firebase-init.js";
const provider = new GoogleAuthProvider();
provider.addScope("profile");
provider.addScope("email");
const loginOverlay = () => document.getElementById("login-overlay");
const loadingScreen = () => document.getElementById("loading-screen");
const appRoot = () => document.getElementById("app");
const googleBtn = () => document.getElementById("google-signin-btn");
const signoutBtn = () => document.getElementById("signout-btn");
const avatarBtn = () => document.getElementById("avatar-btn");
const profileDropdown = () => document.getElementById("profile-dropdown");
const userPhotoEl = () => document.getElementById("user-photo-header");
const userNameEl = () => document.getElementById("user-display-name");
const userEmailEl = () => document.getElementById("user-display-email");
const userInitEl = () => document.getElementById("user-initials");
const greetingName = () => document.querySelector(".greeting-name");
const loginError = () => document.getElementById("login-error");
const loginSpinner = () => document.getElementById("login-spinner");
let _currentUser = null;
let _onAuthCallbacks = [];
function onUserReady(cb) {
  _onAuthCallbacks.push(cb);
}
function getCurrentUser() {
  return _currentUser;
}
function initAuth() {
  var _a, _b, _c;
  window.signInWithGoogle = signInWithGoogle;
  try {
    getRedirectResult(auth).catch((err) => {
      handleAuthError(err);
    });
  } catch (e) {
    console.error("Redirect check failed:", e);
  }
  onAuthStateChanged(auth, async (user) => {
    hideLoading();
    if (user) {
      _currentUser = user;
      showDashboard(user);
      await loadUserPreferences(user.uid);
      _onAuthCallbacks.forEach((cb) => cb(user));
    } else {
      _currentUser = null;
      showLoginScreen();
    }
  });
  const pBtn = document.getElementById("profile-btn");
  pBtn == null ? void 0 : pBtn.addEventListener("click", (e) => {
    var _a2;
    e.stopPropagation();
    (_a2 = profileDropdown()) == null ? void 0 : _a2.classList.toggle("open");
  });
  (_a = signoutBtn()) == null ? void 0 : _a.addEventListener("click", signOutUser);
  (_b = googleBtn()) == null ? void 0 : _b.addEventListener("click", signInWithGoogle);
  (_c = avatarBtn()) == null ? void 0 : _c.addEventListener("click", (e) => {
    var _a2;
    e.stopPropagation();
    (_a2 = profileDropdown()) == null ? void 0 : _a2.classList.toggle("open");
  });
  document.addEventListener("click", () => {
    var _a2;
    return (_a2 = profileDropdown()) == null ? void 0 : _a2.classList.remove("open");
  });
}
async function signInWithGoogle() {
  setSignInLoading(true);
  clearLoginError();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    setSignInLoading(false);
    handleAuthError(err);
  }
}
async function signOutUser() {
  var _a;
  (_a = profileDropdown()) == null ? void 0 : _a.classList.remove("open");
  try {
    await fbSignOut(auth);
    localStorage.removeItem("bp_widget_layout");
    localStorage.removeItem("bp_medications");
    localStorage.removeItem("bp_hydration");
    showLoginScreen();
    showToast("Signed out successfully", "info");
  } catch (err) {
    console.error("[Auth] Sign-out error:", err);
    showToast("Sign-out failed. Try again.", "error");
  }
}
async function loadUserPreferences(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid, "preferences", "dashboard"));
    if (snap.exists()) {
      const prefs = snap.data();
      if (prefs.widgetLayout) {
        localStorage.setItem("bp_widget_layout", JSON.stringify(prefs.widgetLayout));
      }
      if (prefs.hydrationMl !== void 0) {
        localStorage.setItem("bp_hydration", prefs.hydrationMl);
      }
    }
  } catch (err) {
    console.warn("[Auth] Firestore read failed, using localStorage:", err.code);
  }
}
async function saveUserPreferences(uid, data) {
  try {
    await setDoc(
      doc(db, "users", uid, "preferences", "dashboard"),
      data,
      { merge: true }
    );
  } catch (err) {
    console.warn("[Auth] Firestore write failed:", err.code);
  }
}
function showDashboard(user) {
  var _a, _b;
  (_a = loginOverlay()) == null ? void 0 : _a.classList.remove("visible");
  (_b = appRoot()) == null ? void 0 : _b.classList.remove("hidden");
  const photo = user.photoURL;
  const name = user.displayName || "User";
  const email = user.email || "";
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  if (userPhotoEl()) {
    if (photo) {
      userPhotoEl().src = photo;
      userPhotoEl().style.display = "block";
      userInitEl() && (userInitEl().style.display = "none");
    } else {
      userPhotoEl().style.display = "none";
      if (userInitEl()) userInitEl().textContent = initials;
    }
  }
  if (userNameEl()) userNameEl().textContent = name;
  if (userEmailEl()) userEmailEl().textContent = email;
  if (greetingName()) greetingName().textContent = name.split(" ")[0];
}
function showLoginScreen() {
  var _a, _b;
  (_a = appRoot()) == null ? void 0 : _a.classList.add("hidden");
  (_b = loginOverlay()) == null ? void 0 : _b.classList.add("visible");
  setSignInLoading(false);
}
function hideLoading() {
  const ls = loadingScreen();
  if (ls) {
    ls.style.opacity = "0";
    setTimeout(() => ls.remove(), 400);
  }
}
function setSignInLoading(loading) {
  const btn = googleBtn();
  const spinner = loginSpinner();
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle("loading", loading);
  if (spinner) spinner.style.display = loading ? "inline-block" : "none";
}
function clearLoginError() {
  const el = loginError();
  if (el) {
    el.textContent = "";
    el.style.display = "none";
  }
}
function handleAuthError(err) {
  const el = loginError();
  let msg = "Sign-in failed. Please try again.";
  if (err.code === "auth/popup-closed-by-user") msg = "Sign-in cancelled.";
  if (err.code === "auth/network-request-failed") msg = "Network error. Check your connection.";
  if (err.code === "auth/popup-blocked") msg = "Popup blocked. Please allow popups for this site.";
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
  console.error("[Auth] Error:", err.code, err.message);
}
function showToast(message, type = "info") {
  const existing = document.getElementById("bp-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "bp-toast";
  toast.className = `bp-toast bp-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3e3);
}
export {
  getCurrentUser,
  initAuth,
  loadUserPreferences,
  onUserReady,
  saveUserPreferences,
  showToast,
  signInWithGoogle,
  signOutUser
};
