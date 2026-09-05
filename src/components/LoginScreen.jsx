import React, { useState } from "react";
import {
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  LogIn,
  Loader2,
  ShieldCheck,
  Store,
  UserCheck,
  CheckSquare
} from "lucide-react";
import {
  getStoredUsers,
  hasStoreOwner,
  registerFirstOwner,
  authenticateUser
} from "../utils/authStorage";

export default function LoginScreen({ onLogin }) {
  // 1. Check if owner exists in localStorage (clean_store_users / store_users)
  const [ownerExists, setOwnerExists] = useState(() => hasStoreOwner());
  const [users, setUsers] = useState(() => getStoredUsers(false));

  // Mode: If no owner exists -> force "First-Time Setup Flow"
  // If owner exists -> ONLY Login flow (NO public registration button)
  const isFirstTimeSetup = !ownerExists;

  // Selected User Card for Password Login (if clicking a card)
  const [selectedUserCard, setSelectedUserCard] = useState(null);

  // Form States: First Time Setup ("إنشاء حساب مالك المتجر لأول مرة")
  const [setupStoreName, setSetupStoreName] = useState("Clean Store");
  const [setupOwnerFullName, setSetupOwnerFullName] = useState("");
  const [setupUsername, setSetupUsername] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [showSetupConfirmPassword, setShowSetupConfirmPassword] = useState(false);

  // Form States: Normal Login ("تسجيل الدخول")
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Feedback & Loading States
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Helper to extract display initials from user name
  const getUserInitials = (name) => {
    if (!name) return "م";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Handle First-Time Store Setup Submission
  const handleFirstTimeSetupSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const cleanStore = setupStoreName.trim();
    const cleanOwnerName = setupOwnerFullName.trim();
    const cleanUser = setupUsername.trim();
    const cleanPass = setupPassword.trim();

    if (!cleanStore) {
      triggerError("يرجى إدخال اسم المتجر.");
      return;
    }
    if (!cleanOwnerName) {
      triggerError("يرجى إدخال الاسم الكامل لمالك المتجر.");
      return;
    }
    if (!cleanUser) {
      triggerError("يرجى إدخال اسم المستخدم لمالك المتجر.");
      return;
    }
    if (cleanPass.length < 4) {
      triggerError("كلمة المرور يجب أن تتكون من 4 أحرف أو أرقام على الأقل.");
      return;
    }
    if (cleanPass !== setupConfirmPassword.trim()) {
      triggerError("كلمة المرور وتأكيد كلمة المرور غير متطابقين.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result = registerFirstOwner({
        storeName: cleanStore,
        ownerFullName: cleanOwnerName,
        username: cleanUser,
        password: cleanPass
      });

      setLoading(false);

      if (!result.success) {
        triggerError(result.error || "حدث خطأ أثناء إنشاء حساب المالك.");
      } else {
        setSuccessMessage("تم إنشاء حساب مالك المتجر بنجاح! جاري التوجيه إلى التطبيق...");
        setOwnerExists(true);
        setTimeout(() => {
          onLogin(result.user);
        }, 500);
      }
    }, 400);
  };

  // Handle Credentials Login Submit (Existing Accounts)
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const cleanId = loginIdentifier.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanId) {
      triggerError("يرجى إدخال اسم المستخدم أو البريد الإلكتروني.");
      return;
    }
    if (!cleanPass) {
      triggerError("يرجى إدخال كلمة المرور.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result = authenticateUser(cleanId, cleanPass);
      setLoading(false);

      if (!result.success) {
        triggerError(result.error || "بيانات الدخول غير صحيحة.");
      } else {
        setSuccessMessage(`أهلاً بك مجدداً ${result.user.fullName || result.user.username}!`);
        setTimeout(() => {
          onLogin(result.user);
        }, 300);
      }
    }, 300);
  };

  // Quick Card Select Click
  const handleCardClick = (user) => {
    setLoginIdentifier(user.username);
    setSelectedUserCard(user);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 selection:bg-teal-500 selection:text-white font-['Cairo'] relative dir-rtl" dir="rtl">

      {/* Ambient Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">

        {/* Light Card Container */}
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col relative">

          {/* Header (Logo & Store Info) */}
          <div className="flex flex-col items-center text-center mb-6">
            <img
              src="/icons/icon-192.png"
              alt="Clean Store Logo"
              className="w-14 h-14 rounded-2xl object-cover shadow-md shadow-teal-100 mb-3 border border-teal-500/20"
            />
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-800">
              Clean Store
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              نظام إدارة المبيعات والمخازن المتكامل
            </p>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className={`mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2.5 text-xs font-bold ${shake ? "animate-bounce" : ""}`}>
              <AlertCircle size={18} className="text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-2.5 text-xs font-bold">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: FIRST TIME STORE SETUP FLOW (No Owner Account Exists) */}
          {isFirstTimeSetup ? (
            <div className="flex flex-col space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-teal-100">
                  <ShieldCheck size={22} />
                </div>
                <h2 className="text-sm md:text-base font-black text-teal-950">
                  إنشاء حساب مالك المتجر لأول مرة
                </h2>
                <p className="text-[11px] text-teal-700 font-semibold mt-1">
                  أهلاً بك! يرجى إدخال اسم المتجر وبيانات المالك الرئيسي للبدء في استخدام التطبيق
                </p>
              </div>

              <form onSubmit={handleFirstTimeSetupSubmit} className="space-y-3.5">

                {/* 1. Store Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 text-right">
                    اسم المتجر / المحل:
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                      <Store size={16} />
                    </div>
                    <input
                      type="text"
                      value={setupStoreName}
                      onChange={(e) => setSetupStoreName(e.target.value)}
                      placeholder="مثال: Clean Store للمنظفات"
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all text-right"
                      required
                    />
                  </div>
                </div>

                {/* 2. Owner Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 text-right">
                    الاسم الكامل لمالك المتجر:
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      value={setupOwnerFullName}
                      onChange={(e) => setSetupOwnerFullName(e.target.value)}
                      placeholder="مثال: أحمد محمد علي"
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all text-right"
                      required
                    />
                  </div>
                </div>

                {/* 3. Username */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 text-right">
                    اسم المستخدم للدخول:
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                      <UserCheck size={16} />
                    </div>
                    <input
                      type="text"
                      value={setupUsername}
                      onChange={(e) => setSetupUsername(e.target.value)}
                      placeholder="مثال: admin"
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-mono text-right"
                      required
                    />
                  </div>
                </div>

                {/* 4. Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 text-right">
                    كلمة المرور:
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showSetupPassword ? "text" : "password"}
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-mono text-right"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPassword(!showSetupPassword)}
                      className="absolute left-3.5 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                    >
                      {showSetupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* 5. Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 text-right">
                    تأكيد كلمة المرور:
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showSetupConfirmPassword ? "text" : "password"}
                      value={setupConfirmPassword}
                      onChange={(e) => setSetupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-mono text-right"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupConfirmPassword(!showSetupConfirmPassword)}
                      className="absolute left-3.5 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                    >
                      {showSetupConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Create Owner Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-teal-100 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-white" />
                      <span>جاري إنشاء حساب المالك...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>حفظ وإنشاء حساب المالك</span>
                    </>
                  )}
                </button>

              </form>
            </div>
          ) : (
            /* MODE 2: EXISTING ACCOUNTS LOGIN ONLY (NO public registration button!) */
            <div className="flex flex-col space-y-4">

              <div className="border-b border-slate-100 pb-3 text-center">
                <h2 className="text-base font-black text-slate-800 flex items-center justify-center gap-2">
                  <LogIn size={18} className="text-teal-600" />
                  <span>تسجيل الدخول للنظام</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">
                  اختر حسابك أو أدخل اسم المستخدم وكلمة المرور للدخول
                </p>
              </div>

              {/* Registered Accounts Cards Carousel / List */}
              {users.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  <p className="text-[11px] font-bold text-slate-400 text-right">الحسابات المسجلة بالمحل:</p>
                  {users.map((u) => {
                    const isOwnerRole = u.role === "owner" || u.role === "admin";
                    const isSelected = selectedUserCard && selectedUserCard.id === u.id;

                    return (
                      <div
                        key={u.id || u.username}
                        onClick={() => handleCardClick(u)}
                        className={`w-full p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 ${isSelected
                          ? "bg-teal-50/80 border-teal-500 shadow-sm"
                          : "bg-slate-50 hover:bg-teal-50/40 border-slate-200 hover:border-teal-300"
                          }`}
                      >
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs ${isOwnerRole ? "bg-gradient-to-tr from-teal-600 to-emerald-500" : "bg-gradient-to-tr from-cyan-600 to-sky-500"
                          }`}>
                          {getUserInitials(u.fullName || u.username)}
                        </div>

                        {/* Name & Role */}
                        <div className="flex-1 text-right">
                          <div className="font-black text-xs text-slate-800">
                            {u.fullName || u.username}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                            <span>{isOwnerRole ? "مالك / شريك" : "كاشير / موظف"}</span>
                            <span>•</span>
                            <span className="font-mono text-slate-500">@{u.username}</span>
                          </div>
                        </div>

                        {/* Selection check */}
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${isSelected ? "bg-teal-600 text-white" : "bg-white text-slate-300 border border-slate-200"
                          }`}>
                          {isSelected ? <CheckSquare size={14} /> : <User size={14} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Login Credentials Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-1">

                {/* Username */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 text-right">
                    اسم المستخدم:
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="أدخل اسم المستخدم"
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-mono text-right"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 text-right">
                    كلمة المرور:
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-mono text-right"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute left-3.5 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-teal-100 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-white" />
                      <span>جاري تسجيل الدخول...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      <span>تسجيل الدخول</span>
                    </>
                  )}
                </button>

              </form>

              {/* Security Note - Public Sign Up is HIDDEN and DISABLED */}
              <div className="pt-2 text-center text-[10px] text-slate-400 font-semibold">
                🔒 الحسابات تُدار حصرياً من قبل مالك المتجر في قسم الإعدادات.
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

