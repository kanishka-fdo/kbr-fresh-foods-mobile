import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import type { CartItem, Product } from '../lib/types';
import { mergeCart, validQuantity } from '../lib/domain.mjs';

type Shopping = { cart: CartItem[]; wishlist: Product[]; ready: boolean; error: string; add: (product: Product, quantity?: number) => void; quantity: (id: string, value: number) => void; clear: () => void; toggle: (product: Product) => void };
const Context = createContext<Shopping | null>(null);
async function read<T>(key: string, fallback: T): Promise<T> { const raw = await AsyncStorage.getItem(key); if (!raw) return fallback; try { return JSON.parse(raw); } catch { return fallback; } }
// Keyed provider prevents one account's state appearing in another account's screens.
export function ShoppingProvider({ children }: React.PropsWithChildren) {
  const { user } = useAuth();
  return <AccountShopping key={user?._id || 'guest'} id={user?._id}>{children}</AccountShopping>;
}
function AccountShopping({ children, id }: React.PropsWithChildren<{ id?: string }>) {
  const key = `kbr_mobile_shopping_${id || 'guest'}`;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        let saved = await read(key, { cart: [] as CartItem[], wishlist: [] as Product[] });
        if (id) {
          const guest = await read('kbr_mobile_shopping_guest', { cart: [] as CartItem[], wishlist: [] as Product[] });
          saved = { cart: mergeCart(saved.cart, guest.cart), wishlist: [...saved.wishlist, ...guest.wishlist.filter(p => !saved.wishlist.some(w => w._id === p._id))] };
          if (!active) return;
          // Save the merged account before removing the guest copy.
          await AsyncStorage.setItem(key, JSON.stringify(saved));
          await AsyncStorage.removeItem('kbr_mobile_shopping_guest');
        }
        if (active) { setCart(saved.cart); setWishlist(saved.wishlist); setReady(true); }
      } catch { if (active) setError('Could not load your saved cart. Restart the app to try again.'); }
    })();
    return () => { active = false; };
  }, [key, id]);
  useEffect(() => {
    if (!ready) return;
    const saved = JSON.stringify({ cart, wishlist });
    writes.current = writes.current.then(() => AsyncStorage.setItem(key, saved)).catch(() => setError('Your changes could not be saved on this device.'));
  }, [cart, wishlist, key, ready]);
  function add(product: Product, amount = 1) {
    if (!ready) throw new Error('Your cart is still loading.');
    setCart(previous => {
      const existing = previous.find(item => item.product === product._id);
      const quantity = (existing?.quantity || 0) + amount;
      if (!validQuantity(quantity, product.stockQuantity)) return previous;
      if (existing) return previous.map(item => item.product === product._id ? { ...item, quantity, stockQuantity: product.stockQuantity } : item);
      return [...previous, { product: product._id, name: product.name, unit: product.unit, retailPrice: product.retailPrice, wholesalePrice: product.wholesalePrice, stockQuantity: product.stockQuantity, minWholesaleQty: product.minWholesaleQty, images: product.images || [], quantity }];
    });
  }
  function quantity(id: string, value: number) { setCart(previous => previous.flatMap(item => item.product !== id ? [item] : value <= 0 ? [] : validQuantity(value, item.stockQuantity) ? [{ ...item, quantity: value }] : [item])); }
  return <Context.Provider value={{ cart, wishlist, ready, error, add, quantity, clear: () => setCart([]), toggle: product => setWishlist(previous => previous.some(item => item._id === product._id) ? previous.filter(item => item._id !== product._id) : [...previous, product]) }}>{children}</Context.Provider>;
}
export function useShopping() { const value = useContext(Context); if (!value) throw new Error('ShoppingProvider is missing'); return value; }
