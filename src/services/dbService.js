import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { getStoredUsers, saveStoredUsers } from "../utils/authStorage";

/**
 * dbService.js
 * Unified database service supporting Supabase live cloud operations
 * with automatic local storage fallback when offline or unconfigured.
 */

// ==========================================
// 1. USERS & AUTHENTICATION
// ==========================================

export async function fetchUsers() {
  if (!isSupabaseConfigured()) {
    return getStoredUsers(false);
  }
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error || !data) {
      console.warn("Supabase fetchUsers fallback:", error);
      return getStoredUsers(false);
    }
    // Map DB format to app user object format
    const users = data.map(u => ({
      id: u.id,
      username: u.username,
      password: u.password_hash,
      fullName: u.full_name || u.username,
      role: u.role,
      permissions: u.permissions || (u.role === "owner" ? ["pos", "inventory", "financials", "partners", "settings"] : ["pos"]),
      createdAt: u.created_at
    }));
    saveStoredUsers(users);
    return users;
  } catch (err) {
    console.error("fetchUsers exception:", err);
    return getStoredUsers(false);
  }
}

export async function hasOwnerInDb() {
  const users = await fetchUsers();
  return users.some(u => u.role === "owner" || u.role === "admin");
}

export async function registerOwnerInDb({ storeName, ownerFullName, username, password }) {
  const cleanUser = (username || "").trim();
  const cleanName = (ownerFullName || cleanUser).trim();
  const cleanPass = (password || "").trim();

  const ownerObj = {
    id: "owner-1",
    username: cleanUser,
    password_hash: cleanPass,
    full_name: cleanName,
    role: "owner",
    permissions: ["pos", "inventory", "financials", "partners", "settings"],
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from("users").upsert(ownerObj, { onConflict: "id" });
      if (error) {
        console.error("Supabase owner registration error:", error);
      }
    } catch (err) {
      console.error("Supabase owner registration exception:", err);
    }
  }

  // Save store name if present
  if (storeName && storeName.trim()) {
    const info = { name: storeName.trim(), slogan: "جودة - توفير", taxRate: 14 };
    localStorage.setItem("cleanstore_store_info", JSON.stringify(info));
  }

  const appUser = {
    id: ownerObj.id,
    fullName: ownerObj.full_name,
    username: ownerObj.username,
    password: ownerObj.password_hash,
    role: "owner",
    permissions: ownerObj.permissions,
    createdAt: ownerObj.created_at
  };

  saveStoredUsers([appUser]);
  localStorage.setItem("store_owner", JSON.stringify(appUser));
  return appUser;
}

export async function registerUserInDb(payload) {
  const users = await fetchUsers();
  const cleanUsername = (payload.username || "").trim().toLowerCase();
  const cleanPassword = (payload.password || "").trim();

  if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: "اسم المستخدم مسجل بالفعل." };
  }

  const isOwnerRole = payload.role === "owner" || payload.role === "admin";
  const role = isOwnerRole ? "owner" : "staff";
  let permissions = role === "owner" 
    ? ["pos", "inventory", "financials", "partners", "settings"]
    : (Array.isArray(payload.permissions) ? payload.permissions.filter(p => p !== "settings") : ["pos"]);

  const newUser = {
    id: "user-" + Date.now(),
    username: cleanUsername,
    password_hash: cleanPassword,
    full_name: (payload.fullName || cleanUsername).trim(),
    role: role,
    permissions: permissions,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from("users").insert(newUser);
      if (error) console.error("Error inserting user into Supabase:", error);
    } catch (err) {
      console.error("Exception inserting user into Supabase:", err);
    }
  }

  const formattedUser = {
    id: newUser.id,
    fullName: newUser.full_name,
    username: newUser.username,
    password: newUser.password_hash,
    role: newUser.role,
    permissions: newUser.permissions,
    createdAt: newUser.created_at
  };

  saveStoredUsers([...users, formattedUser]);
  return { success: true, user: formattedUser };
}

