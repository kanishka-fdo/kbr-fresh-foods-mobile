import React, { useState } from 'react';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import ProductTile, { ProductThumb, WishlistButton, productImage } from '../components/ProductTile';
import Icon from '../components/Icon';
import { Badge, Button, Card, Choices, Empty, ErrorBox, Field, Grid, IconButton, InfoRow, Loading, Pagination, Screen, SearchBar, Stepper, colors, font, styles, useAction, useDebounced } from '../components/ui';
import { useShopping } from '../context/ShoppingContext';
import { useAuth } from '../context/AuthContext';
import { useResource } from '../hooks/useResource';
import { categoryApi, orderApi, productApi, wholesaleApi } from '../lib/services';
import { currentCoordinates } from '../lib/location';
import { money, validQuantity } from '../lib/domain.mjs';
import type { Address, Category, Product } from '../lib/types';

export function CatalogScreen({ wholesale = false, initialCategory = '' }: { wholesale?: boolean; initialCategory?: string }) {
  const { cart } = useShopping();
  const [search, setSearch] = useState(''); const query = useDebounced(search.trim()); const [category, setCategory] = useState(initialCategory); const [page, setPage] = useState(1);
  const categories = useResource<Category[]>(async () => (await categoryApi.getAll()).data.categories, 'categories');
  const products = useResource<{ products: Product[]; pages: number; total: number }>(async () => (await productApi.getAll({ search: query, category, page, limit: 20 })).data, `${query}:${category}:${page}`);
  const units = cart.reduce((sum, item) => sum + item.quantity, 0);
  return <Screen onRefresh={() => { void products.refresh(); void categories.refresh(); }} refreshing={products.refreshing}
    footer={wholesale && cart.length ? <Button icon="clipboard" title={`Review bulk order · ${cart.length} product${cart.length === 1 ? '' : 's'}, ${units} units`} onPress={() => router.push('/wholesale-checkout')} /> : undefined}>
    {wholesale && <Card style={{ backgroundColor: colors.lime, borderColor: colors.lime }}><Text style={styles.subtitle}>Wholesale pricing</Text><Text style={styles.muted}>Prices shown are wholesale rates. Each product has a minimum order quantity, and your request is confirmed by our team as a quote.</Text></Card>}
    <SearchBar value={search} onChangeText={value => { setSearch(value); setPage(1); }} placeholder="Search fresh produce" />
    <Choices scroll values={[{ value: '', label: 'All' }, ...(categories.data || []).map(c => ({ value: c._id, label: c.name }))]} value={category} onChange={value => { setCategory(value); setPage(1); }} />
    <ErrorBox message={categories.error || products.error} />
    {!!products.error && !products.data && <Button secondary title="Try again" onPress={() => { void products.refresh(); }} />}
    {products.loading ? <Loading /> : products.data && <>
      <Text style={styles.label}>{products.data.total} product{products.data.total === 1 ? '' : 's'}{query ? ` for “${query}”` : ''}</Text>
      {products.data.products.length ? <Grid items={products.data.products} keyOf={p => p._id} render={product => <ProductTile product={product} wholesale={wholesale} />} />
        : <Empty icon="search" title="No products found" text="Try another search or category." />}
      <Pagination page={page} pages={products.data.pages} onChange={setPage} />
    </>}
  </Screen>;
}

