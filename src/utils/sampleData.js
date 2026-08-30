export const initialProducts = [
  {
    id: "1",
    name: "مسحوق غسيل أوتوماتيك أريال 2.5 كجم",
    category: "مساحيق غسيل",
    unit: "قطعة",
    barcode: "6221008001234",
    costPrice: 180.00,
    sellingPrice: 220.00,
    stock: 25,
    reorderThreshold: 5
  },
  {
    id: "2",
    name: "كلور سائل صب (خام باللتر)",
    category: "منظفات سائلة",
    unit: "لتر",
    barcode: "1001",
    costPrice: 2.50,
    sellingPrice: 5.00,
    stock: 350.5,
    reorderThreshold: 50
  },
  {
    id: "3",
    name: "صابون سائل ديتول للأيدي 500 مل",
    category: "مطهرات ومعقمات",
    unit: "قطعة",
    barcode: "6221100223344",
    costPrice: 42.00,
    sellingPrice: 55.00,
    stock: 40,
    reorderThreshold: 8
  },
  {
    id: "4",
    name: "مناديل تواليت مضغوطة فاميليا (4 بكرات)",
    category: "مناديل وورقيات",
    unit: "قطعة",
    barcode: "6221234567890",
    costPrice: 28.00,
    sellingPrice: 38.00,
    stock: 4, // Low stock on purpose
    reorderThreshold: 6
  },
  {
    id: "5",
    name: "ديتول معقم سائل متعدد الاستخدامات 1 لتر",
    category: "مطهرات ومعقمات",
    unit: "قطعة",
    barcode: "6222004005001",
    costPrice: 110.00,
    sellingPrice: 135.00,
    stock: 15,
    reorderThreshold: 3
  },
  {
    id: "6",
    name: "صابون غسيل أطباق بالليمون صب (باللتر)",
    category: "منظفات سائلة",
    unit: "لتر",
    barcode: "1002",
    costPrice: 4.00,
    sellingPrice: 8.00,
    stock: 0, // Out of stock on purpose
    reorderThreshold: 30
  },
  {
    id: "7",
    name: "مسحوق داوني منعم أقمشة صب (باللتر)",
    category: "منظفات سائلة",
    unit: "لتر",
    barcode: "1003",
    costPrice: 8.00,
    sellingPrice: 15.00,
    stock: 80,
    reorderThreshold: 20
  }
];

export const initialExpenses = [
  {
    id: "exp-1",
    category: "إيجار",
    amount: 1500.00,
    date: "2026-08-01",
    description: "إيجار المحل لشهر أغسطس"
  },
  {
    id: "exp-2",
    category: "كهرباء ومياه",
    amount: 450.00,
    date: "2026-08-10",
    description: "فاتورة الكهرباء والماء لشهر يوليو"
  },
  {
    id: "exp-3",
    category: "رواتب ومصنعية",
    amount: 1200.00,
    date: "2026-08-25",
    description: "أجرة العامل المساعد مؤقتاً"
  },
  {
    id: "exp-4",
    category: "مستلزمات عامة",
    amount: 250.00,
    date: "2026-08-26",
    description: "شراء أكياس تعبئة وعبوات بلاستيكية فارغة"
  }
];

export const initialSales = [
  {
    id: "sale-1",
    date: "2026-08-27T10:15:00+03:00",
    items: [
      {
        id: "1",
        name: "مسحوق غسيل أوتوماتيك أريال 2.5 كجم",
        unit: "قطعة",
        quantity: 2,
        costPrice: 180.00,
        sellingPrice: 220.00,
        total: 440.00
      },
      {
        id: "2",
        name: "كلور سائل صب (خام باللتر)",
        unit: "لتر",
        quantity: 5,
        costPrice: 2.50,
        sellingPrice: 5.00,
        total: 25.00
      }
    ],
    subtotal: 465.00,
    discount: 15.00,
    tax: 63.00, // 14% of (465 - 15) = 450
    total: 513.00,
    paymentMethod: "نقدي",
    cogs: 372.50 // (2 * 180) + (5 * 2.5)
  },
  {
    id: "sale-2",
    date: "2026-08-27T14:30:00+03:00",
    items: [
      {
        id: "5",
        name: "ديتول معقم سائل متعدد الاستخدامات 1 لتر",
        unit: "قطعة",
        quantity: 1,
        costPrice: 110.00,
        sellingPrice: 135.00,
        total: 135.00
      },
      {
        id: "7",
        name: "مسحوق داوني منعم أقمشة صب (باللتر)",
        unit: "لتر",
        quantity: 3,
        costPrice: 8.00,
        sellingPrice: 15.00,
        total: 45.00
      }
    ],
    subtotal: 180.00,
    discount: 0.00,
    tax: 25.20, // 14% of 180
    total: 205.20,
    paymentMethod: "فيزا",
    cogs: 134.00 // (1 * 110) + (3 * 8)
  }
];

export const initialPartners = [
  {
    id: "partner-1",
    name: "أحمد عبد الله",
    capitalShare: 60000.00, // 60%
    profitPercentage: 60
  },
  {
    id: "partner-2",
    name: "محمد محمود",
    capitalShare: 40000.00, // 40%
    profitPercentage: 40
  }
];

// Initial balance withdrawals
export const initialWithdrawals = [
  {
    id: "w-1",
    partnerId: "partner-1",
    partnerName: "أحمد عبد الله",
    amount: 100.00,
    date: "2026-08-27",
    description: "سحب جزئي من الأرباح"
  }
];
