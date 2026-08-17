import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { medicineById, medicines, type Medicine } from '../data/medicines';
import { addMaterialRequest } from '../lib/materialRequestStore';
import { useAuth } from './AuthContext';
import { useRetailers } from './RetailerContext';
import { useToast } from './ToastContext';

export interface CartLine {
  medicineId: string;
  qty: number;
}

export interface DeliveryDetails {
  storeName: string;
  contactName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  deliveryNote?: string;
}

export type PaymentMethod = 'UPI' | 'Card' | 'Net Banking' | 'Business Account' | 'Credit / Invoice';

export type OrderStatus = 'Submitted' | 'Under Review' | 'Approved' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface RetailerOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  items: {
    medicineId: string;
    name: string;
    dosageForm: string;
    strength: string;
    packSize: string;
    supplier: string;
    indicativePrice: number;
    qty: number;
  }[];
  delivery: DeliveryDetails;
  paymentMethod: PaymentMethod;
  subtotal: number;
  gst: number;
  deliveryFee: number;
  total: number;
}

const GST_RATE = 0.05;
const FREE_DELIVERY_THRESHOLD = 500;
const DELIVERY_FEE = 49;

const CART_STORAGE_KEY = 'pharmanexus-retailer-cart';
const ORDERS_STORAGE_KEY = 'pharmanexus-retailer-orders';

function orderTotals(items: { indicativePrice: number; qty: number }[]) {
  const subtotal = items.reduce((s, i) => s + i.indicativePrice * i.qty, 0);
  const gst = Math.round(subtotal * GST_RATE);
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  return { subtotal, gst, deliveryFee, total: subtotal + gst + deliveryFee };
}