export function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const shopping = useShopping(); const [failed, setFailed] = useState(false); const [amount, setAmount] = useState(1);
  const resource = useResource<Product>(async () => (await productApi.getById(id)).data.product, id);
  const product = resource.data;
  const inCart = product ? shopping.cart.find(item => item.product === product._id)?.quantity || 0 : 0;
  const available = product ? Math.max(0, product.stockQuantity - inCart) : 0;
  const quantity = Math.min(amount, Math.max(1, available));
  const category = product && typeof product.category === 'object' ? product.category : null;
  return <Screen onRefresh={() => { void resource.refresh(); }} refreshing={resource.refreshing}
    footer={product ? <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      {available > 0 && <Stepper value={quantity} min={1} max={available} onChange={setAmount} />}
      <Button style={{ flex: 1 }} icon={available > 0 ? 'cart' : undefined} title={available > 0 ? `Add · ${money(quantity * product.retailPrice)}` : inCart ? 'All stock is in your cart' : 'Out of stock'} disabled={!shopping.ready || available <= 0} onPress={() => { shopping.add(product, quantity); setAmount(1); }} />
    </View> : undefined}>
    <Stack.Screen options={{ title: product?.name || 'Product' }} />
    <ErrorBox message={resource.error} />{resource.loading && <Loading />}
    {product && <>
      <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: colors.field }}>
        <Image source={productImage(product, failed)} onError={() => setFailed(true)} accessibilityLabel={product.name} style={{ width: '100%', aspectRatio: 1.25 }} resizeMode="cover" />
        <View style={{ position: 'absolute', top: 12, right: 12 }}><WishlistButton product={product} size={42} /></View>
      </View>
      <View style={{ gap: 6 }}>
        <Text style={styles.badge}>{category?.name || 'Fresh produce'}</Text>
        <Text accessibilityRole="header" style={styles.title}>{product.name}</Text>
        <Text style={[styles.price, { fontSize: 22 }]}>{money(product.retailPrice)}<Text style={[styles.muted, { fontSize: 14 }]}> / {product.unit}</Text></Text>
        <View style={[styles.row, { marginTop: 4 }]}><Badge value={product.stockQuantity > 0 ? `${product.stockQuantity} ${product.unit} in stock` : 'Out of stock'} tone={product.stockQuantity > 0 ? 'green' : 'red'} />{inCart > 0 && <Badge value={`${inCart} in your cart`} tone="blue" />}</View>
      </View>
      {inCart > 0 && <Pressable accessibilityRole="button" onPress={() => router.push('/cart')} style={[styles.between, styles.card, { paddingVertical: 12, backgroundColor: colors.lime, borderColor: colors.lime }]}><Text style={[styles.text, { fontFamily: font.semibold, color: colors.green }]}>View your cart</Text><Icon name="chevron" size={18} color={colors.green} /></Pressable>}
      <Card><Text style={styles.subtitle}>About this product</Text><Text style={styles.text}>{product.description || 'Freshly selected for your kitchen.'}</Text></Card>
      <Card>
        <Text style={styles.subtitle}>Details</Text>
        <InfoRow label="Sold by" value={product.unit} />
        <InfoRow label="Wholesale price" value={`${money(product.wholesalePrice)} / ${product.unit}`} />
        <InfoRow label="Wholesale minimum" value={`${product.minWholesaleQty} ${product.unit}`} />
        {!!product.expiryDate && <InfoRow label="Best before" value={new Date(product.expiryDate).toLocaleDateString()} />}
      </Card>
    </>}
  </Screen>;
}

export function WishlistScreen() {
  const { wishlist, ready, error } = useShopping();
  return <Screen><ErrorBox message={error} />
    {!ready ? <Loading /> : wishlist.length ? <><Text style={styles.label}>{wishlist.length} saved product{wishlist.length === 1 ? '' : 's'}</Text><Grid items={wishlist} keyOf={p => p._id} render={product => <ProductTile product={product} />} /></>
      : <Empty icon="heart" title="Your wishlist is empty" text="Tap the heart on any product to save it here." action={<Button title="Browse products" onPress={() => router.push('/shop')} />} />}
  </Screen>;
}

