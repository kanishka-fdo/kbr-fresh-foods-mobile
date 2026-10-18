import { useState } from 'react';
import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { Button, colors, styles } from './ui';
import { useShopping } from '../context/ShoppingContext';
import { getProductPhoto } from '../lib/productPhotos';
import { siteImage } from '../lib/site-assets';
import { money } from '../lib/domain.mjs';
import type { Product } from '../lib/types';
export default function ProductTile({ product, wholesale = false, compact = false }: { product: Product; wholesale?: boolean; compact?: boolean }) {
  const shopping = useShopping(); const [failed, setFailed] = useState(false);
  const category = typeof product.category === 'object' ? product.category : null;
  const fallback = getProductPhoto(product.name, category?.type || 'other');
  const image = failed ? fallback : product.images?.[0] || fallback;
  const inCart = shopping.cart.find(item => item.product === product._id)?.quantity || 0;
  const amount = wholesale ? Math.max(1, product.minWholesaleQty) : 1;
  const saved = shopping.wishlist.some(item => item._id === product._id);
  return <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, flex: 1 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={'View ' + product.name} onPress={() => router.push('/products/' + product._id)}><Image source={siteImage(image)} onError={() => setFailed(true)} accessibilityLabel={product.name} style={{ width: '100%', aspectRatio: compact ? 1.15 : 1.6, backgroundColor: '#f3f5ef' }} resizeMode="cover" /></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={(saved ? 'Remove ' : 'Save ') + product.name + (saved ? ' from wishlist' : ' to wishlist')} disabled={!shopping.ready} onPress={() => shopping.toggle(product)} style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#ffffffee', borderRadius: 22, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 23, color: saved ? '#c14444' : colors.muted }}>{saved ? '♥' : '♡'}</Text></Pressable>
    <View style={{ padding: compact ? 12 : 18, gap: 8 }}><Text style={[styles.badge, { fontSize: 9, letterSpacing: 1 }]}>{category?.name || 'Fresh produce'}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/products/' + product._id)}><Text numberOfLines={compact ? 2 : undefined} style={[styles.subtitle, { fontSize: compact ? 15 : 21, minHeight: compact ? 42 : undefined }]}>{product.name}</Text></Pressable><Text style={{ fontFamily: 'Inter_700Bold', fontSize: compact ? 14 : 18, color: colors.green }}>{money(wholesale ? product.wholesalePrice : product.retailPrice)}<Text style={styles.muted}> / {product.unit}</Text></Text><Text style={[styles.muted, { fontSize: 11 }]}>{product.stockQuantity > 0 ? product.stockQuantity + ' ' + product.unit + ' available' : 'Out of stock'}{wholesale ? ' · Min ' + amount : ''}</Text><Button title={inCart ? '+ Add · ' + inCart + ' in cart' : wholesale ? 'Add ' + amount : 'Add to Cart'} disabled={!shopping.ready || inCart + amount > product.stockQuantity} onPress={() => shopping.add(product, amount)} /></View>
  </View>;
}