function seedOrders(): RetailerOrder[] {
  const mk = (
    number: string,
    daysAgo: number,
    status: OrderStatus,
    ids: [string, number][],
    payment: PaymentMethod,
    delivery: Partial<DeliveryDetails>,
  ): RetailerOrder => {
    const items = ids
      .map(([medicineId, qty]) => {
        const m = medicineById(medicineId);
        if (!m) return null;
        return {
          medicineId,
          name: m.name,
          dosageForm: m.dosageForm,
          strength: m.strength,
          packSize: m.packSize,
          supplier: m.supplier,
          indicativePrice: m.indicativePrice,
          qty,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    const totals = orderTotals(items);
    const d: DeliveryDetails = {
      storeName: 'CarePlus Pharmacy',
      contactName: 'Rahul Mehta',
      phone: '+91 98200 44567',
      address: 'Shop 12, Linking Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      ...delivery,
    };
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    return { id: number.toLowerCase().replace(/[^a-z0-9]+/g, '-'), orderNumber: number, createdAt, status, items, delivery: d, paymentMethod: payment, ...totals };
  };

  const ids = medicines.map((m) => m.id);
  const pick = (offset: number) => ids[offset % ids.length];
  return [
    mk('ORD 20452', 1, 'Delivered', [[pick(0), 10], [pick(3), 5], [pick(7), 4]], 'UPI', { deliveryNote: 'Deliver to rear entrance before 11 AM' }),
    mk('ORD 20451', 3, 'Delivered', [[pick(1), 8], [pick(5), 12]], 'Business Account', {}),
    mk('ORD 20450', 5, 'Shipped', [[pick(2), 6], [pick(9), 10]], 'Card', {}),
    mk('ORD 20449', 9, 'Approved', [[pick(4), 10], [pick(6), 6]], 'Net Banking', {}),
    mk('ORD 20448', 14, 'Cancelled', [[pick(8), 3]], 'Credit / Invoice', {}),
  ];
}

interface CartContextValue {
  cart: CartLine[];
  saved: string[];
  cartCount: number;
  cartItems: { line: CartLine; medicine: Medicine }[];
  cartSubtotal: number;
  cartGst: number;
  cartDeliveryFee: number;
  cartTotal: number;
  orders: RetailerOrder[];
  addToCart: (medicineId: string, qty?: number) => void;
  updateQty: (medicineId: string, qty: number) => void;
  removeFromCart: (medicineId: string) => void;
  saveForLater: (medicineId: string) => void;
  moveToCart: (medicineId: string) => void;
  clearCart: () => void;
  placeOrder: (delivery: DeliveryDetails, payment: PaymentMethod) => RetailerOrder;
  reorder: (orderId: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { retailerById } = useRetailers();
  const { toast } = useToast();
  const currentRetailer = user?.storeId ? retailerById(user.storeId) : undefined;
  const canOrder = currentRetailer?.status === 'Active';

  const guardOrdering = () => {
    if (canOrder) return true;
    toast('error', 'Account not approved', 'Medicine ordering is enabled only after your retailer application is verified and approved.');
    return false;
  };
  const [cart, setCart] = useState<CartLine[]>(() => {
    const stored = readJSON<{ cart: CartLine[] }>(CART_STORAGE_KEY);
    return stored?.cart ?? [];
  });
  const [saved, setSaved] = useState<string[]>(() => {
    const stored = readJSON<{ saved: string[] }>(CART_STORAGE_KEY);
    return stored?.saved ?? [];
  });
  const [orders, setOrders] = useState<RetailerOrder[]>(() => {
    const stored = readJSON<RetailerOrder[]>(ORDERS_STORAGE_KEY);
    return stored && stored.length > 0 ? stored : seedOrders();
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ cart, saved }));
  }, [cart, saved]);

  useEffect(() => {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const cartItems = useMemo(
    () =>
      cart
        .map((line) => ({ line, medicine: medicineById(line.medicineId) }))
        .filter((x): x is { line: CartLine; medicine: Medicine } => Boolean(x.medicine)),
    [cart],
  );

  const addToCart = (medicineId: string, qty = 1) => {
    if (!guardOrdering()) return;
    setCart((c) => {
      const existing = c.find((l) => l.medicineId === medicineId);
      if (existing) return c.map((l) => (l.medicineId === medicineId ? { ...l, qty: l.qty + qty } : l));
      return [...c, { medicineId, qty }];
    });
    setSaved((s) => s.filter((id) => id !== medicineId));
  };

  const updateQty = (medicineId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(medicineId);
      return;
    }
    setCart((c) => c.map((l) => (l.medicineId === medicineId ? { ...l, qty } : l)));
  };

  const removeFromCart = (medicineId: string) => {
    setCart((c) => c.filter((l) => l.medicineId !== medicineId));
  };

  const saveForLater = (medicineId: string) => {
    setCart((c) => c.filter((l) => l.medicineId !== medicineId));
    setSaved((s) => (s.includes(medicineId) ? s : [...s, medicineId]));
  };

  const moveToCart = (medicineId: string) => {
    setSaved((s) => s.filter((id) => id !== medicineId));
    setCart((c) => (c.some((l) => l.medicineId === medicineId) ? c : [...c, { medicineId, qty: 1 }]));
  };

  const clearCart = () => setCart([]);

  const cartCount = cartItems.reduce((s, i) => s + i.line.qty, 0);
  const cartSubtotal = cartItems.reduce((s, i) => s + i.line.qty * i.medicine.indicativePrice, 0);
  const cartGst = Math.round(cartSubtotal * GST_RATE);
  const cartDeliveryFee = cartSubtotal === 0 || cartSubtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const cartTotal = cartSubtotal + cartGst + cartDeliveryFee;

  const placeOrder = (delivery: DeliveryDetails, payment: PaymentMethod): RetailerOrder => {
    if (!guardOrdering()) {
      throw new Error('ACCOUNT_NOT_APPROVED');
    }
    const items = cartItems.map((i) => ({
      medicineId: i.medicine.id,
      name: i.medicine.name,
      dosageForm: i.medicine.dosageForm,
      strength: i.medicine.strength,
      packSize: i.medicine.packSize,
      supplier: i.medicine.supplier,
      indicativePrice: i.medicine.indicativePrice,
      qty: i.line.qty,
    }));
    const totals = orderTotals(items);
    const lastSeq = orders.reduce((max, o) => {
      const n = Number(o.orderNumber.split(' ')[1]);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 20452);
    const order: RetailerOrder = {
      id: `ord-${lastSeq + 1}`,
      orderNumber: `ORD ${lastSeq + 1}`,
      createdAt: new Date().toISOString(),
      status: 'Submitted',
      items,
      delivery,
      paymentMethod: payment,
      ...totals,
    };
    setOrders((o) => [order, ...o]);
    for (const i of items) {
      addMaterialRequest({
        medicineId: i.medicineId,
        material: i.name,
        location: delivery.city,
        quantity: i.qty,
        requiredDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        priority: 'Medium',
        reason: `Retailer order ${order.orderNumber} · ${delivery.storeName} · ${i.dosageForm} ${i.strength}`,
        status: 'Under Review',
        createdBy: delivery.storeName,
        createdAt: order.createdAt,
        source: 'retailer',
        dosage: `${i.dosageForm} ${i.strength} · ${i.packSize}`,
      });
    }
    setCart([]);
    return order;
  };

  const reorder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setCart((c) => {
      const next = [...c];
      order.items.forEach((i) => {
        const existing = next.find((l) => l.medicineId === i.medicineId);
        if (existing) existing.qty += i.qty;
        else next.push({ medicineId: i.medicineId, qty: i.qty });
      });
      return next;
    });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        saved,
        cartCount,
        cartItems,
        cartSubtotal,
        cartGst,
        cartDeliveryFee,
        cartTotal,
        orders,
        addToCart,
        updateQty,
        removeFromCart,
        saveForLater,
        moveToCart,
        clearCart,
        placeOrder,
        reorder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
