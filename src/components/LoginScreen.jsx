import React, { useState, useEffect } from "react";
import {
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
  UserCheck
} from "lucide-react";
import {
  hasStoreOwner,
  registerFirstOwner
} from "../utils/authStorage";
import {
  hasOwnerInDb,
  registerOwnerInDb,
  authenticateUserInDb
} from "../services/dbService";
import { isSupabaseConfigured } from "../lib/supabase";

export default function LoginScreen({ onLogin }) {
  // Check if owner exists in local storage / DB
  const [ownerExists, setOwnerExists] = useState(() => hasStoreOwner());
  const [loadingDb, setLoadingDb] = useState(true);

  // Check DB owner state on mount
  useEffect(() => {
    let isMounted = true;
    async function loadAuthContext() {
      try {
        const dbHasOwner = await hasOwnerInDb();
        if (isMounted) {
          setOwnerExists(dbHasOwner || hasStoreOwner());
        }
      } catch (err) {
        console.error("Error loading auth context:", err);
      } finally {
        if (isMounted) setLoadingDb(false);
      }
    }
    loadAuthContext();
    return () => { isMounted = false; };
  }, []);

  const isFirstTimeSetup = !ownerExists;

  // Form States: First Time Setup
  const [setupStoreName, setSetupStoreName] = useState("Clean Store");
  const [setupOwnerFullName, setSetupOwnerFullName] = useState("");
  const [setupUsername, setSetupUsername] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [showSetupConfirmPassword, setShowSetupConfirmPassword] = useState(false);

  // Form States: Standard Credentials Login
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

  // Handle First-Time Store Setup Submission
  const handleFirstTimeSetupSubmit = async (e) => {
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

    try {
      // Register in Supabase / DB Service
      const createdOwner = await registerOwnerInDb({
        storeName: cleanStore,
        ownerFullName: cleanOwnerName,
        username: cleanUser,
        password: cleanPass
      });

      // Also fallback to local storage registration
      registerFirstOwner({
        storeName: cleanStore,
        ownerFullName: cleanOwnerName,
        username: cleanUser,
        password: cleanPass
      });

      setLoading(false);
      setSuccessMessage("تم إنشاء حساب مالك المتجر بنجاح! جاري التوجيه إلى التطبيق...");
      setOwnerExists(true);
      setTimeout(() => {
        onLogin(createdOwner);
      }, 500);
    } catch (err) {
      setLoading(false);
      triggerError(err.message || "حدث خطأ أثناء إنشاء حساب المالك.");
    }
  };

  // Handle Standard Credentials Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const cleanId = loginIdentifier.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanId || !cleanPass) {
      triggerError("اسم المستخدم أو كلمة المرور غير صحيحة");
      return;
    }

    setLoading(true);

    try {
      const result = await authenticateUserInDb(cleanId, cleanPass);
      setLoading(false);

      if (result.success && result.user) {
        setSuccessMessage(`أهلاً بك مجدداً ${result.user.fullName || result.user.username}!`);
        setTimeout(() => {
          onLogin(result.user);
        }, 300);
      } else {
        triggerError("اسم المستخدم أو كلمة المرور غير صحيحة");
      }
    } catch (err) {
      setLoading(false);
      triggerError("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
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

          {/* Header (Logo & Store Info & Cloud Status Badge) */}
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

            {/* Cloud Status Indicator */}
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-600">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
              <span>{isSupabaseConfigured() ? "متصل بالسحابة (Supabase Live)" : "وضع العمل المحلي"}</span>
            </div>
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

          {loadingDb ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 size={28} className="animate-spin text-teal-600" />
              <p className="text-xs font-semibold">جاري التحقق من حالة النظام...</p>
            </div>
          ) : isFirstTimeSetup ? (
            /* MODE 1: FIRST TIME STORE SETUP FLOW */
            <div className="flex flex-col space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-teal-100">
                  <ShieldCheck size={22} />
                </div>
                <h2 className="text-sm md:text-base font-black text-teal-950">
                  إعداد متجر جديد وتعيين حساب المالك
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
            /* MODE 2: CLEAN PRIVATE CREDENTIALS LOGIN ONLY */
            <div className="flex flex-col space-y-4">
              <div className="border-b border-slate-100 pb-3 text-center">
                <h2 className="text-base font-black text-slate-800 flex items-center justify-center gap-2">
                  <LogIn size={18} className="text-teal-600" />
                  <span>تسجيل الدخول للنظام</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">
                  أدخل اسم المستخدم وكلمة المرور للوصول إلى حسابك
                </p>
              </div>

              {/* Login Credentials Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-1">
                {/* Field 1: Username */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 text-right">
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

                {/* Field 2: Password with Eye Toggle */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 text-right">
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
                      title={showLoginPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Primary Teal Login Button */}
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

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
