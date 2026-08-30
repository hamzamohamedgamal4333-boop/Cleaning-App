import React, { useState, useRef } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Store,
  Phone,
  MapPin,
  Percent,
  Save,
  FileText,
  Users,
  UserPlus,
  UserX,
  ShieldCheck,
  UserCheck,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  User,
  Mail,
  X
} from "lucide-react";
import {
  initialProducts,
  initialSales,
  initialExpenses,
  initialPartners,
  initialWithdrawals
} from "../utils/sampleData";

export default function SettingsTab({
  products,
  sales,
  expenses,
  partners,
  withdrawals,
  storeInfo,
  onUpdateStoreInfo,
  onRestoreData,
  onResetAllData,
  onLoadSampleData,
  currentUser,
  users = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onDeleteSelfAccount
}) {
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  // User Management Modals State (Admin)
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);

  // Self Account Deletion Modal State
  const [deleteSelfModalOpen, setDeleteSelfModalOpen] = useState(false);
  const [deleteSelfPassword, setDeleteSelfPassword] = useState("");
  const [deleteSelfError, setDeleteSelfError] = useState("");

  // Add User Form State
  const [newUserName, setNewUserName] = useState("");
  const [newUserIdentifier, setNewUserIdentifier] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("cashier");
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  // Edit User Form State
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState("cashier");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [storeForm, setStoreForm] = useState(storeInfo || {
    name: "",
    phone: "",
    address: "",
    taxRate: 14
  });

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setErrorMessage("");
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setSuccessMessage("");
    setTimeout(() => setErrorMessage(""), 4000);
  };

  // 1. Export JSON Backup
  const handleExportJson = () => {
    const backupData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      storeInfo: storeForm,
      products,
      sales,
      expenses,
      partners,
      withdrawals,
      users
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("download", `cleanstore-backup-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showNotification("تم تصدير النسخة الاحتياطية بنجاح بصيغة JSON!");
  };

  // 2. Restore JSON Backup
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.products || !Array.isArray(parsed.products)) {
          alert("الملف المرفوع لا يحتوي على بنية بيانات صحيحة لمتجر المنظفات!");
          return;
        }

        const confirmRestore = window.confirm(
          `تم قراءة النسخة بنجاح!\n- المنتجات: ${parsed.products.length}\n- المبيعات: ${parsed.sales?.length || 0}\n- المصروفات: ${parsed.expenses?.length || 0}\n\nهل تريد استعادة البيانات الآن؟ سيتم استبدال البيانات الحالية.`
        );

        if (confirmRestore) {
          onRestoreData({
            products: parsed.products || [],
            sales: parsed.sales || [],
            expenses: parsed.expenses || [],
            partners: parsed.partners || [],
            withdrawals: parsed.withdrawals || [],
            storeInfo: parsed.storeInfo || storeForm
          });
          showNotification("تمت استعادة البيانات بنجاح تام!");
        }
      } catch (err) {
        console.error("Restore error:", err);
        alert("حدث خطأ أثناء قراءة ملف النسخة الاحتياطية. يرجى التأكد من اختيار ملف JSON صالح.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // 3. Export CSV with UTF-8 BOM for Excel
  const exportCsv = (filename, headers, rows) => {
    const bom = "\uFEFF";
    const csvContent = bom + [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Export Products CSV
  const handleExportProductsCsv = () => {
    const headers = ["الباركود", "اسم المنتج", "القسم", "الوحدة", "سعر الشراء (ج.م)", "سعر البيع (ج.م)", "المخزون الحالي", "حد الأمان"];
    const rows = products.map(p => [
      p.barcode,
      p.name,
      p.category,
      p.unit,
      p.costPrice,
      p.sellingPrice,
      p.stock,
      p.reorderThreshold
    ]);
    exportCsv(`cleanstore-products-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showNotification("تم تصدير قائمة المنتجات إلى CSV/Excel بنجاح!");
  };

  // Export Sales CSV
  const handleExportSalesCsv = () => {
    const headers = ["رقم الفاتورة", "التاريخ والوقت", "الكاشير / البائع", "طريقة الدفع", "المجموع الفرعي", "الخصم", "الضريبة", "الإجمالي", "تكلفة البضاعة"];
    const rows = sales.map(s => [
      s.id,
      new Date(s.date).toLocaleString("ar-EG"),
      s.cashier || "كاشير",
      s.paymentMethod || "نقدي",
      s.subtotal,
      s.discount,
      s.tax,
      s.total,
      s.cogs || 0
    ]);
    exportCsv(`cleanstore-sales-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showNotification("تم تصدير سجلات المبيعات إلى CSV/Excel بنجاح!");
  };

  // Export Expenses CSV
  const handleExportExpensesCsv = () => {
    const headers = ["المعرف", "التاريخ والوقت", "البند / العنوان", "القسم", "المبلغ (ج.م)", "ملاحظات"];
    const rows = expenses.map(e => [
      e.id,
      new Date(e.date).toLocaleString("ar-EG"),
      e.title,
      e.category,
      e.amount,
      e.notes || ""
    ]);
    exportCsv(`cleanstore-expenses-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showNotification("تم تصدير سجل المصروفات إلى CSV/Excel بنجاح!");
  };

  // Save Store Settings
  const handleSaveStoreInfo = (e) => {
    e.preventDefault();
    if (onUpdateStoreInfo) {
      onUpdateStoreInfo(storeForm);
      showNotification("تم حفظ وتحديث بيانات المحل بنجاح!");
    }
  };

  // Add User Handlers (Admin)
  const handleOpenAddUserModal = () => {
    setNewUserName("");
    setNewUserIdentifier("");
    setNewUserPassword("");
    setNewUserRole("cashier");
    setAddUserModalOpen(true);
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return showError("يرجى إدخال اسم الموظف الكامل.");
    if (!newUserIdentifier.trim()) return showError("يرجى إدخال اسم المستخدم أو البريد.");
    if (newUserPassword.length < 4) return showError("كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل.");

    const isEmail = newUserIdentifier.includes("@");
    const payload = {
      fullName: newUserName.trim(),
      username: isEmail ? newUserIdentifier.split("@")[0] : newUserIdentifier.trim(),
      email: isEmail ? newUserIdentifier.trim() : "",
      password: newUserPassword,
      role: newUserRole
    };

    const result = onAddUser(payload);
    if (result && !result.success) {
      showError(result.error || "تعذر إضافة الموظف.");
    } else {
      setAddUserModalOpen(false);
      showNotification(`تمت إضافة الموظف "${newUserName}" بنجاح!`);
    }
  };

  // Edit User Handlers (Admin)
  const handleOpenEditUserModal = (u) => {
    setSelectedUserForEdit(u);
    setEditFullName(u.fullName || "");
    setEditRole(u.role || "cashier");
    setEditPassword("");
    setEditUserModalOpen(true);
  };

  const handleEditUserSubmit = (e) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    if (!editFullName.trim()) return showError("يرجى إدخال الاسم الكامل.");

    const updates = {
      fullName: editFullName.trim(),
      role: editRole
    };
    if (editPassword.trim()) {
      if (editPassword.length < 4) return showError("كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل.");
      updates.password = editPassword.trim();
    }

    const result = onUpdateUser(selectedUserForEdit.id, updates);
    if (result && !result.success) {
      showError(result.error || "تعذر تعديل الحساب.");
    } else {
      setEditUserModalOpen(false);
      showNotification(`تم تحديث بيانات الحساب "${editFullName}" بنجاح!`);
    }
  };

  const handleDeleteUserClick = (u) => {
    const confirmDelete = window.confirm(`هل أنت متأكد من حذف الحساب "${u.fullName}" (${u.username}) نهائياً من النظام؟`);
    if (!confirmDelete) return;

    const result = onDeleteUser(u.id);
    if (result && !result.success) {
      showError(result.error || "تعذر حذف الحساب.");
    } else {
      showNotification(`تم حذف الحساب "${u.fullName}" بنجاح.`);
    }
  };

  // Self Account Deletion Handler
  const handleConfirmDeleteSelf = (e) => {
    e.preventDefault();
    setDeleteSelfError("");

    if (!deleteSelfPassword.trim()) {
      setDeleteSelfError("يرجى إدخال كلمة المرور التأكيدية.");
      return;
    }

    if (onDeleteSelfAccount) {
      const res = onDeleteSelfAccount(deleteSelfPassword);
      if (res && !res.success) {
        setDeleteSelfError(res.error || "تعذر حذف الحساب.");
      } else {
        setDeleteSelfModalOpen(false);
        setDeleteSelfPassword("");
      }
    }
  };

  const adminUsersCount = users.filter(u => u.role === "admin").length;
  const cashierUsersCount = users.filter(u => u.role === "cashier").length;
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-6 dir-rtl text-right font-['Cairo']">

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 font-bold text-sm shadow-sm animate-pulse">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 font-bold text-sm shadow-sm">
          <AlertTriangle size={20} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 0. MY ACCOUNT PROFILE & SELF DELETION (حسابي الشخصي) */}
      {/* ======================================================== */}
      {currentUser && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-teal-100">
                {currentUser.fullName ? currentUser.fullName.charAt(0) : "م"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-slate-800 text-base">{currentUser.fullName || currentUser.name}</h2>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${isAdmin ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-cyan-50 text-cyan-800 border-cyan-200"
                    }`}>
                    {isAdmin ? "مدير النظام" : "كاشير مبيعات"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  اسم المستخدم: <strong>{currentUser.username}</strong> {currentUser.email ? `• ${currentUser.email}` : ""}
                </p>
              </div>
            </div>

            {/* Self Account Deletion Button */}
            <button
              type="button"
              onClick={() => {
                setDeleteSelfPassword("");
                setDeleteSelfError("");
                setDeleteSelfModalOpen(true);
              }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-sm"
            >
              <UserX size={16} />
              <span>حذف حسابي الشخصي</span>
            </button>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. USER & STAFF ACCOUNTS MANAGEMENT (إدارة الحسابات للمدير) */}
      {/* ======================================================== */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">

          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-600">
                <Users size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-slate-800 text-base">إدارة حسابات الموظفين وصلاحيات الدخول</h2>
                  <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {users.length} مستخدم
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  إدارة كادر العمل، تحديد الأدوار (مدير نظام / كاشير)، وتعيين كلمات المرور بأمان
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Metrics */}
              <div className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span>مديرين: <strong className="text-teal-700 font-mono">{adminUsersCount}</strong></span>
                <span className="text-slate-300">•</span>
                <span>كاشير: <strong className="text-cyan-700 font-mono">{cashierUsersCount}</strong></span>
              </div>

              {/* Add User Button */}
              <button
                type="button"
                onClick={handleOpenAddUserModal}
                className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-teal-100 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <UserPlus size={15} />
                <span>إضافة موظف جديد</span>
              </button>
            </div>
          </div>

          {/* Users List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 rounded-r-xl">الموظف / الاسم الكامل</th>
                  <th className="py-3 px-4">اسم المستخدم / البريد</th>
                  <th className="py-3 px-4">الدور والصلاحيات</th>
                  <th className="py-3 px-4">تاريخ الإنشاء</th>
                  <th className="py-3 px-4 text-center rounded-l-xl">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isCurrent = currentUser && currentUser.id === u.id;
                  const uIsAdmin = u.role === "admin";
                  const isOnlyAdmin = uIsAdmin && adminUsersCount <= 1;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">

                      {/* User Full Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${uIsAdmin ? "bg-teal-100 text-teal-800" : "bg-cyan-100 text-cyan-800"
                            }`}>
                            {u.fullName ? u.fullName.charAt(0) : "م"}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              <span>{u.fullName || "بدون اسم"}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-md font-bold">
                                  أنت (الحساب الحالي)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {u.notes || (uIsAdmin ? "صلاحيات إدارية كاملة" : "نقاط البيع والفواتير")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Username or Email */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-600">
                        <div>{u.username}</div>
                        {u.email && u.email !== `${u.username}@cleanstore.local` && (
                          <div className="text-[10px] text-slate-400 font-sans">{u.email}</div>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        {uIsAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-black">
                            <ShieldCheck size={13} className="text-teal-600" />
                            مدير النظام (Admin)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 text-[11px] font-black">
                            <UserCheck size={13} className="text-cyan-600" />
                            كاشير مبيعات (Cashier)
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("ar-EG") : "مسجل بالمنظومة"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditUserModal(u)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 transition-colors cursor-pointer"
                            title="تعديل الصلاحيات أو كلمة المرور"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            disabled={isCurrent || isOnlyAdmin}
                            onClick={() => handleDeleteUserClick(u)}
                            className={`p-1.5 rounded-lg transition-colors ${isCurrent || isOnlyAdmin
                              ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                              : "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 cursor-pointer"
                              }`}
                            title={
                              isCurrent
                                ? "استخدم زر 'حذف حسابي' أعلاه لحذف حسابك الحالي"
                                : isOnlyAdmin
                                  ? "لا يمكن حذف آخر مدير للنظام"
                                  : "حذف الحساب نهائياً"
                            }
                          >
                            <Trash2 size={14} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. STORE SETTINGS & DATA OPERATIONS (الإعدادات للمدير) */}
      {/* ======================================================== */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Store Profile & Invoice Settings */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Store size={20} />
              </div>
              <div>
                <h2 className="font-black text-slate-800 text-base">بيانات المحل والفاتورة</h2>

              </div>
            </div>

            <form onSubmit={handleSaveStoreInfo} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">اسم المحل / المتجر:</label>
                <input
                  type="text"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>



              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">رقم الهاتف للتواصل:</label>
                  <input
                    type="text"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>


              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">العنوان والفرع:</label>
                <input
                  type="text"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-teal-100 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Save size={16} />
                حفظ
              </button>
            </form>
          </div>

          {/* Backup & Restore and Data Operations */}
          <div className="lg:col-span-7 space-y-6">

            {/* Backup & Restore Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <Database size={20} />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-base">النسخ الاحتياطي والاستعادة الكاملة</h2>
                  <p className="text-[11px] text-slate-400">حفظ أو استعادة كافة بيانات المتجر</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Export JSON */}
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="p-4 bg-slate-50 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 rounded-2xl flex flex-col items-start gap-2 transition-all cursor-pointer group text-right"
                >
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-100 group-hover:scale-105 transition-transform">
                    <Download size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm">تصدير نسخة احتياطية (JSON)</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">تحميل ملف شامل لجميع البيانات لحفظها خارج الجهاز</p>
                  </div>
                </button>

                {/* Import JSON */}
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full p-4 bg-slate-50 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 rounded-2xl flex flex-col items-start gap-2 transition-all cursor-pointer group text-right"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Upload size={18} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-sm">استعادة نسخة احتياطية</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">رفع ملف JSON سابق لاسترجاع المتجر بالكامل</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Export to Excel / CSV */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-base">تصدير التوافق مع إكسل (CSV)</h2>
                  <p className="text-[11px] text-slate-400">تصدير تقارير مشفرة بـ UTF-8 BOM تدعم اللغة العربية في Excel بدون رموز غريبة</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={handleExportProductsCsv}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl font-bold text-slate-700 hover:text-emerald-800 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileText size={15} />
                  <span>تصدير المنتجات</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportSalesCsv}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl font-bold text-slate-700 hover:text-emerald-800 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileText size={15} />
                  <span>تصدير المبيعات</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExpensesCsv}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl font-bold text-slate-700 hover:text-emerald-800 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileText size={15} />
                  <span>تصدير المصروفات</span>
                </button>
              </div>
            </div>

            {/* Clear All Data */}
            <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h2 className="font-black text-rose-800 text-base">تصفير وإعادة تهيئة البيانات</h2>
                    <p className="text-[11px] text-slate-400">مسح المنتجات والمبيعات والمصروفات والبدء بقاعدة بيانات فارغة</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-100 transition-all cursor-pointer shrink-0"
                >
                  تصفير البيانات
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SELF ACCOUNT DELETION CONFIRMATION                */}
      {/* ======================================================== */}
      {deleteSelfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up text-right">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-black text-base">
                <AlertTriangle size={22} className="animate-pulse" />
                <span>حذف الحساب الشخصي نهائياً</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteSelfModalOpen(false);
                  setDeleteSelfPassword("");
                  setDeleteSelfError("");
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1.5">
              <div className="font-black text-sm text-rose-700">⚠️ تحذير نهائي:</div>
              <div>
                أنت على وشك حذف حسابك الحالي <strong>({currentUser?.fullName || currentUser?.username})</strong> نهائياً من المتجر.
              </div>
              <div className="text-[11px] text-rose-700 font-bold">
                سيتم تسجيل خروجك فوراً ولن تتمكن من الوصول للنظام بهذا الحساب مرة أخرى.
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 font-medium leading-relaxed">
              💡 <strong>حماية البيانات المالية:</strong> جميع المعاملات المالية وفواتير المبيعات السابقة المسجلة باسمك ستظل محفوظة ومأمونة في تقارير المحل.
            </div>

            {deleteSelfError && (
              <div className="p-3 bg-rose-100 border border-rose-300 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{deleteSelfError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmDeleteSelf} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  لتأكيد الحذف النهائي، أدخل كلمة المرور الخاصة بحسابك (أو اكتب "حذف"):
                </label>
                <input
                  type="password"
                  value={deleteSelfPassword}
                  onChange={(e) => setDeleteSelfPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور أو كلمة حذف"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-right"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteSelfModalOpen(false);
                    setDeleteSelfPassword("");
                    setDeleteSelfError("");
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  إلغاء وتراجع
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md shadow-rose-100 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={15} />
                  <span>تأكيد حذف الحساب نهائياً</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD STAFF USER (Admin)                            */}
      {/* ======================================================== */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-teal-700 font-black text-base">
                <UserPlus size={20} />
                <span>إضافة موظف جديد لمتجر المنظفات</span>
              </div>
              <button
                type="button"
                onClick={() => setAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">الاسم الكامل للموظف:</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="مثال: محمود محمد"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم المستخدم أو البريد الإلكتروني:</label>
                <input
                  type="text"
                  value={newUserIdentifier}
                  onChange={(e) => setNewUserIdentifier(e.target.value)}
                  placeholder="مثال: mahmoud أو mahmoud@store.com"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">كلمة المرور:</label>
                <div className="relative flex items-center">
                  <input
                    type={showNewUserPassword ? "text" : "password"}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                    className="absolute left-2.5 text-slate-400 hover:text-teal-600 cursor-pointer"
                  >
                    {showNewUserPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">الدور والصلاحيات في التطبيق:</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${newUserRole === "cashier" ? "bg-teal-50 border-teal-500 text-teal-900" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}>
                    <input
                      type="radio"
                      name="role"
                      value="cashier"
                      checked={newUserRole === "cashier"}
                      onChange={() => setNewUserRole("cashier")}
                      className="hidden"
                    />
                    <UserCheck size={16} className={newUserRole === "cashier" ? "text-teal-600" : "text-slate-400"} />
                    <div>
                      <div className="font-extrabold text-xs">كاشير مبيعات</div>
                      <div className="text-[10px] text-slate-400">نقاط البيع والفواتير فقط</div>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${newUserRole === "admin" ? "bg-teal-50 border-teal-500 text-teal-900" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={newUserRole === "admin"}
                      onChange={() => setNewUserRole("admin")}
                      className="hidden"
                    />
                    <ShieldCheck size={16} className={newUserRole === "admin" ? "text-teal-600" : "text-slate-400"} />
                    <div>
                      <div className="font-extrabold text-xs">مدير النظام</div>
                      <div className="text-[10px] text-slate-400">جميع الصلاحيات والإعدادات</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-teal-100 transition-colors cursor-pointer"
                >
                  حفظ وتأكيد الإضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT STAFF USER (Admin)                           */}
      {/* ======================================================== */}
      {editUserModalOpen && selectedUserForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-teal-700 font-black text-base">
                <Edit2 size={18} />
                <span>تعديل حساب ({selectedUserForEdit.username})</span>
              </div>
              <button
                type="button"
                onClick={() => setEditUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">الاسم الكامل للموظف:</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">تغيير كلمة المرور (اختياري - اتركها فارغة إذا لم تكن تريد تغييرها):</label>
                <div className="relative flex items-center">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="كلمة المرور الجديدة..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute left-2.5 text-slate-400 hover:text-teal-600 cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">الدور والصلاحيات:</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${editRole === "cashier" ? "bg-teal-50 border-teal-500 text-teal-900" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}>
                    <input
                      type="radio"
                      name="editRole"
                      value="cashier"
                      checked={editRole === "cashier"}
                      onChange={() => setEditRole("cashier")}
                      className="hidden"
                    />
                    <UserCheck size={16} className={editRole === "cashier" ? "text-teal-600" : "text-slate-400"} />
                    <div className="font-extrabold text-xs">كاشير مبيعات</div>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${editRole === "admin" ? "bg-teal-50 border-teal-500 text-teal-900" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}>
                    <input
                      type="radio"
                      name="editRole"
                      value="admin"
                      checked={editRole === "admin"}
                      onChange={() => setEditRole("admin")}
                      className="hidden"
                    />
                    <ShieldCheck size={16} className={editRole === "admin" ? "text-teal-600" : "text-slate-400"} />
                    <div className="font-extrabold text-xs">مدير النظام</div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditUserModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-teal-100 transition-colors cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RESET DATA CONFIRMATION                           */}
      {/* ======================================================== */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-right">

            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-800">تأكيد تصفير ومسح كافة البيانات</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                تحذير هام: هذا الإجراء سيقوم بحذف كافة المنتجات، فواتير المبيعات، سجلات المصروفات، ومسحوبات الشركاء من التخزين المحلي.
              </p>
            </div>

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs font-bold text-center">
              هل أنت متأكد تماماً من رغبتك في البدء بقاعدة بيانات فارغة تماماً؟
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onResetAllData();
                  setResetModalOpen(false);
                  showNotification("تم تصفير ومسح كافة البيانات والبدء من جديد!");
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition-all text-xs cursor-pointer shadow-md shadow-rose-200"
              >
                نعم، امسح كل شيء
              </button>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs cursor-pointer"
              >
                إلغاء التراجع
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
