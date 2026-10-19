import { useState } from 'react';
import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import Icon from './Icon';
import { Button, Stepper, colors, font, styles } from './ui';
import { useShopping } from '../context/ShoppingContext';
import { getProductPhoto } from '../lib/productPhotos';
import { siteImage } from '../lib/site-assets';
import { money } from '../lib/domain.mjs';
import type { CartItem, Product } from '../lib/types';

export function productImage(product: { name: string; images?: string[]; category?: Product['category'] }, failed = false) {
  const category = typeof product.category === 'object' ? product.category : null;
  const fallback = getProductPhoto(product.name, category?.type || 'other');
  return siteImage(failed ? fallback : product.images?.[0] || fallback);
}
export function ProductThumb({ item, size = 64 }: { item: Pick<CartItem, 'name' | 'images'>; size?: number }) {
  const [failed, setFailed] = useState(false);
  return <Image source={productImage(item, failed)} onError={() => setFailed(true)} style={{ width: size, height: size, borderRadius: 12, backgroundColor: colors.field }} resizeMode="cover" />;
}
export function WishlistButton({ product, size = 36 }: { product: Product; size?: number }) {
  const shopping = useShopping(); const saved = shopping.wishlist.some(item => item._id === product._id);
  return <Pressable accessibilityRole="button" accessibilityLabel={(saved ? 'Remove ' : 'Save ') + product.name + (saved ? ' from wishlist' : ' to wishlist')} accessibilityState={{ selected: saved }} disabled={!shopping.ready} hitSlop={6} onPress={() => shopping.toggle(product)}
    style={({ pressed }) => ({ backgroundColor: '#ffffffee', borderRadius: size / 2, width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
    <Icon name="heart" size={size * 0.5} color={saved ? '#c14444' : colors.muted} fill={saved ? '#c14444' : 'none'} />
  </Pressable>;
}
/** Compact grid card. Fills its grid cell so cards in a row share one height and their buttons line up. */
export default function ProductTile({ product, wholesale = false }: { product: Product; wholesale?: boolean; compact?: boolean }) {
  const shopping = useShopping(); const [failed, setFailed] = useState(false);
  const category = typeof product.category === 'object' ? product.category : null;
  const inCart = shopping.cart.find(item => item.product === product._id)?.quantity || 0;
  const minimum = wholesale ? Math.max(1, product.minWholesaleQty || 1) : 1;
  const outOfStock = product.stockQuantity < minimum;
  const open = () => router.push('/products/' + product._id);
  const change = (value: number) => shopping.quantity(product._id, wholesale && value < minimum ? 0 : value);
  return <View style={{ flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }}>
    <Pressable accessibilityRole="button" accessibilityLabel={'View ' + product.name} onPress={open}>
      <Image source={productImage(product, failed)} onError={() => setFailed(true)} style={{ width: '100%', aspectRatio: 1.1, backgroundColor: colors.field }} resizeMode="cover" />
      {outOfStock && <View style={{ position: 'absolute', left: 8, bottom: 8, backgroundColor: '#000000a0', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}><Text style={{ color: colors.white, fontFamily: font.semibold, fontSize: 11 }}>Out of stock</Text></View>}
    </Pressable>
    <View style={{ position: 'absolute', top: 8, right: 8 }}><WishlistButton product={product} /></View>
    <View style={{ flex: 1, padding: 12, gap: 4 }}>
      <Text numberOfLines={1} style={[styles.badge, { fontSize: 10 }]}>{category?.name || 'Fresh produce'}</Text>
      <Pressable accessibilityRole="button" onPress={open}><Text numberOfLines={2} style={[styles.subtitle, { fontSize: 14.5, lineHeight: 19, minHeight: 38 }]}>{product.name}</Text></Pressable>
      <Text numberOfLines={1} style={[styles.price, { fontSize: 15 }]}>{money(wholesale ? product.wholesalePrice : product.retailPrice)}<Text style={[styles.muted, { fontSize: 12 }]}> / {product.unit}</Text></Text>
      <Text numberOfLines={1} style={[styles.muted, { fontSize: 11.5, lineHeight: 16 }]}>{wholesale ? `Min ${minimum} ${product.unit} · ` : ''}{outOfStock ? 'Unavailable' : `${product.stockQuantity} ${product.unit} in stock`}</Text>
      <View style={{ marginTop: 'auto', paddingTop: 8 }}>
        {inCart > 0
          ? <Stepper compact stretch value={inCart} max={product.stockQuantity} onChange={change} />
          : <Button small icon={outOfStock ? undefined : 'plus'} title={outOfStock ? 'Out of stock' : wholesale ? `Add ${minimum}` : 'Add'} disabled={!shopping.ready || outOfStock} onPress={() => shopping.add(product, minimum)} />}
      </View>
    </View>
  </View>;
}
