/**
 * authStorage.js
 * Persistent user management and authentication storage for Cleaning Store POS
 * Implements Role & Access Control (Owner / Cashier) with Granular Permissions and Client Handover
 */

export const USERS_STORAGE_KEY = "clean_store_users";
export const STORE_OWNER_KEY = "store_owner";
export const IS_AUTHENTICATED_KEY = "is_authenticated";
export const AUTH_SESSION_KEY = "cleanstore_auth";

export const ALL_PERMISSIONS = ["pos", "inventory", "financials", "partners", "settings"];

/**
 * Get all registered users from storage
 */
export function getStoredUsers(seedIfEmpty = false) {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem("store_users") || localStorage.getItem("cleanstore_users");
    if (!raw) {
      const ownerRaw = localStorage.getItem(STORE_OWNER_KEY);
      if (ownerRaw) {
        const owner = JSON.parse(ownerRaw);
        return [owner];
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(u => ({
        ...u,
        role: u.role === "admin" ? "owner" : u.role,
        permissions: u.role === "owner" || u.role === "admin"
          ? [...ALL_PERMISSIONS]
          : (Array.isArray(u.permissions) ? u.permissions.filter(p => p !== "settings") : ["pos"])
      }));
    }
    return [];
  } catch (err) {
    console.error("Error reading stored users:", err);
    return [];
  }
}

/**
 * Save users list across all user storage keys
 */
export function saveStoredUsers(users) {
  try {
    const payload = JSON.stringify(users);
    localStorage.setItem(USERS_STORAGE_KEY, payload);
    localStorage.setItem("store_users", payload);
    localStorage.setItem("cleanstore_users", payload);
  } catch (err) {
    console.error("Error saving users to storage:", err);
  }
}

/**
 * Get saved primary store owner record
 */
export function getStoreOwner() {
  try {
    const users = getStoredUsers(false);
    const owner = users.find(u => u.role === "owner" || u.role === "admin");
    if (owner) return owner;

    const raw = localStorage.getItem(STORE_OWNER_KEY);
    if (raw) return JSON.parse(raw);

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a store owner account exists in localStorage (clean_store_users)
 */
export function hasStoreOwner() {
  return getStoreOwner() !== null;
}

/**
 * Check if current session is authenticated
 */
export function isOwnerAuthenticated() {
  const isAuth = localStorage.getItem(IS_AUTHENTICATED_KEY) === "true";
  const activeSession = getActiveSession();
  return (isAuth || !!activeSession) && hasStoreOwner();
}

/**
 * Register primary store owner for the first time (First-Time App Setup)
 */
export function registerFirstOwner({ storeName, ownerFullName, username, password }) {
  const cleanUser = (username || "").trim();
  const cleanName = (ownerFullName || cleanUser).trim();
  const cleanPass = (password || "").trim();

  if (!cleanUser || !cleanPass) {
    return { success: false, error: "يرجى أدخال اسم المستخدم وكلمة المرور." };
  }

  const owner = {
    id: "owner-1",
    fullName: cleanName,
    username: cleanUser,
    email: cleanUser.includes("@") ? cleanUser : `${cleanUser}@store.local`,
    password: cleanPass,
    role: "owner",
    permissions: [...ALL_PERMISSIONS],
    createdAt: new Date().toISOString()
  };

  // Save Store Info if provided
  if (storeName && storeName.trim()) {
    const existingStoreInfo = localStorage.getItem("cleanstore_store_info");
    const currentInfo = existingStoreInfo ? JSON.parse(existingStoreInfo) : {};
    localStorage.setItem("cleanstore_store_info", JSON.stringify({
      ...currentInfo,
      name: storeName.trim(),
      slogan: currentInfo.slogan || "جودة - توفير",
      taxRate: currentInfo.taxRate || 14
    }));
  }

  localStorage.setItem(STORE_OWNER_KEY, JSON.stringify(owner));
  localStorage.setItem(IS_AUTHENTICATED_KEY, "true");
  saveStoredUsers([owner]);
  setActiveSession(owner, true);

  return { success: true, user: owner };
}

/**
 * Legacy registerStoreOwner wrapper
 */
export function registerStoreOwner(payload) {
  return registerFirstOwner({
    storeName: payload.storeName,
    ownerFullName: payload.ownerFullName || payload.fullName || payload.username,
    username: payload.username,
    password: payload.password
  });
}

/**
 * Register a new user account (Staff / Partner)
 */
export function registerUser(payload) {
  const users = getStoredUsers(false);
  const cleanUsername = (payload.username || "").trim().toLowerCase();
  const cleanPassword = (payload.password || "").trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, error: "اسم المستخدم وكلمة المرور مطلوبان." };
  }

  const exists = users.some(u => u.username.toLowerCase() === cleanUsername);
  if (exists) {
    return {
      success: false,
      error: "اسم المستخدم مسجل بالفعل. يرجى اختيار اسم مستخدم آخر."
    };
  }

  const isOwnerRole = payload.role === "owner" || payload.role === "admin";
  const role = isOwnerRole ? "owner" : "cashier";

  let permissions = [];
  if (role === "owner") {
    permissions = [...ALL_PERMISSIONS];
  } else {
    // Cashier allowed permissions check
    const rawPerms = Array.isArray(payload.permissions) ? payload.permissions : ["pos"];
    permissions = rawPerms.filter(p => p !== "settings");
    if (permissions.length === 0) permissions = ["pos"];
  }

  const newUser = {
    id: "user-" + Date.now(),
    fullName: (payload.fullName || cleanUsername).trim(),
    username: cleanUsername,
    email: payload.email || `${cleanUsername}@store.local`,
    password: cleanPassword,
    role: role,
    permissions: permissions,
    createdAt: new Date().toISOString()
  };

  const updated = [...users, newUser];
  saveStoredUsers(updated);

  if (role === "owner" && !getStoreOwner()) {
    localStorage.setItem(STORE_OWNER_KEY, JSON.stringify(newUser));
  }

  return { success: true, user: newUser };
}

