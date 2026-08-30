import React, { useState } from "react";
import { 
  Users, 
  Plus, 
  Trash2, 
  Coins, 
  TrendingUp, 
  ArrowDownCircle, 
  Info, 
  Calendar, 
  X, 
  UserPlus, 
  Edit2, 
  Wallet,
  CheckCircle2,
  PieChart
} from "lucide-react";

export default function PartnersTab({ 
  partners, 
  setPartners,
  withdrawals, 
  onAddWithdrawal, 
  onDeleteWithdrawal, 
  sales, 
  expenses 
}) {
  // Modal states
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  // Partner Form State
  const [partnerForm, setPartnerForm] = useState({
    name: "",
    capitalShare: "",
    profitPercentage: ""
  });

  // Withdrawal Form State
  const [withdrawalForm, setWithdrawalForm] = useState({
    partnerId: partners[0]?.id || "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: ""
  });

  // Calculate Net Profit
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalCogs = sales.reduce((sum, sale) => sum + (sale.cogs || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = Math.max(0, totalRevenue - totalCogs - totalExpenses);

  // Total Capital Contributed
  const totalContributedCapital = partners.reduce((sum, p) => sum + (p.capitalShare || 0), 0);
  const totalProfitPercentage = partners.reduce((sum, p) => sum + (p.profitPercentage || 0), 0);

  // Calculate Partner Summaries
  const partnerSummaries = partners.map(partner => {
    // Distributed profit share based on percentage
    const profitShareAllocated = (netProfit * (partner.profitPercentage || 0)) / 100;
    
    // Total withdrawals by this partner
    const partnerWithdrawals = withdrawals
      .filter(w => w.partnerId === partner.id)
      .reduce((sum, w) => sum + w.amount, 0);

    // Unpaid Balance
    const unpaidProfitBalance = profitShareAllocated - partnerWithdrawals;

    return {
      ...partner,
      profitShareAllocated,
      partnerWithdrawals,
      unpaidProfitBalance
    };
  });

  // Handle Partner Form Submit (Add or Edit)
  const handlePartnerSubmit = (e) => {
    e.preventDefault();
    if (!partnerForm.name.trim()) return alert("يرجى إدخال اسم الشريك!");
    
    const profitPct = parseFloat(partnerForm.profitPercentage) || 0;
    const capitalAmt = parseFloat(partnerForm.capitalShare) || 0;

    if (profitPct < 0 || profitPct > 100) {
      return alert("نسبة الأرباح يجب أن تكون بين 0% و 100%!");
    }

    if (editingPartner) {
      setPartners(prev => prev.map(p => p.id === editingPartner.id ? {
        ...p,
        name: partnerForm.name.trim(),
        capitalShare: capitalAmt,
        profitPercentage: profitPct
      } : p));
      setEditingPartner(null);
    } else {
      const newPartner = {
        id: "part-" + Date.now(),
        name: partnerForm.name.trim(),
        capitalShare: capitalAmt,
        profitPercentage: profitPct
      };
      setPartners(prev => [...prev, newPartner]);
    }

    setPartnerModalOpen(false);
    setPartnerForm({ name: "", capitalShare: "", profitPercentage: "" });
  };

  const handleOpenEditPartner = (partner) => {
    setEditingPartner(partner);
    setPartnerForm({
      name: partner.name,
      capitalShare: partner.capitalShare.toString(),
      profitPercentage: partner.profitPercentage.toString()
    });
    setPartnerModalOpen(true);
  };

  const handleDeletePartner = (partnerId, partnerName) => {
    if (partners.length <= 1) {
      return alert("يجب أن يبقى شريك واحد على الأقل في المتجر!");
    }
    const confirmDelete = window.confirm(`هل أنت متأكد من حذف الشريك: "${partnerName}"؟ سيتم حذف بياناته وسجل مسحوباته.`);
    if (confirmDelete) {
      setPartners(prev => prev.filter(p => p.id !== partnerId));
    }
  };

  // Handle Withdrawal Submit
  const handleWithdrawalSubmit = (e) => {
    e.preventDefault();
    const selectedPartnerSummary = partnerSummaries.find(p => p.id === withdrawalForm.partnerId);
    if (!selectedPartnerSummary) return alert("يرجى اختيار شريك صالح!");

    const amountNum = parseFloat(withdrawalForm.amount);
    if (!amountNum || amountNum <= 0) {
      return alert("يرجى إدخال مبلغ سحب صحيح وموجب!");
    }

    // Check if withdrawal exceeds remaining balance
    if (amountNum > selectedPartnerSummary.unpaidProfitBalance) {
      const confirmExceed = window.confirm(
        `تنبيه: مبلغ السحب المكتوب (${amountNum.toFixed(2)} ج.م) يتجاوز رصيد الأرباح المستحقة المتبقية للشريك (${selectedPartnerSummary.unpaidProfitBalance.toFixed(2)} ج.م).\n\nهل تريد اعتماد السحب على أي حال؟`
      );
      if (!confirmExceed) return;
    }

    const newWithdrawal = {
      id: "w-" + Date.now(),
      partnerId: withdrawalForm.partnerId,
      partnerName: selectedPartnerSummary.name,
      amount: amountNum,
      date: withdrawalForm.date,
      description: withdrawalForm.description.trim() || "سحب أرباح"
    };

    onAddWithdrawal(newWithdrawal);
    setWithdrawalModalOpen(false);

    setWithdrawalForm({
      partnerId: partners[0]?.id || "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      description: ""
    });
  };

  return (
    <div className="space-y-6">
      
      {/* PARTNERS KPI OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block mb-1">صافي الأرباح القابلة للتوزيع</span>
            <span className="text-xl font-black text-emerald-700 font-mono">{netProfit.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 mr-1">ج.م</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Coins size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block mb-1">إجمالي رأس مال الشركاء</span>
            <span className="text-xl font-black text-slate-800 font-mono">{totalContributedCapital.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 mr-1">ج.م</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Wallet size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block mb-1">مجموع نسب الشراكة</span>
            <span className={`text-xl font-black font-mono ${totalProfitPercentage === 100 ? "text-teal-700" : "text-amber-600"}`}>
              %{totalProfitPercentage}
            </span>
            <span className="text-[10px] text-slate-400 mr-1">
              {totalProfitPercentage === 100 ? "(توزيع مكتمل 100%)" : "(متبقي نسبة)"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <PieChart size={20} />
          </div>
        </div>

      </div>

      {/* ACTION BAR: Add Partner & Record Withdrawal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-black text-slate-800 text-base">جدول حسابات الشركاء وتوزيع الأرباح</h2>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingPartner(null);
              setPartnerForm({ name: "", capitalShare: "", profitPercentage: "" });
              setPartnerModalOpen(true);
            }}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus size={15} />
            إضافة شريك جديد
          </button>

          <button
            type="button"
            onClick={() => setWithdrawalModalOpen(true)}
            className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-teal-100 cursor-pointer"
          >
            <ArrowDownCircle size={15} />
            تسجيل سحب أرباح
          </button>
        </div>
      </div>

      {/* PARTNER CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partnerSummaries.map((p) => (
          <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 relative overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 font-black flex items-center justify-center text-sm shadow-sm">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">{p.name}</h3>
                  <span className="text-[11px] text-teal-600 font-black font-mono">
                    حصة الأرباح: %{p.profitPercentage}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEditPartner(p)}
                  className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  title="تعديل الشريك"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePartner(p.id, p.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  title="حذف الشريك"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-2 text-xs pt-1 border-t border-slate-50">
              <div className="flex justify-between text-slate-500">
                <span>المساهمة في رأس المال:</span>
                <span className="font-mono font-bold text-slate-800">{p.capitalShare.toFixed(2)} ج.م</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>حصة الشريك من صافي الأرباح:</span>
                <span className="font-mono font-bold text-emerald-600">+{p.profitShareAllocated.toFixed(2)} ج.م</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>إجمالي المسحوبات السابقة:</span>
                <span className="font-mono font-bold text-rose-600">-{p.partnerWithdrawals.toFixed(2)} ج.م</span>
              </div>
            </div>

            {/* Unpaid Balance Badge */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-600 text-xs">الرصيد المتبقي المستحق:</span>
              <span className={`font-mono font-black text-sm ${p.unpaidProfitBalance >= 0 ? "text-teal-700" : "text-rose-600"}`}>
                {p.unpaidProfitBalance.toFixed(2)} ج.م
              </span>
            </div>

          </div>
        ))}
      </div>

      {/* RECENT WITHDRAWALS LOG */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-800 text-sm">سجل مسحوبات الشركاء</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {withdrawals.length} عملية سحب
            </span>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[300px] divide-y divide-slate-100">
          {withdrawals.map((w) => (
            <div key={w.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <ArrowDownCircle size={16} />
                </div>
                <div>
                  <span className="font-black text-slate-800 block">{w.partnerName}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{w.description}</span>
                    <span className="font-mono">{w.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-rose-600">
                  -{w.amount.toFixed(2)} ج.م
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteWithdrawal(w.id)}
                  className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                  title="حذف عملية السحب"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {withdrawals.length === 0 && (
            <div className="py-10 text-center text-slate-400 text-xs font-bold">
              لم يتم تسجيل أي مسحوبات للشركاء بعد.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Add/Edit Partner */}
      {partnerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-right space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <button 
                type="button"
                onClick={() => setPartnerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              <h3 className="text-sm font-black text-slate-800">
                {editingPartner ? "تعديل بيانات الشريك" : "إضافة شريك جديد"}
              </h3>
              <div className="w-5"></div>
            </div>

            <form onSubmit={handlePartnerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم الشريك:</label>
                <input
                  type="text"
                  placeholder="مثال: الحاج أحمد، الأستاذ محمود..."
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">المساهمة في رأس المال (ج.م):</label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  placeholder="0.00"
                  value={partnerForm.capitalShare}
                  onChange={(e) => setPartnerForm({ ...partnerForm, capitalShare: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">نسبة الشراكة من الأرباح (%):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  placeholder="50"
                  value={partnerForm.profitPercentage}
                  onChange={(e) => setPartnerForm({ ...partnerForm, profitPercentage: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl transition-all shadow-md shadow-teal-100 cursor-pointer"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: Record Partner Withdrawal */}
      {withdrawalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-right space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <button 
                type="button"
                onClick={() => setWithdrawalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              <h3 className="text-sm font-black text-slate-800">تسجيل سحب أرباح لشريك</h3>
              <div className="w-5"></div>
            </div>

            <form onSubmit={handleWithdrawalSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اختر الشريك:</label>
                <select
                  value={withdrawalForm.partnerId}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, partnerId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {partnerSummaries.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (المستحق: {p.unpaidProfitBalance.toFixed(0)} ج.م)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">مبلغ السحب (ج.م):</label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  placeholder="0.00"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">تاريخ السحب:</label>
                <input
                  type="date"
                  value={withdrawalForm.date}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">البيان / الوصف:</label>
                <input
                  type="text"
                  placeholder="مثال: دفعة من أرباح شهر أغسطس..."
                  value={withdrawalForm.description}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl transition-all shadow-md shadow-teal-100 cursor-pointer"
                >
                  تأكيد تسجيل السحب
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawalModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
