import React, { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText,
  Plus,
  Trash2,
  Calendar,
  Wallet,
  Package,
  Layers,
  Coins,
  Receipt,
  PieChart
} from "lucide-react";

export default function FinancialsTab({ 
  sales, 
  expenses, 
  onAddExpense, 
  onDeleteExpense, 
  products, 
  initialCapital = 0, 
  totalWithdrawals = 0 
}) {
  // Expense Form State
  const [expenseData, setExpenseData] = useState({
    category: "إيجار", // "إيجار" | "كهرباء ومياه" | "رواتب ومصنعية" | "مستلزمات عامة" | "مصروفات أخرى"
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: ""
  });

  const [dateFilter, setDateFilter] = useState("الكل"); // "الكل" | "اليوم" | "الشهر الحالي"

  // 1. Total Revenue (إجمالي المبيعات)
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);

  // 2. Cost of Goods Sold / COGS (تكلفة البضاعة المباعة)
  const totalCogs = sales.reduce((sum, sale) => sum + (sale.cogs || 0), 0);

  // 3. Operating Expenses (إجمالي المصروفات التشغيلية)
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // 4. Net Profit = Total Revenue - COGS - Expenses (صافي الربح)
  const netProfit = totalRevenue - totalCogs - totalExpenses;

  // 5. Total Capital & Inventory Valuation (رأس المال الكلي في المخزن والخزينة)
  // Inventory Value (at cost price)
  const inventoryValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  
  // Treasury Cash = Initial Capital + Sales Total (cash in) - Expenses - Partner Withdrawals
  const treasuryCash = initialCapital + totalRevenue - totalExpenses - totalWithdrawals;
  const totalCapitalAndValuation = inventoryValue + treasuryCash;

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(expenseData.amount);
    if (!amt || amt <= 0) {
      return alert("يرجى إدخال قيمة صحيحة وموجبة للمصروف!");
    }
    if (!expenseData.description.trim()) {
      return alert("يرجى كتابة بيان أو وصف للمصروف!");
    }

    const newExpense = {
      id: "exp-" + Date.now(),
      category: expenseData.category,
      amount: amt,
      date: expenseData.date,
      description: expenseData.description.trim()
    };

    onAddExpense(newExpense);
    
    // Reset Form
    setExpenseData({
      category: "إيجار",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      description: ""
    });
  };

  const handleExpenseDelete = (id, desc, amount) => {
    const confirmDelete = window.confirm(`هل أنت متأكد من حذف مصروف: "${desc}" بقيمة ${amount.toFixed(2)} ج.م؟`);
    if (confirmDelete) {
      onDeleteExpense(id);
    }
  };

  // Group Expenses by Category
  const expenseCategories = ["مشتريات وتوريد بضاعة", "إيجار", "كهرباء ومياه", "رواتب ومصنعية", "مستلزمات عامة", "مصروفات أخرى"];
  const expensesByCategory = expenseCategories.reduce((acc, cat) => {
    acc[cat] = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {});

  // Date Filtering
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7);

  const filteredExpenses = expenses.filter(e => {
    if (dateFilter === "اليوم") return e.date === todayStr;
    if (dateFilter === "الشهر الحالي") return e.date.startsWith(currentMonthStr);
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 5 KEY FINANCIAL METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* 1. Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">إجمالي المبيعات</span>
            <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 font-mono">{totalRevenue.toFixed(2)}</span>
            <span className="text-[10px] font-normal text-slate-400 mr-1">ج.م</span>
          </div>
        </div>

        {/* 2. COGS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">تكلفة البضاعة (COGS)</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <Package size={16} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-800 font-mono">{totalCogs.toFixed(2)}</span>
            <span className="text-[10px] font-normal text-slate-400 mr-1">ج.م</span>
          </div>
        </div>

        {/* 3. Operating Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">إجمالي المصروفات</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown size={16} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-rose-600 font-mono">{totalExpenses.toFixed(2)}</span>
            <span className="text-[10px] font-normal text-slate-400 mr-1">ج.م</span>
          </div>
        </div>

        {/* 4. Net Profit */}
        <div className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between ${
          netProfit >= 0 ? "bg-emerald-50/70 border-emerald-200" : "bg-rose-50/70 border-rose-200"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700">صافي الربح الحقيقي</span>
            <span className={`p-2 rounded-xl ${netProfit >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
              <Coins size={16} />
            </span>
          </div>
          <div className="mt-3">
            <span className={`text-xl font-black font-mono ${netProfit >= 0 ? "text-emerald-800" : "text-rose-800"}`}>
              {netProfit.toFixed(2)}
            </span>
            <span className="text-[10px] font-normal text-slate-600 mr-1">ج.م</span>
          </div>
        </div>

        {/* 5. Total Capital & Valuation */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-900 to-teal-950 text-white p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-teal-300 font-bold">رأس المال والمخزون</span>
            <span className="p-2 rounded-xl bg-teal-800/60 text-teal-200">
              <Wallet size={16} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-white font-mono">{totalCapitalAndValuation.toFixed(2)}</span>
            <span className="text-[10px] font-normal text-teal-200 mr-1">ج.م</span>
            <span className="block text-[9px] text-teal-300/80 mt-0.5 font-medium">
              بضاعة: {inventoryValue.toFixed(0)} | خزينة: {treasuryCash.toFixed(0)}
            </span>
          </div>
        </div>

      </div>

      {/* EXPENSES MANAGEMENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN: Add Daily Expense Form */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm">تسجيل مصروف تشغيلي جديد</h3>
              <p className="text-[11px] text-slate-400">إيجار، فواتير كهرباء، رواتب، أو مستلزمات</p>
            </div>
          </div>

          <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">بند المصروف / التصنيف:</label>
              <select
                value={expenseData.category}
                onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="مشتريات وتوريد بضاعة">مشتريات وتوريد بضاعة (تكلفة المخزون)</option>
                <option value="إيجار">إيجار المحل أو المخزن</option>
                <option value="كهرباء ومياه">فواتير كهرباء ومياه وغاز</option>
                <option value="رواتب ومصنعية">رواتب عمال ومصنعيات وتعبئة</option>
                <option value="مستلزمات عامة">مستلزمات نظافة، أكياس، جراكن</option>
                <option value="مصروفات أخرى">مصروفات نثرية وأخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">قيمة المبلغ (ج.م):</label>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="0.00"
                value={expenseData.amount}
                onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">التاريخ:</label>
              <input
                type="date"
                value={expenseData.date}
                onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">البيان / الوصف التفصيلي:</label>
              <input
                type="text"
                placeholder="مثال: فاتورة كهرباء شهر يوليو، شراء جراكن فارغة..."
                value={expenseData.description}
                onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl transition-all shadow-md shadow-rose-100 flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <Plus size={16} />
              إضافة المصروف وتحديث الحسابات
            </button>
          </form>

          {/* Expense Breakdown Mini Widget */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] text-slate-500 font-bold block">توزيع المصروفات حسب البند:</span>
            <div className="space-y-1.5">
              {expenseCategories.map(cat => {
                const amount = expensesByCategory[cat] || 0;
                const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">{cat}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-rose-500 h-full rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-800">{amount.toFixed(0)} ج.م</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* LEFT COLUMN: Expenses History Table */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-800 text-sm">سجل المصروفات اليومية</span>
              <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                {filteredExpenses.length} عملية
              </span>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-[11px]">
              <button
                type="button"
                onClick={() => setDateFilter("الكل")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${dateFilter === "الكل" ? "bg-teal-600 text-white" : "text-slate-600"}`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setDateFilter("اليوم")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${dateFilter === "اليوم" ? "bg-teal-600 text-white" : "text-slate-600"}`}
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => setDateFilter("الشهر الحالي")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${dateFilter === "الشهر الحالي" ? "bg-teal-600 text-white" : "text-slate-600"}`}
              >
                هذا الشهر
              </button>
            </div>
          </div>

          {/* Expenses List */}
          <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-slate-100">
            {filteredExpenses.map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
                    <TrendingDown size={16} />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-800 text-xs block leading-tight">{exp.description}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{exp.category}</span>
                      <span className="font-mono">{exp.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-rose-600 text-xs">
                    -{exp.amount.toFixed(2)} ج.م
                  </span>
                  <button
                    type="button"
                    onClick={() => handleExpenseDelete(exp.id, exp.description, exp.amount)}
                    className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                    title="حذف المصروف"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            {filteredExpenses.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-xs font-bold">
                لا توجد مصروفات مسجلة في هذه الفترة.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
