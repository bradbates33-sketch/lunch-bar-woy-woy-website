import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'lbww-cart-v2';

// A cart entry ("line") is one variation + a specific set of modifiers:
//   { key, variationId, itemName, variationLabel, modifiers:[{id,name,priceCents}],
//     unitPriceCents, quantity }
// `key` identifies the line (same variation + same modifiers stacks quantity).

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed.filter((l) => l && l.key && l.variationId));
      }
    } catch (err) {
      console.error('Could not read saved cart:', err);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Could not save cart:', err);
    }
  }, [items, loaded]);

  function addLine(line) {
    setItems((prev) => {
      const existing = prev.find((l) => l.key === line.key);
      if (existing) {
        return prev.map((l) =>
          l.key === line.key ? { ...l, quantity: l.quantity + (line.quantity || 1) } : l,
        );
      }
      return [...prev, { ...line, quantity: line.quantity || 1 }];
    });
    setIsOpen(true);
  }

  // Convenience for items with no options — add the sole variation directly.
  function addItem(item) {
    const variationId = item.variationId || item.variations?.[0]?.id || item.id;
    const unitPriceCents =
      item.priceCents ??
      item.variations?.[0]?.priceCents ??
      Math.round(parseFloat(item.price || '0') * 100);
    addLine({
      key: variationId + '|',
      variationId,
      itemName: item.name,
      variationLabel: '',
      modifiers: [],
      unitPriceCents,
      quantity: 1,
    });
  }

  function updateQuantity(key, quantity) {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((l) => l.key !== key));
      return;
    }
    setItems((prev) => prev.map((l) => (l.key === key ? { ...l, quantity } : l)));
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((l) => l.key !== key));
  }

  const subtotal =
    items.reduce((sum, l) => sum + (l.unitPriceCents || 0) * l.quantity, 0) / 100;
  const count = items.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addLine, addItem, updateQuantity, removeItem, subtotal, count, isOpen, setIsOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