export function CartScreen({ wholesale = false }: { wholesale?: boolean }) {
  const shopping = useShopping(); const { user } = useAuth();
  const price = (item: { retailPrice: number; wholesalePrice: number }) => wholesale ? item.wholesalePrice : item.retailPrice;
  const total = shopping.cart.reduce((sum, item) => sum + item.quantity * price(item), 0);
  const belowMinimum = wholesale ? shopping.cart.filter(item => item.quantity < Math.max(1, item.minWholesaleQty)) : [];
  const retailBlocked = !!user && !wholesale && user.role !== 'customer';
  const empty = shopping.ready && shopping.cart.length === 0;
  return <Screen footer={shopping.ready && !empty ? <>
    <View style={styles.between}><Text style={styles.muted}>Subtotal · {shopping.cart.length} product{shopping.cart.length === 1 ? '' : 's'}</Text><Text style={[styles.subtitle, { fontSize: 18 }]}>{money(total)}</Text></View>
    {retailBlocked && <Text style={[styles.muted, { fontSize: 12.5 }]}>Retail checkout is for customer accounts. Use the wholesale shop for bulk ordering.</Text>}
    <Button title={!user ? 'Sign in to check out' : wholesale ? 'Continue to quote request' : 'Continue to checkout'} disabled={retailBlocked || belowMinimum.length > 0} onPress={() => router.push(user ? wholesale ? '/bulk-submit' : '/checkout' : '/login')} />
  </> : undefined}>
    <ErrorBox message={shopping.error} />
    {!shopping.ready ? <Loading /> : empty ? <Empty icon="cart" title={wholesale ? 'Your bulk order is empty' : 'Your cart is empty'} text="Find something fresh in the shop." action={<Button title="Browse products" onPress={() => router.push(wholesale ? '/wholesale' : '/shop')} />} /> : <>
      {belowMinimum.length > 0 && <ErrorBox message={`Increase ${belowMinimum.map(item => item.name).join(', ')} to the wholesale minimum before requesting a quote.`} />}
      {shopping.cart.map(item => {
        const minimum = wholesale ? Math.max(1, item.minWholesaleQty) : 1;
        return <Card key={item.product} style={{ flexDirection: 'row', gap: 12, padding: 12 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={'View ' + item.name} onPress={() => router.push('/products/' + item.product)}><ProductThumb item={item} size={76} /></Pressable>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={[styles.between, { alignItems: 'flex-start' }]}>
              <Text numberOfLines={2} style={[styles.subtitle, { flex: 1, fontSize: 15 }]}>{item.name}</Text>
              <IconButton icon="close" size={30} label={'Remove ' + item.name} color={colors.muted} background={colors.field} onPress={() => shopping.quantity(item.product, 0)} />
            </View>
            <Text style={styles.muted}>{money(price(item))} / {item.unit}{wholesale ? ` · Min ${minimum}` : ''}</Text>
            <View style={styles.between}>
              <Stepper compact value={item.quantity} max={item.stockQuantity} onChange={value => shopping.quantity(item.product, value)} />
              <Text style={[styles.price, { fontSize: 15 }]}>{money(item.quantity * price(item))}</Text>
            </View>
            {item.quantity >= item.stockQuantity && <Text style={[styles.muted, { fontSize: 12 }]}>Maximum available quantity</Text>}
          </View>
        </Card>;
      })}
      <Text style={[styles.muted, { textAlign: 'center' }]}>Prices and stock are confirmed when you submit. {wholesale ? 'Our team confirms the final quote.' : 'Delivery is calculated at checkout.'}</Text>
    </>}
  </Screen>;
}

const paymentOptions = [
  { value: 'cod', label: 'Cash on delivery', text: 'Pay when your order arrives.' },
  { value: 'bank_transfer', label: 'Bank transfer', text: 'Payment stays pending until our team confirms receipt.' },
  { value: 'qr', label: 'QR payment', text: 'Payment stays pending until our team confirms receipt.' },
  { value: 'card', label: 'Card verification', text: 'We email you a payment code to confirm this order.' },
];
function RadioRow({ selected, label, text, onPress }: { selected: boolean; label: string; text: string; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={({ pressed }) => [{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: selected ? colors.green : colors.border, backgroundColor: selected ? colors.lime : colors.white }, pressed && { opacity: 0.8 }]}>
    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selected ? colors.green : colors.faint, alignItems: 'center', justifyContent: 'center' }}>{selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green }} />}</View>
    <View style={{ flex: 1, gap: 2 }}><Text style={[styles.text, { fontFamily: font.semibold }]}>{label}</Text><Text style={[styles.muted, { fontSize: 12.5, lineHeight: 17 }]}>{text}</Text></View>
  </Pressable>;
}
const hasCoordinates = (address: Address) => Number.isFinite(address.lat) && Number.isFinite(address.lng);

