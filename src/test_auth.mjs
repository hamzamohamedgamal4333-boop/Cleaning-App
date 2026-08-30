const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};
global.sessionStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

import { 
  hasStoreOwner,
  getStoreOwner, 
  isOwnerAuthenticated,
  registerStoreOwner, 
  authenticateOwner, 
  logoutOwner,
  resetAppForClient
} from "./utils/authStorage.js";

console.log("--- TEST 1: Fresh Install (No Owner Exists) ---");
if (hasStoreOwner()) throw new Error("Should have no owner on first launch");
if (isOwnerAuthenticated()) throw new Error("Should not be authenticated");
console.log("✓ Verified fresh install: No owner, not authenticated.");

console.log("--- TEST 2: Register Store Owner (First Run Onboarding) ---");
const regResult = registerStoreOwner({
  username: "admin_owner",
  password: "ownerpassword123"
});
if (!regResult.success) throw new Error("Owner registration failed: " + regResult.error);
if (!hasStoreOwner()) throw new Error("Owner record missing!");
if (!isOwnerAuthenticated()) throw new Error("Owner should be auto-authenticated right after registration!");
console.log("✓ Owner created and authenticated:", getStoreOwner().username);

console.log("--- TEST 3: Logout Owner ---");
logoutOwner();
if (isOwnerAuthenticated()) throw new Error("Owner should be unauthenticated after logout!");
console.log("✓ Logout successful, authentication state is false.");

console.log("--- TEST 4: Sign In Existing Owner ---");
const loginResult = authenticateOwner("admin_owner", "ownerpassword123");
if (!loginResult.success) throw new Error("Owner login failed!");
if (!isOwnerAuthenticated()) throw new Error("Owner should be authenticated after successful login!");
console.log("✓ Owner login successful:", loginResult.user.username);

console.log("--- TEST 5: Client Reset (Remove owner & is_authenticated) ---");
const resetRes = resetAppForClient();
if (!resetRes.success) throw new Error("Reset failed!");
if (hasStoreOwner()) throw new Error("store_owner should be removed!");
if (isOwnerAuthenticated()) throw new Error("is_authenticated should be false/removed!");
console.log("✓ Client reset successful: App ready for fresh onboarding.");

console.log("=== ALL SINGLE-STORE OWNER LIFECYCLE TESTS PASSED 100% ===");
