import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  X,
  Package,
  Droplets,
  Sparkles,
  BarChart3,
  Truck,
  FileText,
  Sliders,
  History,
  Receipt,
  Calendar,
  User,
  Info,
  ArrowDownLeft,
  ArrowUpRight,
  Barcode
} from "lucide-react";

export default function InventoryTab({ 
  products, 
  purchases = [],
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onAddPurchase,
  onStockAdjustment,
  onLoadSampleData,
  currentUser
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [stockFilter, setStockFilter] = useState("الكل"); // "الكل" | "متوفر" | "منخفض" | "نفد"

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseHistoryOpen, setPurchaseHistoryOpen] = useState(false);
  const [stockAdjustModalOpen, setStockAdjustModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states: New / Edit Product
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "قطعة", // "قطعة" | "لتر" | "كجم"
    barcode: "",
    costPrice: "",
    sellingPrice: "",
    stock: "",
    reorderThreshold: ""
  });

  // Form state: Purchase Invoice (فاتورة توريد / مشتريات)
  const [purchaseForm, setPurchaseForm] = useState({
    productId: "",
    barcodeSearch: "",
    incomingQty: "",
    unitCost: "",
    supplier: "",
    totalPaid: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  // Form state: Stock Adjustment (تسوية جرد / تالف)
  const [adjustForm, setAdjustForm] = useState({
    productId: "",
    type: "تالف / هالك (-)", // "تالف / هالك (-)" | "عجز جرد (-)" | "زيادة جرد (+)" | "مطابقة جرد فعلي"
    quantity: "",
    reasonNote: ""
  });

  const categories = ["الكل", ...new Set(products.map(p => p.category).filter(Boolean))];

  // Open Add Product Modal
  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      category: products[0]?.category || "منظفات عامة",
      unit: "قطعة",
      barcode: "",
      costPrice: "",
      sellingPrice: "",
      stock: "0",
      reorderThreshold: "5"
    });
    setAddModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      unit: product.unit,
      barcode: product.barcode,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stock: product.stock,
      reorderThreshold: product.reorderThreshold
    });
    setEditModalOpen(true);
  };

  // Open Purchase Invoice Modal
  const handleOpenPurchaseModal = (preselectedProduct = null) => {
    const defaultProduct = preselectedProduct || products[0] || null;
    setPurchaseForm({
      productId: defaultProduct ? defaultProduct.id : "",
      barcodeSearch: defaultProduct ? defaultProduct.barcode : "",
      incomingQty: "",
      unitCost: defaultProduct ? defaultProduct.costPrice.toString() : "",
      supplier: "",
      totalPaid: "",
      date: new Date().toISOString().split('T')[0],
      notes: ""
    });
    setPurchaseModalOpen(true);
  };

  // Open Stock Adjustment Modal
  const handleOpenStockAdjustModal = (product = null) => {
    const target = product || products[0] || null;
    setSelectedProduct(target);
    setAdjustForm({
      productId: target ? target.id : "",
      type: "تالف / هالك (-)",
      quantity: "",
      reasonNote: ""
    });
    setStockAdjustModalOpen(true);
  };

  // Handle Product Select change in Purchase Modal
  const handlePurchaseProductSelect = (prodId) => {
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      const incomingQtyNum = parseFloat(purchaseForm.incomingQty) || 0;
      const unitCostNum = prod.costPrice || 0;
      const calcTotal = incomingQtyNum > 0 ? (incomingQtyNum * unitCostNum).toFixed(2) : "";

      setPurchaseForm(prev => ({
        ...prev,
        productId: prod.id,
        barcodeSearch: prod.barcode,
        unitCost: unitCostNum.toString(),
        totalPaid: calcTotal
      }));
    }
  };

  // Handle Barcode Search / Scan in Purchase Modal
  const handlePurchaseBarcodeSearch = (code) => {
    setPurchaseForm(prev => ({ ...prev, barcodeSearch: code }));
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;

    const matchedProd = products.find(p => p.barcode.toLowerCase() === trimmed);
    if (matchedProd) {
      handlePurchaseProductSelect(matchedProd.id);
    }
  };

  // Handle Incoming Qty or Unit Cost change in Purchase Modal (auto-recalculates totalPaid)
  const handlePurchaseQtyOrCostChange = (field, value) => {
    setPurchaseForm(prev => {
      const updated = { ...prev, [field]: value };
      const qty = parseFloat(field === "incomingQty" ? value : prev.incomingQty) || 0;
      const cost = parseFloat(field === "unitCost" ? value : prev.unitCost) || 0;
      if (qty > 0 && cost >= 0) {
        updated.totalPaid = (qty * cost).toFixed(2);
      }
      return updated;
    });
  };

  // Form Submit: Add or Edit Product Details
  const handleFormSubmit = (e, action) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return alert("يرجى إدخال اسم المنتج!");
    if (!formData.category.trim()) return alert("يرجى إدخال تصنيف المنتج!");
    if (parseFloat(formData.costPrice) < 0 || parseFloat(formData.sellingPrice) < 0) {
      return alert("لا يمكن أن تكون الأسعار بالسالب!");
    }

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      unit: formData.unit,
      barcode: formData.barcode.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      costPrice: parseFloat(formData.costPrice) || 0,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      reorderThreshold: parseFloat(formData.reorderThreshold) || 0
    };

    // Duplicate Barcode Warning
    const barcodeDuplicate = products.some(
      p => p.barcode.toLowerCase() === payload.barcode.toLowerCase() && (!selectedProduct || p.id !== selectedProduct.id)
    );
    if (barcodeDuplicate) {
      const confirmUse = window.confirm(`تنبيه: الباركود "${payload.barcode}" مسجل مسبقاً لمنتج آخر! هل تريد المتابعة على أية حال؟`);
      if (!confirmUse) return;
    }

    const userLabel = currentUser?.fullName || currentUser?.name || "المدير المسؤول";

    if (action === "add") {
      onAddProduct({
        ...payload,
        stock: parseFloat(formData.stock) || 0,
        id: "prod-" + Date.now(),
        createdBy: userLabel,
        lastModifiedBy: userLabel,
        lastModifiedAt: new Date().toISOString()
      });
      setAddModalOpen(false);
    } else if (action === "edit" && selectedProduct) {
      onUpdateProduct(selectedProduct.id, {
        ...payload,
        lastModifiedBy: userLabel,
        lastModifiedAt: new Date().toISOString()
      });
      setEditModalOpen(false);
    }
  };

  // Form Submit: Purchase Invoice (تسجيل فاتورة توريد / مشتريات)
  const handlePurchaseSubmit = (e) => {
    e.preventDefault();
    
    const prod = products.find(p => p.id === purchaseForm.productId);
    if (!prod) return alert("يرجى اختيار منتج مسجل بالمخزن!");

    const incomingQty = parseFloat(purchaseForm.incomingQty);
    if (!incomingQty || incomingQty <= 0) return alert("يرجى إدخال كمية واردة صحيحة أكبر من الصفر!");

    const unitCost = parseFloat(purchaseForm.unitCost);
    if (unitCost === undefined || unitCost < 0) return alert("يرجى إدخال سعر شراء صحيح!");

    const totalPaid = parseFloat(purchaseForm.totalPaid) || (incomingQty * unitCost);

    onAddPurchase({
      productId: prod.id,
      productName: prod.name,
      barcode: prod.barcode,
      unit: prod.unit,
      incomingQty,
      unitCost,
      supplier: purchaseForm.supplier.trim(),
      totalPaid,
      date: purchaseForm.date,
      notes: purchaseForm.notes.trim()
    });

    alert(`تم حفظ فاتورة التوريد بنجاح!\nتمت إضافة ${incomingQty} ${prod.unit} إلى مخزون (${prod.name}) وتسجيل المصروف بالمالية.`);
    setPurchaseModalOpen(false);
  };

  // Form Submit: Stock Adjustment (تسوية جرد / تالف)
  const handleAdjustSubmit = (e) => {
    e.preventDefault();

    const prod = products.find(p => p.id === adjustForm.productId);
    if (!prod) return alert("يرجى اختيار منتج!");

    const qty = parseFloat(adjustForm.quantity);
    if (isNaN(qty) || qty < 0) return alert("يرجى إدخال كمية صحيحة!");

    let newStock = prod.stock;

    if (adjustForm.type === "تالف / هالك (-)" || adjustForm.type === "عجز جرد (-)") {
      newStock = Math.max(0, prod.stock - qty);
    } else if (adjustForm.type === "زيادة جرد (+)") {
      newStock = prod.stock + qty;
    } else if (adjustForm.type === "مطابقة جرد فعلي") {
      newStock = qty;
    }

    onStockAdjustment({
      productId: prod.id,
      newStock,
      type: adjustForm.type,
      reasonNote: adjustForm.reasonNote.trim()
    });

    alert(`تمت تسوية الجرد بنجاح!\nالرصيد الجديد لمنتج (${prod.name}): ${newStock} ${prod.unit}`);
    setStockAdjustModalOpen(false);
  };

  // Delete Product
  const handleDeleteClick = (product) => {
    const confirmDelete = window.confirm(`هل أنت متأكد من حذف المنتج: "${product.name}"؟ سيتم حذفه نهائياً من قاعدة البيانات.`);
    if (confirmDelete) {
      onDeleteProduct(product.id);
    }
  };

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "الكل" || p.category === categoryFilter;

    let matchesStock = true;
    if (stockFilter === "متوفر") matchesStock = p.stock > p.reorderThreshold;
    if (stockFilter === "منخفض") matchesStock = p.stock > 0 && p.stock <= p.reorderThreshold;
    if (stockFilter === "نفد") matchesStock = p.stock <= 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Metrics
  const totalStockItems = products.reduce((sum, p) => sum + p.stock, 0);
  const totalStockValuation = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.reorderThreshold).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;
  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + (p.totalPaid || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* INVENTORY HEADER SUMMARY KPIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block mb-1">إجمالي الأصناف بالمخزن</span>
            <span className="text-xl font-black text-slate-800 font-mono">{products.length}</span>
            <span className="text-[10px] text-slate-400 mr-1">صنف مسجل</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Package size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block mb-1">قيمة المخزون (سعر الشراء)</span>
            <span className="text-xl font-black text-teal-700 font-mono">{totalStockValuation.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 mr-1">ج.م</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block mb-1">إجمالي التوريدات والمشتريات</span>
            <span className="text-xl font-black text-indigo-600 font-mono">{totalPurchasesAmount.toFixed(2)}</span>
            <span className="text-[10px] text-indigo-500 mr-1">ج.م ({purchases.length} فاتورة)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Truck size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block mb-1">نواقص وتنبيهات المخزون</span>
            <span className="text-xl font-black text-amber-600 font-mono">{lowStockCount + outOfStockCount}</span>
            <span className="text-[10px] text-amber-500 mr-1">({outOfStockCount} نفد / {lowStockCount} منخفض)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>

      </div>

      {/* Critical Stock Alert Banner */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <span>
              تنبيه المخزون: يوجد لديك {outOfStockCount} منتج نفد تماماً و {lowStockCount} منتج أوشك على النفاد. استخدم زر "إضافة فاتورة مشتريات" لتوريد البضاعة تلقائياً.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenPurchaseModal()}
              className="px-3 py-1 bg-teal-600 text-white rounded-lg text-[11px] font-black shrink-0 hover:bg-teal-700 transition-colors shadow-sm"
            >
              + توريد بضاعة الآن
            </button>
            <button
              type="button"
              onClick={() => setStockFilter("منخفض")}
              className="px-3 py-1 bg-amber-200/80 hover:bg-amber-300 rounded-lg text-amber-900 text-[11px] font-black shrink-0 transition-colors"
            >
              عرض النواقص
            </button>
          </div>
        </div>
      )}

      {/* SEARCH, FILTER & PRIMARY ACTIONS BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full xl:w-72">
          <Search className="absolute right-3.5 top-3 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="ابحث بالاسم أو الباركود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-bold"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-2 text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="الكل">كل حالات المخزون</option>
            <option value="متوفر">المتوفر فقط</option>
            <option value="منخفض">المخزون المنخفض</option>
            <option value="نفد">النافد من المخزن</option>
          </select>

        </div>

        {/* Action Buttons: Purchases & Products */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          
          {/* 1. Add Purchase Invoice Button (تسجيل فاتورة توريد / مشتريات) */}
          <button
            type="button"
            onClick={() => handleOpenPurchaseModal()}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-100 cursor-pointer"
          >
            <Truck size={16} />
            إضافة فاتورة مشتريات / توريد بضاعة
          </button>

          {/* 2. Purchase History Button */}
          <button
            type="button"
            onClick={() => setPurchaseHistoryOpen(true)}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="عرض سجل فواتير المشتريات والتوريد السابقة"
          >
            <History size={15} />
            <span>سجل المشتريات ({purchases.length})</span>
          </button>

          {/* 3. Add Product Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            منتج جديد
          </button>

        </div>

      </div>

      {/* PRODUCTS TABLE OR EMPTY STATE */}
      {products.length === 0 ? (
        /* Clean Onboarding Empty State */
        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto my-6">
          <div className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shadow-md shadow-teal-50">
            <Package size={40} className="text-teal-600" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800">
              لا توجد منتجات بالمخزن، ابدأ بإضافة أصناف جديدة
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              قم بإضافة منتجات المنظفات أو مساحيق الغسيل والسوائل الصب لتتمكن من إضافة فواتير المشتريات والبيع للعملاء.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2 w-full max-w-sm">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-100 cursor-pointer"
            >
              <Plus size={16} />
              + إضافة منتج جديد
            </button>
            
            {onLoadSampleData && (
              <button
                type="button"
                onClick={onLoadSampleData}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles size={15} className="text-teal-600" />
                تحميل بيانات تجريبية
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Inventory Table */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-black">
                <tr>
                  <th className="py-3.5 px-4">المنتج والوحدة</th>
                  <th className="py-3.5 px-3">القسم</th>
                  <th className="py-3.5 px-3">الباركود / SKU</th>
                  <th className="py-3.5 px-3">سعر الشراء (التكلفة)</th>
                  <th className="py-3.5 px-3">سعر البيع</th>
                  <th className="py-3.5 px-3">المخزون الحالي</th>
                  <th className="py-3.5 px-3">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات والعمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= p.reorderThreshold;
                  const isBulk = p.unit === "لتر" || p.unit === "كجم";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Name & Unit */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg ${isBulk ? "bg-cyan-50 text-cyan-700" : "bg-teal-50 text-teal-700"}`}>
                            {isBulk ? <Droplets size={14} /> : <Package size={14} />}
                          </span>
                          <div>
                            <span className="font-extrabold text-slate-900 block leading-tight">{p.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-bold">وحدة البيع: {p.unit}</span>
                              {p.lastModifiedBy && (
                                <span className="text-[9px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-medium" title={p.lastModifiedAt ? `تاريخ آخر تعديل: ${new Date(p.lastModifiedAt).toLocaleString('ar-EG')}` : ""}>
                                  آخر نشاط: {p.lastModifiedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          {p.category}
                        </span>
                      </td>

                      {/* Barcode */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                          {p.barcode}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-600">
                        {p.costPrice.toFixed(2)} ج.م
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3 font-mono font-black text-teal-700">
                        {p.sellingPrice.toFixed(2)} ج.م
                      </td>

                      {/* Stock Quantity Display */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-black text-xs px-2 py-1 rounded-lg ${
                            isOutOfStock 
                              ? "bg-rose-100 text-rose-800" 
                              : isLowStock 
                                ? "bg-amber-100 text-amber-800" 
                                : "bg-slate-100 text-slate-800"
                          }`}>
                            {p.stock} {p.unit}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-black ${
                          isOutOfStock 
                            ? "bg-rose-50 text-rose-700 border border-rose-200" 
                            : isLowStock 
                              ? "bg-amber-50 text-amber-700 border border-amber-200" 
                              : "bg-teal-50 text-teal-700 border border-teal-200"
                        }`}>
                          {isOutOfStock ? (
                            <>
                              <XCircle size={12} />
                              نفد من المخزن
                            </>
                          ) : isLowStock ? (
                            <>
                              <AlertTriangle size={12} />
                              مخزون منخفض
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={12} />
                              متوفر
                            </>
                          )}
                        </span>
                      </td>

                      {/* Action Buttons: Purchase In, Adjust Stock, Edit, Delete */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Purchase Stock In Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPurchaseModal(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black transition-colors cursor-pointer"
                            title="إضافة فاتورة مشتريات / توريد بضاعة للمنتج"
                          >
                            <Truck size={13} />
                            <span>توريد بضاعة</span>
                          </button>

                          {/* Stock Adjustment / Damage Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenStockAdjustModal(p)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                            title="تسوية جرد أو تسجيل هالك/تالف بمحظور سبب"
                          >
                            <Sliders size={13} />
                            <span>تسوية / تالف</span>
                          </button>

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="تعديل بيانات المنتج"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(p)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف المنتج"
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

          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs font-bold">
              لا توجد منتجات مطابقة لخيارات البحث والفلترة.
            </div>
          )}
        </div>
      )}

      {/* 1. PURCHASE INVOICE MODAL (تسجيل فاتورة توريد / مشتريات) */}
      {purchaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 text-right max-h-[92vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <button 
                type="button"
                onClick={() => setPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Truck size={18} />
                </div>
                <h3 className="text-base font-black text-slate-800">تسجيل فاتورة توريد / مشتريات بضاعة</h3>
              </div>
              <div className="w-5"></div>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs">
              
              {/* Product Selection or Barcode Scan */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  اختر المنتج أو امسح الباركود:
                </label>
                
                {/* Barcode Quick Match Input */}
                <div className="relative mb-2">
                  <Barcode className="absolute right-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="مسح الباركود بالماسح الضوئي..."
                    value={purchaseForm.barcodeSearch}
                    onChange={(e) => handlePurchaseBarcodeSearch(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Dropdown Product Selector */}
                <select
                  value={purchaseForm.productId}
                  onChange={(e) => handlePurchaseProductSelect(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">-- اختر المنتج من المخزن --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (المخزون الحالى: {p.stock} {p.unit}) - [{p.barcode}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Unit Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    الكمية الواردة (بالعدد / اللترات):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="مثال: 50"
                    value={purchaseForm.incomingQty}
                    onChange={(e) => handlePurchaseQtyOrCostChange("incomingQty", e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    سعر الشراء للوحدة (التكلفة ج.م):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.00"
                    value={purchaseForm.unitCost}
                    onChange={(e) => handlePurchaseQtyOrCostChange("unitCost", e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Supplier & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    اسم المورد (اختياري):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: شركة النصر للمنظفات..."
                    value={purchaseForm.supplier}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    تاريخ الفاتورة:
                  </label>
                  <input
                    type="date"
                    value={purchaseForm.date}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Total Paid Amount (Cost of Inventory Expense) */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-900 text-xs">الإجمالي المدفوع (المصروف بالمالية):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={purchaseForm.totalPaid}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, totalPaid: e.target.value })}
                      className="w-32 px-3 py-1 bg-white border border-emerald-300 rounded-xl font-mono font-black text-emerald-800 text-left text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <span className="text-xs font-bold text-emerald-800">ج.م</span>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-700">
                  * يتم زيادات المخزون المتاح تلقائياً وتسجيل المبلغ كـ (تكلفة شراء بضاعة) بدفتر المالية والمصروفات.
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات الفاتورة (اختياري):</label>
                <input
                  type="text"
                  placeholder="رقم الفاتورة الورقية، أو شروط التوريد..."
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl transition-all shadow-md shadow-teal-100 cursor-pointer"
                >
                  حفظ وتسجيل فاتورة المشتريات
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 2. STOCK ADJUSTMENT MODAL (تسوية جرد / تالف) */}
      {stockAdjustModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-right">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <button 
                type="button"
                onClick={() => setStockAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Sliders size={18} />
                </div>
                <h3 className="text-base font-black text-slate-800">تسوية جرد أو تسجيل تالف/هالك</h3>
              </div>
              <div className="w-5"></div>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              
              {/* Product */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">اختر المنتج:</label>
                <select
                  value={adjustForm.productId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (الرصيد الحالى: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment Type */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع التسوية / الإجراء:</label>
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="تالف / هالك (-)">تالف / عبوة مكسورة (خصم من المخزون -)</option>
                  <option value="عجز جرد (-)">عجز جرد دوري (خصم من المخزون -)</option>
                  <option value="زيادة جرد (+)">زيادة جرد (إضافة للمخزون +)</option>
                  <option value="مطابقة جرد فعلي">ضبط وتعيين رصيد الجرد الفعلي مباشرة</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {adjustForm.type === "مطابقة جرد فعلي" ? "الرصيد الفعلي الجديد:" : "الكمية المراد تسويتها:"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {/* Reason Note */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">سبب التسوية / ملاحظة التالف (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: عبوة تسريب، تلف أثناء النقل، عجز جرد شهري..."
                  value={adjustForm.reasonNote}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reasonNote: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition-all shadow-md shadow-amber-100 cursor-pointer"
                >
                  حفظ تسوية الجرد
                </button>
                <button
                  type="button"
                  onClick={() => setStockAdjustModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 3. PURCHASE INVOICE HISTORY VIEWER MODAL */}
      {purchaseHistoryOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-100 text-right max-h-[92vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <button 
                type="button"
                onClick={() => setPurchaseHistoryOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <History size={18} />
                </div>
                <h3 className="text-base font-black text-slate-800">سجل فواتير التوريد والمشتريات</h3>
              </div>
              <div className="w-5"></div>
            </div>

            {purchases.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-bold space-y-2">
                <Truck size={36} className="mx-auto text-slate-300 mb-2" />
                <p>لا توجد فواتير توريد مسجلة حتى الآن.</p>
                <p className="text-[11px] text-slate-400 font-normal">
                  استخدم زر "إضافة فاتورة مشتريات" لتسجيل شحنات البضائع الواردة.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-black">
                    <tr>
                      <th className="py-3 px-3">التاريخ</th>
                      <th className="py-3 px-3">المنتج الوارد</th>
                      <th className="py-3 px-3">الكمية الواردة</th>
                      <th className="py-3 px-3">سعر شراء الوحدة</th>
                      <th className="py-3 px-3">المورد</th>
                      <th className="py-3 px-3">الإجمالي المدفوع</th>
                      <th className="py-3 px-3">المسؤول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-600">{p.date}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{p.productName}</td>
                        <td className="py-3 px-3 font-mono font-black text-emerald-700">
                          +{p.incomingQty} {p.unit}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{p.unitCost.toFixed(2)} ج.م</td>
                        <td className="py-3 px-3 font-bold text-slate-600">{p.supplier || "-"}</td>
                        <td className="py-3 px-3 font-mono font-black text-slate-900">{p.totalPaid.toFixed(2)} ج.م</td>
                        <td className="py-3 px-3 text-[11px] font-bold text-slate-500">{p.createdBy || "المدير"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 text-left">
              <button
                type="button"
                onClick={() => setPurchaseHistoryOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. ADD PRODUCT MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 text-right max-h-[92vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <button 
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              <h3 className="text-base font-black text-slate-800">إضافة منتج منظفات جديد</h3>
              <div className="w-5"></div>
            </div>

            <form onSubmit={(e) => handleFormSubmit(e, "add")} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم المنتج أو المنظف:</label>
                <input
                  type="text"
                  placeholder="مثال: كلور صب خام، مسحوق غسيل، صابون سائل..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">القسم / التصنيف:</label>
                  <input
                    type="text"
                    placeholder="مثال: منظفات سائلة، مساحيق..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">وحدة البيع:</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="قطعة">قطعة / عبوة جاهزة</option>
                    <option value="لتر">لتر (سوائل صب)</option>
                    <option value="كجم">كجم (وزن صب)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">الباركود / كود SKU (اتركه فارغاً للتوليد الآلي):</label>
                <input
                  type="text"
                  placeholder="امسح بالماسح أو اكتب الكود..."
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">سعر الشراء (التكلفة ج.م):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.00"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">سعر البيع للعميل (ج.م):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.00"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">رصيد المخزون الأولي:</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">حد الأمان (تنبيه نقص المخزون):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="5"
                    value={formData.reorderThreshold}
                    onChange={(e) => setFormData({ ...formData, reorderThreshold: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl transition-all shadow-md shadow-teal-100 cursor-pointer"
                >
                  حفظ وإضافة المنتج
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 5. EDIT PRODUCT MODAL (Restricted Direct Stock Editing) */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 text-right max-h-[92vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <button 
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              <h3 className="text-base font-black text-slate-800">تعديل بيانات المنتج</h3>
              <div className="w-5"></div>
            </div>

            <form onSubmit={(e) => handleFormSubmit(e, "edit")} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم المنتج أو المنظف:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">القسم / التصنيف:</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">وحدة البيع:</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="قطعة">قطعة / عبوة جاهزة</option>
                    <option value="لتر">لتر (سوائل صب)</option>
                    <option value="كجم">كجم (وزن صب)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">الباركود / كود SKU:</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">سعر الشراء (التكلفة ج.م):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">سعر البيع للعميل (ج.م):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Restricted Direct Stock Editing Info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <Info size={16} className="text-teal-600" />
                    <span>المخزون الحالى بالمخزن:</span>
                  </div>
                  <span className="font-mono font-black text-slate-900 bg-white px-3 py-1 rounded-xl border border-slate-200">
                    {formData.stock} {formData.unit}
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-500 leading-normal">
                  تنبيه: التعديل المباشر للرصيد مقتصر على تسوية الجرد والهالك فقط. لزيادة المخزون القياسي استخدم فاتورة المشتريات.
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      handleOpenPurchaseModal(selectedProduct);
                    }}
                    className="flex-1 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl font-black text-[11px] transition-colors"
                  >
                    + فاتورة توريد / مشتريات
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      handleOpenStockAdjustModal(selectedProduct);
                    }}
                    className="flex-1 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-black text-[11px] transition-colors"
                  >
                    ⚙️ تسوية جرد / تالف
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">حد الأمان (تنبيه نقص المخزون):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.reorderThreshold}
                  onChange={(e) => setFormData({ ...formData, reorderThreshold: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl transition-all shadow-md shadow-teal-100 cursor-pointer"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
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