export function CheckoutScreen({ wholesale = false }: { wholesale?: boolean }) {
  const { user } = useAuth(); const shopping = useShopping(); const action = useAction(); const locating = useAction();
  const defaultAddress = user?.addresses.find(a => a.isDefault) || user?.addresses[0];
  const [address, setAddress] = useState<Address>(defaultAddress || { line1: '', line2: '', city: 'Negombo' });
  const [manual, setManual] = useState(false);
  const [payment, setPayment] = useState('cod'); const [otp, setOtp] = useState(''); const [notes, setNotes] = useState(''); const [date, setDate] = useState(''); const [otpSent, setOtpSent] = useState(false);
  const price = (item: { retailPrice: number; wholesalePrice: number }) => wholesale ? item.wholesalePrice : item.retailPrice;
  const subtotal = shopping.cart.reduce((sum, item) => sum + item.quantity * price(item), 0);
  const edit = (patch: Partial<Address>) => setAddress(previous => ({ ...previous, ...patch, _id: undefined }));
  async function submit() {
    if (!shopping.ready || !shopping.cart.length) throw new Error('Your cart is empty or still loading.');
    if (!wholesale && (!address.line1.trim() || !address.city.trim())) throw new Error('Enter your street address and city.');
    if (!wholesale && !hasCoordinates(address)) throw new Error('Set your delivery location with “Use my current location” so we can calculate delivery.');
    if (wholesale && date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error('Enter the delivery date as YYYY-MM-DD.');
      if (new Date(date + 'T23:59:59') < new Date()) throw new Error('The requested delivery date is in the past.');
    }
    if (!wholesale && payment === 'card' && !otp.trim()) throw new Error('Enter the payment code we emailed you.');
    const fresh: Product[] = await Promise.all(shopping.cart.map(async item => (await productApi.getById(item.product)).data.product));
    fresh.forEach((product, index) => {
      const item = shopping.cart[index]; const minimum = wholesale ? Math.max(1, product.minWholesaleQty) : 1;
      if (!validQuantity(item.quantity, product.stockQuantity, minimum)) throw new Error(`${product.name}: quantity must be between ${minimum} and ${product.stockQuantity} ${product.unit}.`);
      if (price(product) !== price(item)) throw new Error(`${product.name}'s price has changed. Remove it from the cart and add it again to review the new price.`);
    });
    const items = shopping.cart.map(({ product, quantity }) => ({ product, quantity }));
    const res = wholesale
      ? await wholesaleApi.requestQuote({ items, notes: notes.trim(), requestedDeliveryDate: date || undefined })
      : await orderApi.create({ items, deliveryAddress: { label: address.label, line1: address.line1.trim(), line2: address.line2?.trim(), city: address.city.trim(), lat: address.lat, lng: address.lng }, paymentMethod: payment, paymentOtp: payment === 'card' ? otp.trim() : undefined });
    shopping.clear();
    router.replace(wholesale ? `/wholesale/orders/${res.data.order._id}` : `/orders/${res.data.order._id}`);
  }
  if (shopping.ready && !shopping.cart.length) return <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}><Empty icon="cart" title="Nothing to check out" text="Your cart is empty." action={<Button title="Browse products" onPress={() => router.replace(wholesale ? '/wholesale' : '/shop')} />} /></Screen>;
  return <Screen footer={<>
    <ErrorBox message={action.error} />
    <View style={styles.between}><Text style={styles.muted}>{wholesale ? 'Estimated total' : 'Subtotal (delivery added by our team)'}</Text><Text style={[styles.subtitle, { fontSize: 18 }]}>{money(subtotal)}</Text></View>
    <Button title={wholesale ? 'Submit quote request' : 'Place order'} busy={action.busy} disabled={!shopping.ready || shopping.cart.length === 0} onPress={() => { void action.run(submit); }} />
  </>}>
    <ErrorBox message={shopping.error} />
    <Card>
      <Text style={styles.subtitle}>Order summary</Text>
      {shopping.cart.map(item => <View key={item.product} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><ProductThumb item={item} size={44} /><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.text}>{item.name}</Text><Text style={styles.muted}>{item.quantity} {item.unit} × {money(price(item))}</Text></View><Text style={[styles.text, { fontFamily: font.semibold }]}>{money(item.quantity * price(item))}</Text></View>)}
      <View style={styles.divider} />
      <InfoRow strong label="Subtotal" value={money(subtotal)} />
    </Card>
    {wholesale ? <Card><Text style={styles.subtitle}>Quote details</Text><Field label="Requested delivery date (optional)" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" maxLength={10} /><Field label="Notes for our team" placeholder="Delivery instructions, packaging, etc." value={notes} onChangeText={setNotes} multiline /></Card> : <>
      <Card>
        <Text style={styles.subtitle}>Deliver to</Text>
        {!!user?.addresses.length && <Choices values={user.addresses.map(a => ({ value: a._id!, label: `${a.label || 'Address'} · ${a.city}` }))} value={address._id || ''} onChange={id => { const saved = user.addresses.find(a => a._id === id); if (saved) setAddress(saved); }} />}
        <Field label="Street address" value={address.line1} onChangeText={line1 => edit({ line1 })} autoComplete="street-address" />
        <Field label="Apartment, landmark (optional)" value={address.line2 || ''} onChangeText={line2 => edit({ line2 })} />
        <Field label="City" value={address.city} onChangeText={city => edit({ city })} />
        <View style={[styles.card, { padding: 12, backgroundColor: hasCoordinates(address) ? colors.lime : colors.field, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
          <Icon name={hasCoordinates(address) ? 'check' : 'pin'} size={20} color={hasCoordinates(address) ? colors.green : colors.muted} />
          <Text style={[styles.muted, { flex: 1 }]}>{hasCoordinates(address) ? `Location set · ${address.lat!.toFixed(4)}, ${address.lng!.toFixed(4)}` : 'Delivery location not set yet'}</Text>
        </View>
        <ErrorBox message={locating.error} />
        <Button secondary icon="locate" title={hasCoordinates(address) ? 'Update to my current location' : 'Use my current location'} busy={locating.busy} onPress={() => { void locating.run(async () => { const coords = await currentCoordinates(); setAddress(previous => ({ ...previous, ...coords, _id: undefined })); }); }} />
        {manual ? (['lat', 'lng'] as const).map(key => <Field key={key} label={key === 'lat' ? 'Latitude' : 'Longitude'} value={address[key] === undefined ? '' : String(address[key])} keyboardType="numbers-and-punctuation" onChangeText={value => edit({ [key]: value.trim() && Number.isFinite(Number(value)) ? Number(value) : undefined })} />)
          : <Pressable accessibilityRole="button" onPress={() => setManual(true)} hitSlop={6}><Text style={[styles.muted, { textAlign: 'center', textDecorationLine: 'underline' }]}>Enter coordinates manually</Text></Pressable>}
      </Card>
      <Card>
        <Text style={styles.subtitle}>Payment method</Text>
        {paymentOptions.map(option => <RadioRow key={option.value} selected={payment === option.value} label={option.label} text={option.text} onPress={() => setPayment(option.value)} />)}
        {payment === 'card' && <>
          <Button secondary icon="mail" title={otpSent ? 'Resend payment code' : 'Email me a payment code'} busy={action.busy} onPress={() => { void action.run(async () => { await orderApi.requestPaymentOtp(subtotal); setOtpSent(true); }, 'Check your email for your payment code.'); }} />
          {otpSent && <Field label="Payment code" value={otp} onChangeText={setOtp} keyboardType="number-pad" autoComplete="one-time-code" maxLength={8} />}
          <Text style={[styles.muted, { fontSize: 12.5 }]}>Card charging requires a connected payment gateway; this step verifies the order by email.</Text>
        </>}
      </Card>
    </>}
  </Screen>;
}
