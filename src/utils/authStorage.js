/**
 * authStorage.js
 * Persistent user management and authentication storage for Cleaning Store POS
 * Implements Single-Store Owner Lifecycle (store_owner, is_authenticated)
 */

export const STORE_OWNER_KEY = "store_owner";
export const IS_AUTHENTICATED_KEY = "is_authenticated";
export const USERS_STORAGE_KEY = "store_users";
export const AUTH_SESSION_KEY = "cleanstore_auth";

/**
 * Get saved store owner record
 */
export function getStoreOwner() {
  try {
    const raw = localStorage.getItem(STORE_OWNER_KEY);
    if (raw) return JSON.parse(raw);
    
    // Fallback: check store_users if initialized previously
    const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
    if (usersRaw) {
      const parsed = JSON.parse(usersRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a store owner account has been created
 */
export function hasStoreOwner() {
  return getStoreOwner() !== null;
}

/**
 * Check if the current session is authenticated
 */
export function isOwnerAuthenticated() {
  const isAuth = localStorage.getItem(IS_AUTHENTICATED_KEY) === "true";
  const activeSession = getActiveSession();
  return (isAuth || !!activeSession) && hasStoreOwner();
}

/**
 * Register store owner for the first time
 */
export function registerStoreOwner({ username, password }) {
  const cleanUser = username.trim();
  const owner = {
    id: "owner-1",
    fullName: cleanUser,
    username: cleanUser,
    email: cleanUser.includes("@") ? cleanUser : `${cleanUser}@store.local`,
    password: password,
    role: "admin",
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(STORE_OWNER_KEY, JSON.stringify(owner));
  localStorage.setItem(IS_AUTHENTICATED_KEY, "true");
  saveStoredUsers([owner]);
  setActiveSession(owner, true);

  return { success: true, user: owner };
}

/**
 * Authenticate existing store owner
 */
export function authenticateOwner(identifier, password) {
  const owner = getStoreOwner();
  const cleanId = (identifier || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();

  if (!owner) {
    return { success: false, error: "لم يتم إنشاء حساب المتجر بعد." };
  }

  const matchesUsername = owner.username && owner.username.toLowerCase() === cleanId;
  const matchesEmail = owner.email && owner.email.toLowerCase() === cleanId;
  const matchesPass = owner.password === cleanPass;

  if ((matchesUsername || matchesEmail) && matchesPass) {
    localStorage.setItem(IS_AUTHENTICATED_KEY, "true");
    setActiveSession(owner, true);
    return { success: true, user: owner };
  }

  return {
    success: false,
    error: "بيانات الدخول غير صحيحة. يرجى التأكد من اسم المستخدم وكلمة المرور."
  };
}

/**
 * Log out owner
 */
export function logoutOwner() {
  localStorage.setItem(IS_AUTHENTICATED_KEY, "false");
  clearActiveSession();
}

/**
 * Get all registered users
 */
export function getStoredUsers(seedIfEmpty = false) {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      const owner = getStoreOwner();
      return owner ? [owner] : [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const owner = getStoreOwner();
    return owner ? [owner] : [];
  } catch (err) {
    console.error("Error reading stored users:", err);
    return [];
  }
}

/**
 * Save users list
 */
export function saveStoredUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem("cleanstore_users", JSON.stringify(users));
  } catch (err) {
    console.error("Error saving users to storage:", err);
  }
}

/**
 * Legacy Register helper
 */
export function registerUser(payload) {
  const owner = getStoreOwner();
  if (!owner) {
    return registerStoreOwner({ username: payload.username, password: payload.password });
  }

  const users = getStoredUsers(false);
  const cleanUsername = payload.username.trim().toLowerCase();

  const exists = users.some(u => u.username.toLowerCase() === cleanUsername);
  if (exists) {
    return {
      success: false,
      error: "اسم المستخدم مسجل بالفعل. يرجى اختيار اسم مستخدم آخر."
    };
  }

  const newUser = {
    id: "user-" + Date.now(),
    fullName: payload.fullName.trim() || cleanUsername,
    username: cleanUsername,
    email: payload.email || `${cleanUsername}@store.local`,
    password: payload.password,
    role: payload.role || "cashier",
    createdAt: new Date().toISOString()
  };

  const updated = [...users, newUser];
  saveStoredUsers(updated);
  return { success: true, user: newUser };
}

/**
 * Legacy Authenticate helper
 */
export function authenticateUser(identifier, password) {
  return authenticateOwner(identifier, password);
}

/**
 * Update user details
 */
export function updateStoredUser(userId, { fullName, role, password }) {
  const users = getStoredUsers(false);
  const index = users.findIndex(u => u.id === userId);

  if (index === -1) {
    return { success: false, error: "المستخدم غير موجود." };
  }

  const updatedUser = { ...users[index] };
  if (fullName) updatedUser.fullName = fullName.trim();
  if (role) updatedUser.role = role;
  if (password && password.trim()) updatedUser.password = password.trim();

  users[index] = updatedUser;
  saveStoredUsers(users);

  // If this is the owner, update store_owner record
  const owner = getStoreOwner();
  if (owner && owner.id === userId) {
    localStorage.setItem(STORE_OWNER_KEY, JSON.stringify(updatedUser));
  }

  return { success: true, user: updatedUser };
}

/**
 * Delete user from storage
 */
export function deleteStoredUser(userId, currentUserId) {
  const users = getStoredUsers(false);
  if (userId === currentUserId) {
    return { success: false, error: "لا يمكنك حذف حسابك الحالي من هذه القائمة." };
  }

  const remainingUsers = users.filter(u => u.id !== userId);
  saveStoredUsers(remainingUsers);
  return { success: true, remainingUsers };
}

/**
 * Delete Self Account
 */
export function deleteSelfAccount(userId, passwordConfirmation) {
  return resetAppForClient();
}

/**
 * Session Helpers
 */
export function getActiveSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveSession(user, rememberMe = true) {
  try {
    const userPayload = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem(AUTH_SESSION_KEY, userPayload);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, userPayload);
      localStorage.setItem(AUTH_SESSION_KEY, userPayload);
    }
  } catch (err) {
    console.error("Error setting active session:", err);
  }
}

export function clearActiveSession() {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  } catch (err) {
    console.error("Error clearing session:", err);
  }
}

/**
 * Completely reset owner, user accounts and session for client hand-off
 */
export function resetAppForClient() {
  try {
    localStorage.removeItem(STORE_OWNER_KEY);
    localStorage.removeItem(IS_AUTHENTICATED_KEY);
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem("cleanstore_users");
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    return { success: true };
  } catch (err) {
    console.error("Error resetting app for client:", err);
    return { success: false, error: "تعذر تصفير بيانات الحسابات." };
  }
}