/**
 * Authenticate existing user by credentials
 */
export function authenticateUser(identifier, password) {
  const users = getStoredUsers(false);
  const cleanId = (identifier || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();

  if (users.length === 0) {
    return { success: false, error: "لم يتم إنشاء حساب مالك المتجر بعد." };
  }

  const foundUser = users.find(u => {
    const matchUser = u.username && u.username.toLowerCase() === cleanId;
    const matchEmail = u.email && u.email.toLowerCase() === cleanId;
    return (matchUser || matchEmail) && u.password === cleanPass;
  });

  if (foundUser) {
    localStorage.setItem(IS_AUTHENTICATED_KEY, "true");
    setActiveSession(foundUser, true);
    return { success: true, user: foundUser };
  }

  return {
    success: false,
    error: "بيانات الدخول غير صحيحة. يرجى التأكد من اسم المستخدم وكلمة المرور."
  };
}

/**
 * Legacy authenticateOwner wrapper
 */
export function authenticateOwner(identifier, password) {
  return authenticateUser(identifier, password);
}

/**
 * Logout user session
 */
export function logoutOwner() {
  localStorage.setItem(IS_AUTHENTICATED_KEY, "false");
  clearActiveSession();
}

/**
 * Update stored user profile & permissions
 */
export function updateStoredUser(userId, { fullName, username, password, role, permissions }) {
  const users = getStoredUsers(false);
  const index = users.findIndex(u => u.id === userId);

  if (index === -1) {
    return { success: false, error: "المستخدم غير موجود." };
  }

  const target = users[index];

  // Username uniqueness check if username is changed
  if (username && username.trim().toLowerCase() !== target.username.toLowerCase()) {
    const cleanUn = username.trim().toLowerCase();
    if (users.some(u => u.id !== userId && u.username.toLowerCase() === cleanUn)) {
      return { success: false, error: "اسم المستخدم مستخدم بالفعل في حساب آخر." };
    }
    target.username = cleanUn;
  }

  if (fullName) target.fullName = fullName.trim();
  if (password && password.trim()) target.password = password.trim();

  if (role) {
    target.role = (role === "owner" || role === "admin") ? "owner" : "cashier";
  }

  if (target.role === "owner") {
    target.permissions = [...ALL_PERMISSIONS];
  } else if (Array.isArray(permissions)) {
    target.permissions = permissions.filter(p => p !== "settings");
    if (target.permissions.length === 0) target.permissions = ["pos"];
  }

  users[index] = target;
  saveStoredUsers(users);

  // Sync store_owner if target is owner
  if (target.role === "owner") {
    localStorage.setItem(STORE_OWNER_KEY, JSON.stringify(target));
  }

  // Update active session if target is current user
  const activeSession = getActiveSession();
  if (activeSession && activeSession.id === userId) {
    setActiveSession(target, true);
  }

  return { success: true, user: target };
}

/**
 * Delete user from storage
 */
export function deleteStoredUser(userId, currentUserId) {
  const users = getStoredUsers(false);
  if (userId === currentUserId) {
    return { success: false, error: "لا يمكنك حذف حسابك الحالي من هذه القائمة." };
  }

  const target = users.find(u => u.id === userId);
  if (target && (target.role === "owner" || target.role === "admin")) {
    const ownerCount = users.filter(u => u.role === "owner" || u.role === "admin").length;
    if (ownerCount <= 1) {
      return { success: false, error: "لا يمكنك حذف مالك المتجر الوحيد." };
    }
  }

  const remainingUsers = users.filter(u => u.id !== userId);
  saveStoredUsers(remainingUsers);
  return { success: true, remainingUsers };
}

/**
 * Delete Self Account wrapper
 */
export function deleteSelfAccount(userId, passwordConfirmation) {
  return resetAppForHandover();
}

/**
 * Active Session Helpers
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
 * Developer Reset Tool for Handover (تهيئة التطبيق للتسليم للعميل)
 * Clears all test users, sessions, sales, products, expenses, partners, withdrawals, and store info
 */
export function resetAppForHandover() {
  try {
    // Purge user storage
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem("store_users");
    localStorage.removeItem("cleanstore_users");
    localStorage.removeItem(STORE_OWNER_KEY);
    localStorage.removeItem(IS_AUTHENTICATED_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);

    // Purge operational data
    localStorage.removeItem("cleanstore_products");
    localStorage.removeItem("cleanstore_sales");
    localStorage.removeItem("cleanstore_expenses");
    localStorage.removeItem("cleanstore_purchases");
    localStorage.removeItem("cleanstore_partners");
    localStorage.removeItem("cleanstore_withdrawals");
    localStorage.removeItem("cleanstore_store_info");

    return { success: true };
  } catch (err) {
    console.error("Error resetting app for handover:", err);
    return { success: false, error: "تعذر تصفير بيانات التطبيق للتسليم." };
  }
}

/**
 * Legacy resetAppForClient alias
 */
export function resetAppForClient() {
  return resetAppForHandover();
}