export async function updateUserInDb(userId, updates) {
  const users = await fetchUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, error: "المستخدم غير موجود." };

  const dbPayload = {};
  if (updates.fullName) {
    dbPayload.full_name = updates.fullName.trim();
    target.fullName = updates.fullName.trim();
  }
  if (updates.username) {
    dbPayload.username = updates.username.trim().toLowerCase();
    target.username = updates.username.trim().toLowerCase();
  }
  if (updates.password) {
    dbPayload.password_hash = updates.password.trim();
    target.password = updates.password.trim();
  }
  if (updates.role) {
    const r = (updates.role === "owner" || updates.role === "admin") ? "owner" : "staff";
    dbPayload.role = r;
    target.role = r;
  }
  if (Array.isArray(updates.permissions)) {
    const p = target.role === "owner"
      ? ["pos", "inventory", "financials", "partners", "settings"]
      : updates.permissions.filter(x => x !== "settings");
    dbPayload.permissions = p;
    target.permissions = p;
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("users").update(dbPayload).eq("id", userId);
    } catch (err) {
      console.error("Supabase user update error:", err);
    }
  }

  saveStoredUsers(users);
  return { success: true, user: target };
}

export async function deleteUserFromDb(userId, currentUserId) {
  if (userId === currentUserId) {
    return { success: false, error: "لا يمكنك حذف حسابك الحالي." };
  }
  if (isSupabaseConfigured()) {
    try {
      await supabase.from("users").delete().eq("id", userId);
    } catch (err) {
      console.error("Supabase user deletion error:", err);
    }
  }
  const users = getStoredUsers(false).filter(u => u.id !== userId);
  saveStoredUsers(users);
  return { success: true, remainingUsers: users };
}

// ==========================================
// 2. PRODUCTS & INVENTORY MANAGEMENT
// ==========================================

export async function fetchProducts() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("products").select("*").order("name", { ascending: true });
      if (!error && data && data.length > 0) {
        const formatted = data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category || "عام",
          barcode: p.barcode || "",
          costPrice: Number(p.cost_price || 0),
          sellPrice: Number(p.sell_price || 0),
          stockQuantity: Number(p.stock_quantity || 0),
          unit: p.unit || "قطعة"
        }));
        localStorage.setItem("cleanstore_products", JSON.stringify(formatted));
        return formatted;
      }
    } catch (err) {
      console.warn("fetchProducts fallback to local storage:", err);
    }
  }
  const saved = localStorage.getItem("cleanstore_products");
  return saved ? JSON.parse(saved) : [];
}

export async function saveProductsInDb(productsList) {
  localStorage.setItem("cleanstore_products", JSON.stringify(productsList));
  if (isSupabaseConfigured() && Array.isArray(productsList)) {
    try {
      const payload = productsList.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || "عام",
        barcode: p.barcode || "",
        cost_price: p.costPrice || 0,
        sell_price: p.sellPrice || 0,
        stock_quantity: p.stockQuantity || 0,
        unit: p.unit || "قطعة",
        updated_at: new Date().toISOString()
      }));
      await supabase.from("products").upsert(payload, { onConflict: "id" });
    } catch (err) {
      console.error("saveProductsInDb exception:", err);
    }
  }
}

export async function decrementStockInDb(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return;

  const currentProducts = await fetchProducts();
  const updatedProducts = currentProducts.map(prod => {
    const itemInCart = cartItems.find(item => item.id === prod.id);
    if (itemInCart) {
      const newStock = Math.max(0, prod.stockQuantity - itemInCart.quantity);
      return { ...prod, stockQuantity: newStock };
    }
    return prod;
  });

  await saveProductsInDb(updatedProducts);

  if (isSupabaseConfigured()) {
    for (const item of cartItems) {
      try {
        const matching = currentProducts.find(p => p.id === item.id);
        if (matching) {
          const newQty = Math.max(0, matching.stockQuantity - item.quantity);
          await supabase.from("products").update({
            stock_quantity: newQty,
            updated_at: new Date().toISOString()
          }).eq("id", item.id);
        }
      } catch (err) {
        console.error(`Stock decrement failed for product ${item.id}:`, err);
      }
    }
  }
}

// ==========================================
// 3. INVOICES & POS SALES
// ==========================================

export async function fetchInvoices() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        const formatted = data.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          cashierId: inv.cashier_id,
          totalAmount: Number(inv.total_amount || 0),
          discountAmount: Number(inv.discount_amount || 0),
          paymentMethod: inv.payment_method || "نقداً",
          items: inv.items || [],
          createdAt: inv.created_at,
          date: inv.created_at
        }));
        localStorage.setItem("cleanstore_sales", JSON.stringify(formatted));
        return formatted;
      }
    } catch (err) {
      console.warn("fetchInvoices fallback to local storage:", err);
    }
  }
  const saved = localStorage.getItem("cleanstore_sales");
  return saved ? JSON.parse(saved) : [];
}

