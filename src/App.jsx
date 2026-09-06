import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  Settings,
  ShieldCheck,
  UserCheck,
  Download,
  LogOut,
  RefreshCw
} from "lucide-react";

// Import custom components
import LoginScreen from "./components/LoginScreen";
import PosTab from "./components/PosTab";
import InventoryTab from "./components/InventoryTab";
import FinancialsTab from "./components/FinancialsTab";
import PartnersTab from "./components/PartnersTab";
import SettingsTab from "./components/SettingsTab";

// Import sample data for demo loading
import {
  initialProducts,
  initialSales,
  initialExpenses,
  initialPartners,
  initialWithdrawals
} from "./utils/sampleData";

// Import authentication and user management helpers
import {
  getStoredUsers,
  saveStoredUsers,
  deleteSelfAccount,
  resetAppForHandover,
  getActiveSession,
  setActiveSession,
  clearActiveSession
} from "./utils/authStorage";

// Import Supabase unified database service
import {
  fetchProducts,
  fetchInvoices,
  fetchExpenses,
  fetchPartners,
  fetchUsers,
  createInvoiceInDb,
  saveProductsInDb,
  createExpenseInDb,
  savePartnersInDb,
  registerUserInDb,
  updateUserInDb,
  deleteUserFromDb,
  subscribeToRealtimeSync
} from "./services/dbService";

