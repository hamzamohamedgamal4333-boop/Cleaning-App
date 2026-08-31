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
  UserPlus,
  Loader2,
  MoreVertical,
  Trash2,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import {
  getStoredUsers,
  registerStoreOwner,
  registerUser,
  resetAppForClient
} from "../utils/authStorage";

export default function LoginScreen({ onLogin }) {
  // 1. Fetch registered users from localStorage
  const [users, setUsers] = useState(() => getStoredUsers(false));

  // Mode: Show account card switcher if users exist, or create new account form
  const [isCreatingNewAccount, setIsCreatingNewAccount] = useState(() => users.length === 0);

  // Dropdown menu state (3 dots icon)
  const [showMenu, setShowMenu] = useState(false);

  // Register Form States ("إنشاء حساب جديد")
  const [signUpIdentifier, setSignUpIdentifier] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // 1. Handle "إزالة هذا الحساب من الجهاز" (Remove Account)
  const handleRemoveAccount = () => {
    setShowMenu(false);
    setError("");
    setSuccessMessage("");

    // Delete user profile and session completely from localStorage
    resetAppForClient();
    setUsers([]);
    setIsCreatingNewAccount(true);
    setSuccessMessage("تمت إزالة الحساب من الجهاز بنجاح. يمكنك الآن إنشاء حساب جديد.");
  };

  // 2. Handle Direct Account Card Login
  const handleDirectAccountLogin = (user) => {
    onLogin(user);
  };

  // 3. Handle "إنشاء حساب جديد" Form Submit
  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const cleanId = signUpIdentifier.trim();
    if (!cleanId) {
      triggerError("يرجى إدخال اسم المستخدم أو البريد الإلكتروني.");
      return;
    }
    if (signUpPassword.length < 4) {
      triggerError("كلمة المرور يجب أن تتكون من 4 أحرف أو أرقام على الأقل.");
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      triggerError("كلمة المرور وتأكيد كلمة المرور غير متطابقين.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      let result;
      // If no users exist, register as store owner admin
      if (users.length === 0) {
        result = registerStoreOwner({
          username: cleanId,
          password: signUpPassword
        });
      } else {
        // Register new user account
        result = registerUser({
          username: cleanId,
          fullName: cleanId,
          password: signUpPassword,
          role: "cashier"
        });
      }

      setLoading(false);

      if (!result.success) {
        triggerError(result.error || "حدث خطأ أثناء إنشاء الحساب.");
      } else {
        setSuccessMessage("تم إنشاء الحساب بنجاح! جاري التوجيه إلى لوحة التحكم...");
        setTimeout(() => {
          onLogin(result.user);
        }, 500);
      }
    }, 400);
  };

  // Current primary user profile to show on account card (if available)
  const primaryUser = users.length > 0 ? users[0] : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 selection:bg-teal-500 selection:text-white font-['Cairo'] relative dir-rtl" dir="rtl">

      {/* Soft Ambient Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">

        {/* Clean Light Card Container matching app colors */}
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col relative">

          {/* Top-Left Corner: Three-Dots Menu (•••) */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="خيارات الحساب"
              aria-label="خيارات الحساب"
            >
              <MoreVertical size={20} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                {/* Backdrop to close dropdown on click outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />

                <div className="absolute left-0 mt-1 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-1.5 text-right animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={handleRemoveAccount}
                    className="w-full text-right px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>إزالة هذا الحساب من الجهاز</span>
                    <Trash2 size={15} className="shrink-0 text-rose-500" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Header of the Screen (Centered Store Logo and Name) */}
          <div className="flex flex-col items-center text-center mb-6 pt-2">
            <img
              src="/icons/icon-192.png"
              alt="Clean Store Logo"
              className="w-14 h-14 rounded-2xl object-cover shadow-md shadow-teal-100 mb-3 border border-teal-500/20"
            />
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-800">
              Clean Store
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              جودة - توفير
            </p>
          </div>

          {/* Feedback Messages Banner */}
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

          {/* BODY & BOTTOM OF THE SCREEN */}
          {!isCreatingNewAccount && primaryUser ? (
            /* MODE 1: LOGGED-OUT USER ACCOUNT CARD VIEW */
            <div className="flex flex-col space-y-4">

              <p className="text-center text-xs font-bold text-slate-400 mb-1">
                انقر على الحساب أدناه لتبديل الحساب والدخول مباشرة
              </p>

              {/* Account Card showing the logged-out user */}
              {users.map((u) => (
                <div
                  key={u.id || u.username}
                  onClick={() => handleDirectAccountLogin(u)}
                  className="w-full bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-400 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex items-center gap-4 group shadow-sm hover:shadow-md"
                >
                  {/* Circular Avatar / Icon */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform shrink-0">
                    {getUserInitials(u.fullName || u.username)}
                  </div>

                  {/* User Name & Details */}
                  <div className="flex-1 text-right">
                    <h3 className="font-black text-slate-800 text-sm md:text-base group-hover:text-teal-700 transition-colors">
                      {u.fullName || u.name || u.username}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                      <span>{u.role === "admin" ? "مدير النظام" : "كاشير المبيعات"}</span>
                      <span>•</span>
                      <span className="text-teal-600 font-bold">دخول مباشر</span>
                    </p>
                  </div>

                  {/* Direct Login Action Button Icon */}
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 group-hover:border-teal-400 group-hover:bg-teal-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                    <LogIn size={16} />
                  </div>
                </div>
              ))}

              {/* Bottom of the Screen: "إنشاء حساب جديد" Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNewAccount(true)}
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-teal-100 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus size={18} />
                  <span>إنشاء حساب جديد</span>
                </button>
              </div>

            </div>
          ) : (
            /* MODE 2: "إنشاء حساب جديد" FORM VIEW */
            <div className="flex flex-col space-y-4">

              {/* If users exist, allow returning back to Account Switcher */}
              {users.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNewAccount(false)}
                  className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 self-start cursor-pointer transition-colors mb-1"
                >
                  <ArrowRight size={14} />
                  <span>العودة لإنشاء الدخول بالحساب المسجل</span>
                </button>
              )}

              <div className="border-b border-slate-100 pb-3 text-center">
                <h2 className="text-base font-black text-slate-800 flex items-center justify-center gap-2">
                  <UserPlus size={18} className="text-teal-600" />
                  <span>إنشاء حساب جديد</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">
                  أدخل اسم المستخدم وكلمة المرور لإنشاء الحساب الجديد
                </p>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-4">

                {/* Username or Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 text-right">
                    اسم المستخدم أو البريد الإلكتروني:
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      value={signUpIdentifier}
                      onChange={(e) => setSignUpIdentifier(e.target.value)}
                      placeholder="أدخل اسم المستخدم أو البريد"
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-400 text-right"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 text-right">
                    كلمة المرور:
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showSignUpPassword ? "text" : "password"}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-400 text-right"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute left-3.5 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                      title={showSignUpPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showSignUpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 text-right">
                    تأكيد كلمة المرور:
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-2xl text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-400 text-right"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3.5 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                      title={showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Action Button: "إنشاء حساب جديد" */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-teal-100 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-white" />
                      <span>جاري إنشاء الحساب...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      <span>إنشاء حساب جديد</span>
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
