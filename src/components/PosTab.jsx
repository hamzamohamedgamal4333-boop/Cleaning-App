import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Scan,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Printer,
  Coins,
  CreditCard,
  Wallet,
  X,
  Camera,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Droplets,
  Package,
  SlidersHorizontal,
  ArrowRight
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

// Play standard cash register beep on successful scan
const playBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.09);
  } catch (err) {
    console.warn("Beep audio notice:", err);
  }
};

export default function PosTab({ products, onCheckout, cart, setCart, storeInfo, currentUser }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  // Discount state (supports fixed amount or percentage)
  const [discountType, setDiscountType] = useState("fixed"); // "fixed" | "percent"
  const [discountInput, setDiscountInput] = useState(0);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState("نقدي"); // "نقدي" | "فيزا" | "محفظة إلكترونية"

  // Barcode Scanning State
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [lastScannedProduct, setLastScannedProduct] = useState(null);

  // Invoice / Receipt State
  const [printedInvoice, setPrintedInvoice] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Mobile Tab (Products vs Cart)
  const [mobileActiveView, setMobileActiveView] = useState("products"); // "products" | "cart"

  // Quick Notification Banner
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Filter Categories
  const categories = ["الكل", ...new Set(products.map(p => p.category))];

  // 1. Hardware Barcode Scanner Engine (Global Keyboard Listener)
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e) => {
      // Don't intercept if user is typing in standard text inputs, unless scanner speed is detected
      const isInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Scanners send keystrokes extremely rapidly (< 50ms per key)
      if (e.key === "Enter" || e.key === "Tab") {
        if (buffer.length >= 3) {
          const scannedCode = buffer.trim();
          buffer = "";
          handleBarcodeScanned(scannedCode);
          if (isInput) e.target.blur();
          e.preventDefault();
        }
        buffer = "";
      } else if (e.key.length === 1) {
        // If characters arrive with high frequency or user isn't in an input
        if (timeDiff > 200) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [products, cart]);

  // Handle Barcode Match
  const handleBarcodeScanned = (barcodeText) => {
    const cleanCode = barcodeText.trim().toLowerCase();
    const foundProduct = products.find(p => p.barcode.toLowerCase() === cleanCode);

    if (foundProduct) {
      if (foundProduct.stock <= 0) {
        showToast(`تنبيه: المنتج "${foundProduct.name}" نفد من المخزن!`);
        return;
      }
      playBeep();
      addToCart(foundProduct);
      setLastScannedProduct(foundProduct);
      showToast(`تم مسح وإضافة: "${foundProduct.name}" بنجاح!`);
    } else {
      showToast(`الباركود الممسوح (${barcodeText}) غير مسجل في المخازن!`);
    }
  };

  // Simulated scan triggers (manual input box)
  const handleSimulatedScan = (e) => {
    e.preventDefault();
    if (barcodeSearch.trim()) {
      handleBarcodeScanned(barcodeSearch.trim());
      setBarcodeSearch("");
    }
  };

  // Webcam Barcode Scanner via html5-qrcode
  useEffect(() => {
    let html5QrCode = null;
    const scannerId = "camera-scanner-view";

    if (showCameraScanner) {
      setScannerError("");
      const timer = setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode(scannerId);
          html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 15,
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                return {
                  width: Math.min(viewfinderWidth * 0.85, 320),
                  height: Math.min(viewfinderHeight * 0.55, 140)
                };
              }
            },
            (decodedText) => {
              handleBarcodeScanned(decodedText);
              // Stop camera and close scanner modal after successful scan
              html5QrCode.stop().then(() => {
                setShowCameraScanner(false);
              }).catch(err => console.error("Error stopping scanner:", err));
            },
            () => {
              // Frame decoding error ignored
            }
          ).catch(err => {
            console.error("Camera startup failed:", err);
            setScannerError("تعذر الوصول إلى الكاميرا. يرجى التأكد من صلاحيات الكاميرا.");
          });
        } catch (e) {
          console.error("Html5Qrcode initialization failed:", e);
          setScannerError("حدث خطأ أثناء تهيئة ماسح الكاميرا.");
        }
      }, 400);

      return () => {
        clearTimeout(timer);
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch(err => console.error("Scanner cleanup:", err));
        }
      };
    }
  }, [showCameraScanner, products]);

  // Cart operations
  const addToCart = (product, quantityToAdd = null) => {
    const isBulk = product.unit === "لتر" || product.unit === "كجم";
    const defaultStep = isBulk ? 1 : 1;
    const qty = quantityToAdd !== null ? quantityToAdd : defaultStep;

    const existing = cart.find(item => item.id === product.id);
    const maxQty = product.stock;

    if (existing) {
      const newQty = parseFloat((existing.quantity + qty).toFixed(2));
      if (newQty > maxQty) {
        showToast(`الكمية المتاحة في المخزن هي ${maxQty} فقط!`);
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: newQty } : item
      ));
    } else {
      if (qty > maxQty) {
        showToast(`الكمية المتاحة في المخزن هي ${maxQty} فقط!`);
        return;
      }
      setCart([...cart, {
        id: product.id,
        name: product.name,
        unit: product.unit,
        category: product.category,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        quantity: qty,
        stock: product.stock,
        barcode: product.barcode
      }]);
    }
  };

  const updateQuantity = (itemId, newQty) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    const cleanQty = parseFloat(parseFloat(newQty || 0).toFixed(2));

    if (cleanQty <= 0) {
      removeFromCart(itemId);
      return;
    }

    if (cleanQty > item.stock) {
      showToast(`الكمية المتاحة في المخزن هي ${item.stock} فقط!`);
      return;
    }

    setCart(cart.map(i => i.id === itemId ? { ...i, quantity: cleanQty } : i));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Quick bulk addition (+1L, +2L, +5L)
  const handleQuickAddBulk = (product, amount, e) => {
    e.stopPropagation();
    addToCart(product, amount);
    playBeep();
    showToast(`تمت إضافة +${amount} ${product.unit} من "${product.name}"`);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);

  // Calculate discount amount
  let calculatedDiscount = 0;
  if (discountType === "percent") {
    calculatedDiscount = (subtotal * Math.min(100, Math.max(0, discountInput))) / 100;
  } else {
    calculatedDiscount = Math.min(subtotal, Math.max(0, discountInput));
  }

  const taxRate = 0;
  const calculatedTax = 0;
  const total = Math.max(0, subtotal - calculatedDiscount);
  const totalCogs = cart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);

  // Submit Order / Checkout
  const handleCheckoutSubmit = () => {
    if (cart.length === 0) {
      showToast("السلة فارغة! يرجى إضافة منتجات أولاً.");
      return;
    }

    const saleRecord = {
      id: "INV-" + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      cashier: currentUser?.fullName || currentUser?.name || "كاشير المبيعات",
      cashierRole: currentUser?.role || "cashier",
      cashierUsername: currentUser?.username || "cashier",
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        total: item.sellingPrice * item.quantity
      })),
      subtotal,
      discount: calculatedDiscount,
      discountType,
      discountValue: discountInput,
      tax: calculatedTax,
      taxRate,
      total,
      paymentMethod,
      cogs: totalCogs
    };

    onCheckout(saleRecord);
    setPrintedInvoice(saleRecord);
    setInvoiceModalOpen(true);

    // Reset local POS state
    setCart([]);
    setDiscountInput(0);
    setPaymentMethod("نقدي");
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === "الكل" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-140px)]">

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles size={16} className="text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Top View Switcher */}
      <div className="lg:hidden col-span-1 grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setMobileActiveView("products")}
          className={`py-3 rounded-xl text-center font-black text-xs transition-all flex items-center justify-center gap-2 ${mobileActiveView === 'products' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600'
            }`}
        >
          <Layers size={16} />
          المنتجات ({filteredProducts.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveView("cart")}
          className={`py-3 rounded-xl text-center font-black text-xs transition-all flex items-center justify-center gap-2 relative ${mobileActiveView === 'cart' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600'
            }`}
        >
          <ShoppingCart size={16} />
          سلة البيع
          {cart.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold mr-1">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* RIGHT COLUMN: Products Grid & Search */}
      <div className={`lg:col-span-8 flex flex-col space-y-4 ${mobileActiveView === 'products' ? 'block' : 'hidden lg:block'}`}>

        {/* Search, Barcode Input & Scanner Controls */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 items-center">

          {/* Text/Barcode search */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute right-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ابحث باسم المنتج، المنظف أو الباركود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-bold"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-3.5 top-2.5 text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick manual barcode entry */}
          <form onSubmit={handleSimulatedScan} className="relative w-full md:w-56 flex gap-1.5">
            <input
              type="text"
              placeholder="أدخل باركود يدوياً..."
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-mono text-center"
            />
            <button
              type="submit"
              className="px-3.5 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer"
            >
              مسح
            </button>
          </form>

          {/* Camera Barcode Scanner Trigger */}
          <button
            type="button"
            onClick={() => setShowCameraScanner(!showCameraScanner)}
            className={`w-full md:w-auto px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all shadow-sm cursor-pointer ${showCameraScanner ? 'bg-rose-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
          >
            {showCameraScanner ? (
              <>
                <X size={16} />
                إغلاق الكاميرا
              </>
            ) : (
              <>
                <Camera size={16} />
                كاميرا الباركود
              </>
            )}
          </button>
        </div>

        {/* Hardware scanner indicator badge */}
        <div className="flex items-center justify-between px-2 text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-teal-700 bg-teal-50/70 border border-teal-100 px-2.5 py-1 rounded-lg">
            <Scan size={14} />
            قارئ الباركود (USB / Bluetooth) مفعّل تلقائياً دون الحاجة للنقر
          </span>
          <span className="text-slate-400 hidden sm:inline">
            عدد الأصناف: {filteredProducts.length}
          </span>
        </div>

        {/* Live Camera Scanner Box */}
        {showCameraScanner && (
          <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 text-white relative overflow-hidden flex flex-col items-center shadow-xl">
            <div className="w-full flex items-center justify-between mb-3 px-2">
              <span className="bg-emerald-500 text-black text-[11px] px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-black"></span>
                ماسح الكاميرا نشط
              </span>
              <button
                type="button"
                onClick={() => setShowCameraScanner(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="w-full max-w-md relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-slate-700">
              <div id="camera-scanner-view" className="w-full h-full"></div>
              <div className="laser-line"></div>
            </div>

            {scannerError && (
              <p className="text-rose-400 text-xs mt-3 text-center px-4 font-bold">{scannerError}</p>
            )}

            <p className="text-slate-400 text-[11px] mt-2 text-center">
              وجّه كاميرا الهاتف أو اللابتوب نحو باركود المنتج لتمت إضافته للسلة فوراً.
            </p>
          </div>
        )}

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer ${selectedCategory === cat
                ? "bg-teal-600 text-white shadow-md shadow-teal-100"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock > 0 && p.stock <= p.reorderThreshold;
            const isBulk = p.unit === "لتر" || p.unit === "كجم";

            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p)}
                className={`bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-teal-500 hover:shadow-md transition-all relative overflow-hidden group ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover-scale'
                  }`}
              >
                {/* Stock Status Badge */}
                <span className={`absolute top-2.5 left-2.5 text-[9px] px-2 py-0.5 rounded-full font-bold ${isOutOfStock
                  ? "bg-rose-100 text-rose-700"
                  : isLowStock
                    ? "bg-amber-100 text-amber-700"
                    : "bg-teal-100 text-teal-700"
                  }`}>
                  {isOutOfStock ? "نفد" : isLowStock ? `منخفض (${p.stock})` : `متوفر (${p.stock})`}
                </span>

                {/* Product Unit Icon & Name */}
                <div className="mt-4 mb-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mb-1">
                    {isBulk ? <Droplets size={12} className="text-cyan-500" /> : <Package size={12} className="text-teal-500" />}
                    <span>{p.category}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-xs line-clamp-2 leading-relaxed min-h-[36px]">
                    {p.name}
                  </h3>
                </div>

                {/* Bulk Quick Add Shortcuts for Liquids */}
                {isBulk && !isOutOfStock && (
                  <div className="grid grid-cols-3 gap-1 my-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleQuickAddBulk(p, 1, e)}
                      className="py-1 px-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-[10px] font-black transition-colors"
                      title="إضافة 1 لتر"
                    >
                      +1 {p.unit}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleQuickAddBulk(p, 2, e)}
                      className="py-1 px-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-[10px] font-black transition-colors"
                      title="إضافة 2 لتر"
                    >
                      +2 {p.unit}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleQuickAddBulk(p, 5, e)}
                      className="py-1 px-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-[10px] font-black transition-colors"
                      title="إضافة 5 لتر"
                    >
                      +5 {p.unit}
                    </button>
                  </div>
                )}

                {/* Price and Add Button */}
                <div className="mt-2 pt-2 border-t border-slate-50 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">سعر البيع</span>
                    <span className="font-black text-teal-700 text-sm">
                      {p.sellingPrice.toFixed(2)}
                      <span className="text-[10px] font-normal text-slate-400 mr-1">ج.م/{p.unit}</span>
                    </span>
                  </div>

                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${isOutOfStock ? 'bg-slate-100 text-slate-400' : 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white'
                    }`}>
                    <Plus size={16} />
                  </span>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-3xl text-center border border-slate-100 text-slate-400 text-xs space-y-2">
              <Package size={36} className="mx-auto text-slate-300" />
              <p className="font-bold">لا توجد منظفات مطابقة لمعايير البحث في هذا القسم.</p>
            </div>
          )}
        </div>

      </div>

      {/* LEFT COLUMN: Cart Panel */}
      <div className={`lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex flex-col min-h-[calc(100vh-160px)] lg:min-h-0 ${mobileActiveView === 'cart' ? 'block' : 'hidden lg:flex'
        }`}>

        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-teal-50 p-2 rounded-xl text-teal-600">
              <ShoppingCart size={18} />
            </div>
            <span className="font-black text-slate-800 text-sm">سلة البيع الحالية</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {cart.length} أصناف
            </span>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setCart([])}
              className="text-xs text-rose-500 hover:text-rose-700 font-bold transition-colors cursor-pointer"
            >
              تفريغ السلة
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[380px] lg:max-h-[none] pr-1">
          {cart.map((item) => {
            const isBulk = item.unit === "لتر" || item.unit === "كجم";

            return (
              <div key={item.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col space-y-2">

                <div className="flex justify-between items-start">
                  <div className="flex-1 pl-2">
                    <h4 className="font-bold text-slate-800 text-xs leading-relaxed">{item.name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{item.sellingPrice.toFixed(2)} ج.م / {item.unit}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    title="حذف من السلة"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  {/* Item Subtotal */}
                  <div>
                    <span className="text-xs font-black text-teal-700 font-mono">
                      {(item.sellingPrice * item.quantity).toFixed(2)} ج.م
                    </span>
                  </div>

                  {/* Quantity Stepper & Direct Input */}
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - (isBulk ? 0.5 : 1))}
                      className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    >
                      <Minus size={13} />
                    </button>

                    <input
                      type="number"
                      value={item.quantity}
                      step={isBulk ? "0.25" : "1"}
                      min="0"
                      onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                      className="w-12 text-center text-xs font-mono font-black focus:outline-none border-none bg-transparent"
                    />

                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + (isBulk ? 0.5 : 1))}
                      className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Bulk Quick Adders inside Cart Item */}
                {isBulk && (
                  <div className="flex items-center gap-1 pt-1 border-t border-slate-200/50 justify-end">
                    <span className="text-[9px] text-slate-400 ml-1">إضافة سريعة:</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700 rounded text-[9px] font-bold"
                    >
                      +1 {item.unit}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 2)}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700 rounded text-[9px] font-bold"
                    >
                      +2 {item.unit}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 5)}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700 rounded text-[9px] font-bold"
                    >
                      +5 {item.unit}
                    </button>
                  </div>
                )}

              </div>
            );
          })}

          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300 space-y-2">
              <ShoppingCart size={40} strokeWidth={1.5} />
              <p className="text-xs font-bold text-slate-400">سلة المبيعات فارغة</p>
              <p className="text-[10px] text-slate-300 text-center">امسح الباركود أو اضغط على أي منتج لإضافته</p>
            </div>
          )}
        </div>

        {/* Calculations & Checkout Form */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5 text-xs">

          {/* Subtotal */}
          <div className="flex justify-between text-slate-500 font-bold">
            <span>المجموع الفرعي:</span>
            <span className="font-mono">{subtotal.toFixed(2)} ج.م</span>
          </div>

          {/* Discount Section (Value / Percent Switcher) */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600 font-bold">الخصم:</span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px]">
                <button
                  type="button"
                  onClick={() => setDiscountType("fixed")}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${discountType === "fixed" ? "bg-teal-600 text-white" : "text-slate-600"}`}
                >
                  قيمة (ج.م)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("percent")}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${discountType === "percent" ? "bg-teal-600 text-white" : "text-slate-600"}`}
                >
                  نسبة (%)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">
                {discountType === "percent" ? "النسبة المئوية للخصم:" : "مبلغ الخصم النقدي:"}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max={discountType === "percent" ? 100 : subtotal}
                  value={discountInput}
                  onChange={(e) => setDiscountInput(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-center bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <span className="text-[10px] text-slate-500 font-bold font-mono">
                  {discountType === "percent" ? "%" : "ج.م"}
                </span>
              </div>
            </div>

            {calculatedDiscount > 0 && (
              <div className="flex justify-between text-[11px] text-rose-600 font-bold pt-1 border-t border-slate-200/60">
                <span>قيمة الخصم المحسوبة:</span>
                <span className="font-mono">-{calculatedDiscount.toFixed(2)} ج.م</span>
              </div>
            )}
          </div>



          {/* Payment Method Selector */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-bold block">طريقة الدفع:</span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setPaymentMethod("نقدي")}
                className={`py-2 rounded-xl font-black text-[10px] flex flex-col items-center gap-1 transition-colors border cursor-pointer ${paymentMethod === "نقدي"
                  ? "bg-teal-50 text-teal-700 border-teal-300 shadow-sm"
                  : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                  }`}
              >
                <Coins size={14} />
                نقدي
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("فيزا")}
                className={`py-2 rounded-xl font-black text-[10px] flex flex-col items-center gap-1 transition-colors border cursor-pointer ${paymentMethod === "فيزا"
                  ? "bg-teal-50 text-teal-700 border-teal-300 shadow-sm"
                  : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                  }`}
              >
                <CreditCard size={14} />
                فيزا
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("محفظة إلكترونية")}
                className={`py-2 rounded-xl font-black text-[10px] flex flex-col items-center gap-1 transition-colors border cursor-pointer ${paymentMethod === "محفظة إلكترونية"
                  ? "bg-teal-50 text-teal-700 border-teal-300 shadow-sm"
                  : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                  }`}
              >
                <Wallet size={14} />
                محفظة
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center bg-teal-50 p-3 rounded-2xl border border-teal-100">
            <span className="font-black text-teal-900 text-sm">المجموع الإجمالي:</span>
            <span className="font-black text-teal-700 text-xl font-mono">{total.toFixed(2)} ج.م</span>
          </div>

          {/* Checkout & Print Button */}
          <button
            type="button"
            onClick={handleCheckoutSubmit}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl transition-all shadow-md shadow-teal-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer size={16} />
            إتمام البيع وطباعة الفاتورة
          </button>
        </div>

      </div>

      {/* Mobile Sticky Checkout Quick Bar */}
      {cart.length > 0 && mobileActiveView === "products" && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-40 bg-teal-700 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between border border-teal-600 animate-fadeIn">
          <div>
            <span className="text-[10px] text-teal-200 block">السلة ({cart.length} أصناف)</span>
            <span className="font-black text-base font-mono">{total.toFixed(2)} ج.م</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileActiveView("cart")}
            className="py-2 px-4 bg-white text-teal-800 rounded-xl font-black text-xs flex items-center gap-1.5 shadow"
          >
            <span>عرض السلة والدفع</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* RENDER MODAL: Printable Thermal Invoice Receipt (80mm) */}
      {invoiceModalOpen && printedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[92vh] border border-slate-100">

            {/* Modal Actions */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
              <h3 className="font-black text-slate-800 text-sm">الفاتورة</h3>
              <div className="w-6"></div>
            </div>

            {/* Receipt Preview Scroll Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex justify-center">

              {/* Receipt Area (Targeted by media prints) */}
              <div
                id="invoice-print-container"
                className="bg-white w-full border border-slate-200 p-4 font-sans text-xs text-black text-right shadow-sm select-none"
                style={{ direction: "rtl" }}
              >
                {/* Store Header */}
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
                  <div className="flex items-center justify-center gap-1 text-slate-900 font-black text-sm">
                    <Sparkles size={16} />
                    <span>{storeInfo?.name || "محل منظفات الأمانة"}</span>
                  </div>
                  {storeInfo?.slogan && (
                    <p className="text-[10px] text-slate-600">{storeInfo.slogan}</p>
                  )}
                  {storeInfo?.phone && (
                    <p className="text-[9px] text-slate-600 font-mono">هاتف: {storeInfo.phone}</p>
                  )}
                  {storeInfo?.address && (
                    <p className="text-[9px] text-slate-600">{storeInfo.address}</p>
                  )}
                </div>

                {/* Metadata */}
                <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-1 text-slate-800">
                  <div className="flex justify-between">
                    <span>رقم الفاتورة:</span>
                    <span className="font-bold font-mono">{printedInvoice.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>التاريخ والوقت:</span>
                    <span className="font-mono">{new Date(printedInvoice.date).toLocaleString('ar-EG')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الكاشير / البائع:</span>
                    <span className="font-bold text-slate-900">{printedInvoice.cashier || currentUser?.fullName || currentUser?.name || "كاشير"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>طريقة الدفع:</span>
                    <span className="font-bold">{printedInvoice.paymentMethod}</span>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-right my-3 text-[10px]">
                  <thead>
                    <tr className="border-b border-dashed border-slate-400 text-slate-700 font-bold">
                      <th className="pb-1 text-right">المنتج</th>
                      <th className="pb-1 text-center">الكمية</th>
                      <th className="pb-1 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printedInvoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-1 text-right max-w-[140px] truncate">{item.name}</td>
                        <td className="py-1 text-center font-mono">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-1 text-left font-mono">
                          {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="border-t border-dashed border-slate-400 pt-2 space-y-1 text-[10px] text-slate-800">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono">{printedInvoice.subtotal.toFixed(2)} ج.م</span>
                  </div>

                  <div className="flex justify-between text-black font-black text-xs pt-1.5 border-t border-slate-300">
                    <span>المجموع الكلي:</span>
                    <span className="font-mono">{printedInvoice.total.toFixed(2)} ج.م</span>
                  </div>
                </div>

                {/* Invoice Footer Policy & Barcode */}
                <div className="text-center mt-4 pt-3 border-t border-dashed border-slate-400 space-y-1">
                  <p className="text-[10px] font-black">شكراً لزيارتكم وثقتكم بنا!</p>


                  {/* Print Barcode Simulation */}
                  <div className="flex flex-col items-center justify-center pt-2">
                    <div className="w-36 h-7 bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_5px)]"></div>
                    <span className="text-[8px] font-mono text-slate-600 mt-0.5">{printedInvoice.id}</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Print & Close Controls */}
            <div className="p-4 border-t border-slate-100 flex gap-2.5 bg-white shrink-0 rounded-b-3xl">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <Printer size={16} />
                طباعة الفاتورة الآن
              </button>
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