export async function createInvoiceInDb(saleData) {
  const newInvoice = {
    id: saleData.id || "inv-" + Date.now(),
    invoice_number: saleData.invoiceNumber || `INV-${Date.now()}`,
    cashier_id: saleData.cashierId || null,
    total_amount: saleData.totalAmount || saleData.total || 0,
    discount_amount: saleData.discountAmount || saleData.discount || 0,
    payment_method: saleData.paymentMethod || "نقداً",
    items: saleData.items || [],
    created_at: saleData.createdAt || new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from("invoices").insert(newInvoice);
      if (error) console.error("Supabase insert invoice error:", error);
    } catch (err) {
      console.error("Supabase insert invoice exception:", err);
    }
  }

  // Decrement stock for sold products
  if (Array.isArray(saleData.items)) {
    await decrementStockInDb(saleData.items);
  }

  // Update local storage sales
  const currentSales = await fetchInvoices();
  const formattedSale = {
    id: newInvoice.id,
    invoiceNumber: newInvoice.invoice_number,
    cashierId: newInvoice.cashier_id,
    totalAmount: Number(newInvoice.total_amount),
    discountAmount: Number(newInvoice.discount_amount),
    paymentMethod: newInvoice.payment_method,
    items: newInvoice.items,
    createdAt: newInvoice.created_at,
    date: newInvoice.created_at
  };

  const updatedSales = [formattedSale, ...currentSales.filter(s => s.id !== formattedSale.id)];
  localStorage.setItem("cleanstore_sales", JSON.stringify(updatedSales));
  return formattedSale;
}

// ==========================================
// 4. PARTNERS & EXPENSES
// ==========================================

export async function fetchPartners() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("partners").select("*");
      if (!error && data && data.length > 0) {
        const formatted = data.map(p => ({
          id: p.id,
          name: p.name,
          capitalShare: Number(p.capital_share || 0),
          profitPercentage: Number(p.profit_percentage || 0),
          totalDrawings: Number(p.total_drawings || 0)
        }));
        localStorage.setItem("cleanstore_partners", JSON.stringify(formatted));
        return formatted;
      }
    } catch (err) {
      console.warn("fetchPartners fallback:", err);
    }
  }
  const saved = localStorage.getItem("cleanstore_partners");
  return saved ? JSON.parse(saved) : [
    { id: "part-1", name: "الشريك الأساسي (المدير)", capitalShare: 50000, profitPercentage: 100, totalDrawings: 0 }
  ];
}

export async function savePartnersInDb(partnersList) {
  localStorage.setItem("cleanstore_partners", JSON.stringify(partnersList));
  if (isSupabaseConfigured() && Array.isArray(partnersList)) {
    try {
      const payload = partnersList.map(p => ({
        id: p.id,
        name: p.name,
        capital_share: p.capitalShare || 0,
        profit_percentage: p.profitPercentage || 0,
        total_drawings: p.totalDrawings || 0
      }));
      await supabase.from("partners").upsert(payload, { onConflict: "id" });
    } catch (err) {
      console.error("savePartnersInDb error:", err);
    }
  }
}

export async function fetchExpenses() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false });
      if (!error && data) {
        const formatted = data.map(e => ({
          id: e.id,
          title: e.title,
          amount: Number(e.amount || 0),
          category: e.category || "مصروفات عامة",
          date: e.date
        }));
        localStorage.setItem("cleanstore_expenses", JSON.stringify(formatted));
        return formatted;
      }
    } catch (err) {
      console.warn("fetchExpenses fallback:", err);
    }
  }
  const saved = localStorage.getItem("cleanstore_expenses");
  return saved ? JSON.parse(saved) : [];
}

export async function createExpenseInDb(expenseData) {
  const payload = {
    id: expenseData.id || "exp-" + Date.now(),
    title: expenseData.title,
    amount: expenseData.amount,
    category: expenseData.category || "مصروفات عامة",
    date: expenseData.date || new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("expenses").insert(payload);
    } catch (err) {
      console.error("createExpenseInDb error:", err);
    }
  }

  const current = await fetchExpenses();
  const updated = [payload, ...current];
  localStorage.setItem("cleanstore_expenses", JSON.stringify(updated));
  return payload;
}

// ==========================================
// 5. REALTIME SYNC SUBSCRIPTION HELPER
// ==========================================

export function subscribeToRealtimeSync(onUpdateCallback) {
  if (!isSupabaseConfigured()) return () => {};

  try {
    const channel = supabase
      .channel("pos-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          if (typeof onUpdateCallback === "function") {
            onUpdateCallback(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error("Realtime subscription error:", err);
    return () => {};
  }
}
