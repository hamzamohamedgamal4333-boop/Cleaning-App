import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  Settings,
  Sparkles,
  AlertTriangle,
  Clock,
  LogOut,
  Download,
  ShieldCheck,
  UserCheck,
  RotateCcw
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
  registerUser,
  updateStoredUser,
  deleteStoredUser,
  deleteSelfAccount,
  resetAppForClient,
  getActiveSession,
  setActiveSession,
  clearActiveSession
} from "./utils/authStorage";

export default function App() {
  // 1. Authentication State (Active Session persistent across refreshes)
  const [currentUser, setCurrentUser] = useState(() => getActiveSession());

  // 1.1 Registered Users List from LocalStorage (store_users)
  const [users, setUsers] = useState(() => getStoredUsers());

  // 2. Global Persistent State (Default to empty arrays for clean start as requested)
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("cleanstore_products");
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem("cleanstore_sales");
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem("cleanstore_expenses");
    return saved ? JSON.parse(saved) : [];
  });

  const [partners, setPartners] = useState(() => {
    const saved = localStorage.getItem("cleanstore_partners");
    return saved ? JSON.parse(saved) : [
      { id: "part-1", name: "الشريك الأساسي (المدير)", capitalShare: 50000, profitPercentage: 100 }
    ];
  });

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
      slogan: "جودة - توفير ",
      taxRate: 14
    };
  });

  // Local UI States
  const [activeTab, setActiveTab] = useState("pos"); // "pos" | "inventory" | "financials" | "partners" | "settings"
  const [cart, setCart] = useState([]); // Shared cart state

  // PWA Install Prompt & Standalone Mode State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(() => {
    return Boolean(window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone);
  });

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

  // Sync state modifications to localStorage
  useEffect(() => {
    localStorage.setItem("cleanstore_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("cleanstore_sales", JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem("cleanstore_expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("cleanstore_partners", JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem("cleanstore_withdrawals", JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem("cleanstore_purchases", JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem("cleanstore_store_info", JSON.stringify(storeInfo));
  }, [storeInfo]);

  // Sync registered users to localStorage (store_users)
  useEffect(() => {
    saveStoredUsers(users);
  }, [users]);

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
      alert("التطبيق مثبت بالفعل أو أن متصفحك لا يدعم التثبيت المباشر. يمكنك تثبيته من قائمة خيارات المتصفح (إضافة للشاشة الرئيسية).");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Authentication Handlers (Active Session persists across page refreshes)
  const handleLogin = (user) => {
    setCurrentUser(user);
    setActiveSession(user, true);
    // If cashier, enforce pos tab
    if (user.role === "cashier") {
      setActiveTab("pos");
    }
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
      setUsers(getStoredUsers(false));
      setActiveTab("pos");
    }
    return res;
  };

  const handleClientReset = () => {
    const confirmReset = window.confirm(
      "هل أنت متأكد من حذف الحساب وتجهيز البرنامج للمالك الجديد؟"
    );
    if (confirmReset) {
      resetAppForClient();
      setCurrentUser(null);
      setUsers([]);
      setActiveTab("pos");
    }
  };

  // Actions for Sales & Inventory Stock Deductions
  const handleCheckout = (newSale) => {
    // 1. Enrich sale record with logged-in cashier details
    const enrichedSale = {
      ...newSale,
      cashier: newSale.cashier || currentUser?.fullName || currentUser?.name || "كاشير المبيعات",
      cashierUsername: newSale.cashierUsername || currentUser?.username || "cashier",
      cashierRole: newSale.cashierRole || currentUser?.role || "cashier"
    };

    setSales(prevSales => [enrichedSale, ...prevSales]);

    // 2. Auto-deduct quantities from inventory products
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const soldItem = enrichedSale.items.find(item => item.id === prod.id);
        if (soldItem) {
          const updatedStock = Math.max(0, parseFloat((prod.stock - soldItem.quantity).toFixed(2)));
          return {
            ...prod,
            stock: updatedStock,
            lastModifiedBy: enrichedSale.cashier,
            lastModifiedAt: new Date().toISOString()
          };
        }
        return prod;
      });
    });
  };

  // Actions for Product Inventory Management & Purchases
  const handleAddProduct = (newProduct) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleUpdateProduct = (id, updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedProduct } : p));
  };

  const handleDeleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Handle Recording a Purchase Invoice (تسجيل فاتورة توريد / مشتريات)
  const handleAddPurchase = (purchaseData) => {
    const userLabel = currentUser?.fullName || currentUser?.name || "المدير المسؤول";
    const dateStr = purchaseData.date || new Date().toISOString().split("T")[0];

    // 1. Create Purchase Invoice Record
    const newPurchase = {
      ...purchaseData,
      id: "purch-" + Date.now(),
      date: dateStr,
      createdBy: userLabel
    };

    setPurchases(prev => [newPurchase, ...prev]);

    // 2. Automatically increase product's available stock & update unit cost price if modified
    setProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.id === purchaseData.productId) {
          const updatedStock = parseFloat((p.stock + purchaseData.incomingQty).toFixed(2));
          const updatedCostPrice = purchaseData.unitCost !== undefined && purchaseData.unitCost !== null && purchaseData.unitCost > 0
            ? purchaseData.unitCost
            : p.costPrice;

          return {
            ...p,
            stock: updatedStock,
            costPrice: updatedCostPrice,
            lastModifiedBy: `${userLabel} (فاتورة توريد #${newPurchase.id.slice(-4)})`,
            lastModifiedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );

    // 3. Record purchase in Financials/Expenses ledger as cost of inventory
    const supplierText = purchaseData.supplier ? ` (المورد: ${purchaseData.supplier})` : "";
    const newExpense = {
      id: "exp-purch-" + Date.now(),
      category: "مشتريات وتوريد بضاعة",
      amount: purchaseData.totalPaid,
      date: dateStr,
      description: `فاتورة توريد: ${purchaseData.productName} - كمية: ${purchaseData.incomingQty} ${purchaseData.unit || ""} - بسعر وحدة: ${purchaseData.unitCost} ج.م${supplierText}`
    };

    setExpenses(prev => [newExpense, ...prev]);
  };

  // Handle Stock Adjustment (تسوية جرد / تالف)
  const handleStockAdjustment = ({ productId, newStock, type, reasonNote }) => {
    const userLabel = currentUser?.fullName || currentUser?.name || "المدير المسؤول";

    setProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.id === productId) {
          const reasonText = reasonNote ? `: ${reasonNote}` : "";
          return {
            ...p,
            stock: parseFloat(newStock.toFixed(2)),
            lastModifiedBy: `${userLabel} (${type}${reasonText})`,
            lastModifiedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );
  };

  // Actions for Operational Expenses
  const handleAddExpense = (newExpense) => {
    setExpenses(prev => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Actions for Partner Profit Withdrawals
  const handleAddWithdrawal = (newWithdrawal) => {
    setWithdrawals(prev => [newWithdrawal, ...prev]);
  };

  const handleDeleteWithdrawal = (id) => {
    setWithdrawals(prev => prev.filter(w => w.id !== id));
  };

  // Backup & Restore Actions
  const handleRestoreData = (restored) => {
    if (restored.products) setProducts(restored.products);
    if (restored.sales) setSales(restored.sales);
    if (restored.expenses) setExpenses(restored.expenses);
    if (restored.purchases) setPurchases(restored.purchases);
    if (restored.partners) setPartners(restored.partners);
    if (restored.withdrawals) setWithdrawals(restored.withdrawals);
    if (restored.storeInfo) setStoreInfo(restored.storeInfo);
    if (restored.users && Array.isArray(restored.users)) {
      setUsers(restored.users);
      saveStoredUsers(restored.users);
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

  // Load Sample Demo Data
  const handleLoadSampleData = () => {
    setProducts(initialProducts);
    setSales(initialSales);
    setExpenses(initialExpenses);
    setPartners(initialPartners);
    setWithdrawals(initialWithdrawals);
  };

  // Stock Alert Indicators
  const lowStockAlerts = products.filter(p => p.stock > 0 && p.stock <= p.reorderThreshold).length;
  const outOfStockAlerts = products.filter(p => p.stock <= 0).length;
  const initialCapital = partners.reduce((sum, p) => sum + (p.capitalShare || 0), 0);
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

  // If user is not logged in, show Arabic Authentication screen
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const isAdmin = currentUser.role === "admin";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-teal-500 selection:text-white">

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

            {/* Active User Role Badge */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700 font-bold text-[11px] border border-slate-200">
              {isAdmin ? (
                <ShieldCheck size={14} className="text-teal-600" />
              ) : (
                <UserCheck size={14} className="text-cyan-600" />
              )}
              <span>{currentUser.fullName || currentUser.name || "المستخدم"}</span>
              <span className="text-[9px] text-slate-400 font-normal">
                ({isAdmin ? "مدير" : "كاشير"})
              </span>
            </div>

            {/* In-App PWA Install Button (Hidden in Standalone Mode) */}
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

            {/* Logout Button */}
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

        {/* DESKTOP TAB NAVIGATION BAR (Filtered by Role) */}
        <nav className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm hidden md:flex items-center gap-2 w-fit print:hidden">

          {/* POS Tab - Accessible to both Admin & Cashier */}
          <button
            type="button"
            onClick={() => setActiveTab("pos")}
            className={`py-2 px-4 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === "pos"
              ? "bg-teal-600 text-white shadow-md shadow-teal-100"
              : "text-slate-600 hover:bg-slate-50"
              }`}
          >
            <ShoppingCart size={16} />
            سله البيع
          </button>

          {/* Admin Restricted Tabs */}
          {isAdmin && (
            <>
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

              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className={`py-2 px-4 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === "settings"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-100"
                  : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <Settings size={16} />
                {isAdmin ? "النسخ الاحتياطي والإعدادات" : "حسابي الشخصي والإعدادات"}
              </button>
            </>
          )}

          {!isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`py-2 px-4 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === "settings"
                ? "bg-teal-600 text-white shadow-md shadow-teal-100"
                : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              <Settings size={16} />
              الإعدادات
            </button>
          )}

        </nav>

        {/* ACTIVE TAB CONTAINER */}
        <main className="flex-1">
          {activeTab === "pos" && (
            <PosTab
              products={products}
              onCheckout={handleCheckout}
              cart={cart}
              setCart={setCart}
              storeInfo={storeInfo}
              currentUser={currentUser}
            />
          )}

          {isAdmin && activeTab === "inventory" && (
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

          {isAdmin && activeTab === "financials" && (
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

          {isAdmin && activeTab === "partners" && (
            <PartnersTab
              partners={partners}
              setPartners={setPartners}
              withdrawals={withdrawals}
              onAddWithdrawal={handleAddWithdrawal}
              onDeleteWithdrawal={handleDeleteWithdrawal}
              sales={sales}
              expenses={expenses}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              products={products}
              sales={sales}
              expenses={expenses}
              partners={partners}
              withdrawals={withdrawals}
              storeInfo={storeInfo}
              currentUser={currentUser}
              users={users}
              onAddUser={(newUserPayload) => {
                const res = registerUser(newUserPayload);
                if (res.success) {
                  setUsers(getStoredUsers(false));
                }
                return res;
              }}
              onUpdateUser={(userId, updates) => {
                const res = updateStoredUser(userId, updates);
                if (res.success) {
                  setUsers(getStoredUsers(false));
                  if (currentUser && currentUser.id === userId) {
                    const updatedCurrent = { ...currentUser, ...updates };
                    setCurrentUser(updatedCurrent);
                    setActiveSession(updatedCurrent, true);
                  }
                }
                return res;
              }}
              onDeleteUser={(userId) => {
                const res = deleteStoredUser(userId, currentUser?.id);
                if (res.success) {
                  setUsers(res.remainingUsers);
                }
                return res;
              }}
              onDeleteSelfAccount={handleDeleteSelfAccount}
              onUpdateStoreInfo={setStoreInfo}
              onRestoreData={handleRestoreData}
              onResetAllData={handleResetAllData}
              onLoadSampleData={handleLoadSampleData}
            />
          )}
        </main>

      </div>

      {/* MOBILE BOTTOM STICKY NAVIGATION BAR (Role Aware) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center justify-around print:hidden">

        <button
          type="button"
          onClick={() => setActiveTab("pos")}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-black transition-colors ${activeTab === "pos" ? "text-teal-600" : "text-slate-500"
            }`}
        >
          <ShoppingCart size={18} />
          <span>نقاط البيع</span>
        </button>

        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-black transition-colors ${activeTab === "inventory" ? "text-teal-600" : "text-slate-500"
                }`}
            >
              <Package size={18} />
              <span>المخزن</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("financials")}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-black transition-colors ${activeTab === "financials" ? "text-teal-600" : "text-slate-500"
                }`}
            >
              <TrendingUp size={18} />
              <span>المالية</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("partners")}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-black transition-colors ${activeTab === "partners" ? "text-teal-600" : "text-slate-500"
                }`}
            >
              <Users size={18} />
              <span>الشركاء</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-black transition-colors ${activeTab === "settings" ? "text-teal-600" : "text-slate-500"
            }`}
        >
          <Settings size={18} />
          <span>{isAdmin ? "الإعدادات" : "حسابي"}</span>
        </button>

      </div>

      {/* APPLICATION FOOTER */}
      <footer className="w-full bg-white border-t border-slate-100 py-3 px-4 text-center mt-auto print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs text-slate-500 font-semibold">
          <img
            src="/icons/icon-192.png"
            alt="Clean Store Logo"
            className="w-5 h-5 rounded-md object-cover border border-teal-500/20 shadow-xs"
          />
          <span className="font-bold text-slate-700">{storeInfo.name}</span>
          <span className="text-slate-300">•</span>
          <span>{storeInfo.slogan || "جودة - توفير "}</span>
        </div>
      </footer>

    </div>
  );
}