export default function App() {
  // 1. Authentication State
  const [currentUser, setCurrentUser] = useState(() => getActiveSession());
  const [users, setUsers] = useState(() => getStoredUsers());

  // 2. Global DB State
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [partners, setPartners] = useState([
    { id: "part-1", name: "الشريك الأساسي (المدير)", capitalShare: 50000, profitPercentage: 100 }
  ]);
  const [withdrawals, setWithdrawals] = useState(() => {
    const saved = localStorage.getItem("cleanstore_withdrawals");
    return saved ? JSON.parse(saved) : [];
  });
  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem("cleanstore_purchases");
    return saved ? JSON.parse(saved) : [];
  });
  const [storeInfo, setStoreInfo] = useState(() => {
    const saved = localStorage.getItem("cleanstore_store_info");
    return saved ? JSON.parse(saved) : {
      name: "Clean Store",
      slogan: "جودة - توفير",
      taxRate: 14
    };
  });

  // Local UI States
  const [activeTab, setActiveTab] = useState("pos");
  const [cart, setCart] = useState([]);

  // PWA Install Prompt & Standalone Mode State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(() => {
    return Boolean(window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone);
  });

  // Central DB Data Loader
  const loadAllDataFromDb = async () => {
    try {
      const [prods, invs, exps, parts, usrs] = await Promise.all([
        fetchProducts(),
        fetchInvoices(),
        fetchExpenses(),
        fetchPartners(),
        fetchUsers()
      ]);
      if (prods && prods.length > 0) setProducts(prods);
      if (invs) setSales(invs);
      if (exps) setExpenses(exps);
      if (parts && parts.length > 0) setPartners(parts);
      if (usrs && usrs.length > 0) setUsers(usrs);
    } catch (err) {
      console.error("Error loading DB data in App:", err);
    }
  };

  // Initial load & Supabase Realtime Subscription setup
  useEffect(() => {
    loadAllDataFromDb();

    // Subscribe to multi-device live updates
    const unsubscribe = subscribeToRealtimeSync((payload) => {
      console.log("Supabase Realtime Sync Event received:", payload.table, payload.eventType);
      loadAllDataFromDb();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Determine if logged-in user is Owner
  const isOwner = currentUser?.role === "owner" || currentUser?.role === "admin";

  // Calculate allowed navbar tabs dynamically based on user permissions
  const userAllowedTabs = useMemo(() => {
    if (!currentUser) return ["pos"];
    if (isOwner) return ["pos", "inventory", "financials", "partners", "settings"];

    const rawPerms = Array.isArray(currentUser.permissions) ? currentUser.permissions : ["pos"];
    const filtered = rawPerms.filter(p => p !== "settings");
    return filtered.length > 0 ? filtered : ["pos"];
  }, [currentUser, isOwner]);

  // Sync active tab to first allowed tab if on unauthorized tab
  useEffect(() => {
    if (currentUser && !userAllowedTabs.includes(activeTab)) {
      setActiveTab(userAllowedTabs[0] || "pos");
    }
  }, [currentUser, userAllowedTabs, activeTab]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e) => {
      setIsStandalone(e.matches || window.navigator.standalone);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Save non-table local states
  useEffect(() => {
    localStorage.setItem("cleanstore_withdrawals", JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem("cleanstore_purchases", JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem("cleanstore_store_info", JSON.stringify(storeInfo));
  }, [storeInfo]);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("التطبيق مثبت بالفعل أو أن متصفحك لا يدعم التثبيت المباشر. يمكنك تثبيته من قائمة خيارات المتصفح.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Authentication Handlers
  const handleLogin = (user) => {
    setCurrentUser(user);
    setActiveSession(user, true);
    loadAllDataFromDb();
    const userIsOwner = user.role === "owner" || user.role === "admin";
    const allowed = userIsOwner
      ? ["pos", "inventory", "financials", "partners", "settings"]
      : (Array.isArray(user.permissions) ? user.permissions.filter(p => p !== "settings") : ["pos"]);
    const targetTab = allowed.includes("pos") ? "pos" : (allowed[0] || "pos");
    setActiveTab(targetTab);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    clearActiveSession();
    setActiveTab("pos");
  };

  const handleDeleteSelfAccount = (passwordConfirmation) => {
    if (!currentUser) return { success: false, error: "لم يتم العثور على حسابك الحالى." };
    const res = deleteSelfAccount(currentUser.id, passwordConfirmation);
    if (res.success) {
      setCurrentUser(null);
      clearActiveSession();
      setUsers([]);
      setActiveTab("pos");
    }
    return res;
  };

  // Developer Reset Tool for Handover
  const handleHandoverReset = () => {
    resetAppForHandover();
    setCurrentUser(null);
    setUsers([]);
    setProducts([]);
    setSales([]);
    setExpenses([]);
    setPurchases([]);
    setPartners([
      { id: "part-1", name: "الشريك الأساسي (المدير)", capitalShare: 50000, profitPercentage: 100 }
    ]);
    setWithdrawals([]);
    setCart([]);
    setStoreInfo({
      name: "Clean Store",
      slogan: "جودة - توفير",
      taxRate: 14
    });
    setActiveTab("pos");
  };

  // Actions for Sales & Inventory Stock Deductions in Supabase
  const handleCheckout = async (newSale) => {
    const saleId = newSale.id || "inv-" + Date.now();
    const cashierName = newSale.cashier || currentUser?.fullName || currentUser?.name || "كاشير المبيعات";
    
    const enrichedSale = {
      ...newSale,
      id: saleId,
      invoiceNumber: newSale.invoiceNumber || `INV-${Date.now()}`,
      cashierId: currentUser?.id || null,
      cashier: cashierName,
      totalAmount: newSale.total || newSale.totalAmount || 0,
      discountAmount: newSale.discount || newSale.discountAmount || 0,
      items: newSale.items || [],
      createdAt: new Date().toISOString()
    };

    // Optimistically update React State
    setSales(prev => [enrichedSale, ...prev]);

    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const soldItem = enrichedSale.items.find(item => item.id === prod.id);
        if (soldItem) {
          const updatedStock = Math.max(0, parseFloat((prod.stockQuantity - soldItem.quantity).toFixed(2)));
          return { ...prod, stockQuantity: updatedStock };
        }
        return prod;
      });
    });

    // Save to Supabase DB & Decrement Stock
    await createInvoiceInDb(enrichedSale);
  };

  // Actions for Product Inventory Management & Purchases
  const handleAddProduct = async (newProduct) => {
    const updated = [newProduct, ...products];
    setProducts(updated);
    await saveProductsInDb(updated);
  };

  const handleUpdateProduct = async (id, updatedProduct) => {
    const updated = products.map(p => p.id === id ? { ...p, ...updatedProduct } : p);
    setProducts(updated);
    await saveProductsInDb(updated);
  };

  const handleDeleteProduct = async (id) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    await saveProductsInDb(updated);
  };

  const handleAddPurchase = async (purchaseData) => {
    const userLabel = currentUser?.fullName || currentUser?.name || "المدير المسؤول";
    const dateStr = purchaseData.date || new Date().toISOString().split("T")[0];

    const newPurchase = {
      ...purchaseData,
      id: "purch-" + Date.now(),
      date: dateStr,
      createdBy: userLabel
    };

    setPurchases(prev => [newPurchase, ...prev]);

    const updatedProducts = products.map(p => {
      if (p.id === purchaseData.productId) {
        const updatedStock = parseFloat(((p.stockQuantity || p.stock || 0) + purchaseData.incomingQty).toFixed(2));
        const updatedCostPrice = purchaseData.unitCost !== undefined && purchaseData.unitCost !== null && purchaseData.unitCost > 0
          ? purchaseData.unitCost
          : p.costPrice;

        return {
          ...p,
          stockQuantity: updatedStock,
          stock: updatedStock,
          costPrice: updatedCostPrice
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    await saveProductsInDb(updatedProducts);

    const supplierText = purchaseData.supplier ? ` (المورد: ${purchaseData.supplier})` : "";
    const newExpense = {
      id: "exp-purch-" + Date.now(),
      title: `فاتورة توريد: ${purchaseData.productName} - كمية: ${purchaseData.incomingQty}`,
      category: "مشتريات وتوريد بضاعة",
      amount: purchaseData.totalPaid,
      date: dateStr
    };

    await handleAddExpense(newExpense);
  };

  const handleStockAdjustment = async ({ productId, newStock, type, reasonNote }) => {
    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          stockQuantity: parseFloat(newStock.toFixed(2)),
          stock: parseFloat(newStock.toFixed(2))
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    await saveProductsInDb(updatedProducts);
  };

  const handleAddExpense = async (newExpense) => {
    setExpenses(prev => [newExpense, ...prev]);
    await createExpenseInDb(newExpense);
  };

  const handleDeleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleAddWithdrawal = (newWithdrawal) => {
    setWithdrawals(prev => [newWithdrawal, ...prev]);
  };

  const handleDeleteWithdrawal = (id) => {
    setWithdrawals(prev => prev.filter(w => w.id !== id));
  };

  const handleRestoreData = async (restored) => {
    if (restored.products) {
      setProducts(restored.products);
      await saveProductsInDb(restored.products);
    }
    if (restored.sales) setSales(restored.sales);
    if (restored.expenses) setExpenses(restored.expenses);
    if (restored.purchases) setPurchases(restored.purchases);
    if (restored.partners) {
      setPartners(restored.partners);
      await savePartnersInDb(restored.partners);
    }
    if (restored.withdrawals) setWithdrawals(restored.withdrawals);
    if (restored.storeInfo) setStoreInfo(restored.storeInfo);
    if (restored.users && Array.isArray(restored.users)) {
      setUsers(restored.users);
    }
  };

  const handleResetAllData = () => {
    setProducts([]);
    setSales([]);
    setExpenses([]);
    setPurchases([]);
    setPartners([
      { id: "part-1", name: "الشريك الأساسي (المدير)", capitalShare: 0, profitPercentage: 100 }
    ]);
    setWithdrawals([]);
    setCart([]);
    localStorage.removeItem("cleanstore_products");
    localStorage.removeItem("cleanstore_sales");
    localStorage.removeItem("cleanstore_expenses");
    localStorage.removeItem("cleanstore_purchases");
    localStorage.removeItem("cleanstore_partners");
    localStorage.removeItem("cleanstore_withdrawals");
  };

  const handleLoadSampleData = async () => {
    setProducts(initialProducts);
    setSales(initialSales);
    setExpenses(initialExpenses);
    setPartners(initialPartners);
    setWithdrawals(initialWithdrawals);
    await saveProductsInDb(initialProducts);
    await savePartnersInDb(initialPartners);
  };

  const initialCapital = partners.reduce((sum, p) => sum + (p.capitalShare || 0), 0);
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

  // Show Arabic Login / First Time Setup screen if unauthenticated
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-teal-500 selection:text-white dir-rtl" dir="rtl">

      {/* HEADER BANNER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">

          {/* Logo & Store Info */}
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="Clean Store Logo"
              className="w-10 h-10 rounded-2xl object-cover shadow-md shadow-teal-100 shrink-0 border border-teal-500/20"
            />
            <div className="text-right">
              <h1 className="font-black text-sm md:text-base text-slate-800 tracking-wide">
                {storeInfo.name}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold">
                {storeInfo.slogan || "جودة - توفير"}
              </p>
            </div>
          </div>

          {/* User Badge & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700 font-bold text-[11px] border border-slate-200">
              {isOwner ? (
                <ShieldCheck size={14} className="text-teal-600" />
              ) : (
                <UserCheck size={14} className="text-cyan-600" />
              )}
              <span>{currentUser.fullName || currentUser.name || currentUser.username}</span>
              <span className="text-[9px] text-slate-400 font-normal">
                ({isOwner ? "مالك / شريك" : "كاشير / موظف"})
              </span>
            </div>

            {!isStandalone && (
              <button
                type="button"
                id="install-btn"
                onClick={handleInstallClick}
                className="install-app-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-[11px] font-black transition-colors cursor-pointer"
                title="تثبيت كتطبيق على جهازك للعمل بدون إنترنت"
              >
                <Download size={13} />
                <span>تثبيت التطبيق</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>

        </div>
      </header>

      {/* DASHBOARD LAYOUT CONTROLLER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full flex flex-col space-y-5 pb-20 md:pb-6">

        {/* DESKTOP TAB NAVIGATION BAR */}
        <nav className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm hidden md:flex items-center gap-2 w-fit print:hidden">
          {userAllowedTabs.includes("pos") && (
            <button
              type="button"
              onClick={() => setActiveTab("pos")}
              className={`py-2 px-4 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === "pos"
                ? "bg-teal-600 text-white shadow-md shadow-teal-100"
                : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              <ShoppingCart size={16} />
              سلة البيع
            </button>
          )}

          {userAllowedTabs.includes("inventory") && (
            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              className={`py-2 px-4 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === "inventory"
                ? "bg-teal-600 text-white shadow-md shadow-teal-100"
                : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              <Package size={16} />
              المخزن والمنتجات
            </button>
          )}

          {userAllowedTabs.includes("financials") && (
            <button
              type="button"
              onClick={() => setActiveTab("financials")}
              className={`py-2 px-4 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === "financials"
                ? "bg-teal-600 text-white shadow-md shadow-teal-100"
                : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              <TrendingUp size={16} />
              المالية والمصروفات
            </button>
          )}

          {userAllowedTabs.includes("partners") && (
            <button
              type="button"
              onClick={() => setActiveTab("partners")}
              className={`py-2 px-4 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === "partners"
                ? "bg-teal-600 text-white shadow-md shadow-teal-100"
                : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              <Users size={16} />
              حسابات الشركاء
            </button>
          )}

          {userAllowedTabs.includes("settings") && (
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`py-2 px-4 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === "settings"
                ? "bg-teal-600 text-white shadow-md shadow-teal-100"
                : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              <Settings size={16} />
              النسخ الاحتياطي والإعدادات
            </button>
          )}
        </nav>

        {/* ACTIVE TAB CONTAINER */}
        <main className="flex-1">
          {userAllowedTabs.includes("pos") && activeTab === "pos" && (
            <PosTab
              products={products}
              onCheckout={handleCheckout}
              cart={cart}
              setCart={setCart}
              storeInfo={storeInfo}
              currentUser={currentUser}
            />
          )}

          {userAllowedTabs.includes("inventory") && activeTab === "inventory" && (
            <InventoryTab
              products={products}
              purchases={purchases}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddPurchase={handleAddPurchase}
              onStockAdjustment={handleStockAdjustment}
              onLoadSampleData={handleLoadSampleData}
              currentUser={currentUser}
            />
          )}

          {userAllowedTabs.includes("financials") && activeTab === "financials" && (
            <FinancialsTab
              sales={sales}
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              products={products}
              initialCapital={initialCapital}
              totalWithdrawals={totalWithdrawals}
            />
          )}

          {userAllowedTabs.includes("partners") && activeTab === "partners" && (
            <PartnersTab
              partners={partners}
              setPartners={async (newPartners) => {
                setPartners(newPartners);
                await savePartnersInDb(newPartners);
              }}
              withdrawals={withdrawals}
              onAddWithdrawal={handleAddWithdrawal}
              onDeleteWithdrawal={handleDeleteWithdrawal}
              sales={sales}
              expenses={expenses}
            />
          )}

          {userAllowedTabs.includes("settings") && activeTab === "settings" && (
            <SettingsTab
              products={products}
              sales={sales}
              expenses={expenses}
              partners={partners}
              withdrawals={withdrawals}
              storeInfo={storeInfo}
              currentUser={currentUser}
              users={users}
              onAddUser={async (newUserPayload) => {
                const res = await registerUserInDb(newUserPayload);
                if (res.success) {
                  const updatedUsers = await fetchUsers();
                  setUsers(updatedUsers);
                }
                return res;
              }}
              onUpdateUser={async (userId, updates) => {
                const res = await updateUserInDb(userId, updates);
                if (res.success) {
                  const updatedUsers = await fetchUsers();
                  setUsers(updatedUsers);
                  if (currentUser && currentUser.id === userId) {
                    const updatedCurrent = { ...currentUser, ...res.user };
                    setCurrentUser(updatedCurrent);
                    setActiveSession(updatedCurrent, true);
                  }
                }
                return res;
              }}
              onDeleteUser={async (userId) => {
                const res = await deleteUserFromDb(userId, currentUser?.id);
                if (res.success) {
                  setUsers(res.remainingUsers);
                }
                return res;
              }}
              onRefreshCloudData={loadAllDataFromDb}
              onDeleteSelfAccount={handleDeleteSelfAccount}
              onHandoverReset={handleHandoverReset}
              onUpdateStoreInfo={setStoreInfo}
              onRestoreData={handleRestoreData}
              onResetAllData={handleResetAllData}
              onLoadSampleData={handleLoadSampleData}
            />
          )}
        </main>

      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center justify-around print:hidden">
        {userAllowedTabs.includes("pos") && (
          <button
            type="button"
            onClick={() => setActiveTab("pos")}
            className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-black transition-colors ${activeTab === "pos" ? "text-teal-600" : "text-slate-500"}`}
          >
            <ShoppingCart size={18} />
            <span>سلة البيع</span>
          </button>
        )}

        {userAllowedTabs.includes("inventory") && (
          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-black transition-colors ${activeTab === "inventory" ? "text-teal-600" : "text-slate-500"}`}
          >
            <Package size={18} />
            <span>المخزن</span>
          </button>
        )}

        {userAllowedTabs.includes("financials") && (
          <button
            type="button"
            onClick={() => setActiveTab("financials")}
            className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-black transition-colors ${activeTab === "financials" ? "text-teal-600" : "text-slate-500"}`}
          >
            <TrendingUp size={18} />
            <span>المالية</span>
          </button>
        )}

        {userAllowedTabs.includes("partners") && (
          <button
            type="button"
            onClick={() => setActiveTab("partners")}
            className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-black transition-colors ${activeTab === "partners" ? "text-teal-600" : "text-slate-500"}`}
          >
            <Users size={18} />
            <span>الشركاء</span>
          </button>
        )}

        {userAllowedTabs.includes("settings") && (
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-black transition-colors ${activeTab === "settings" ? "text-teal-600" : "text-slate-500"}`}
          >
            <Settings size={18} />
            <span>الإعدادات</span>
          </button>
        )}
      </div>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-slate-100 py-3 px-4 text-center mt-auto print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs text-slate-500 font-semibold">
          <img
            src="/icons/icon-192.png"
            alt="Clean Store Logo"
            className="w-5 h-5 rounded-md object-cover border border-teal-500/20 shadow-xs"
          />
          <span className="font-bold text-slate-700">{storeInfo.name}</span>
          <span className="text-slate-300">•</span>
          <span>{storeInfo.slogan || "جودة - توفير"}</span>
        </div>
      </footer>

    </div>
  );
}
