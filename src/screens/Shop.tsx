import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import ProductTile from '../components/ProductTile';
import { Button, Card, Choices, Empty, ErrorBox, Field, Loading, Screen, styles, useAction } from '../components/ui';
import { useShopping } from '../context/ShoppingContext';
import { useAuth } from '../context/AuthContext';
import { useResource } from '../hooks/useResource';
import { categoryApi, orderApi, productApi, wholesaleApi } from '../lib/services';
import { money, validQuantity } from '../lib/domain.mjs';
import type { Address, Category, Product } from '../lib/types';

const ProductCard = ProductTile;
export function CatalogScreen({ wholesale = false, initialCategory = '' }: { wholesale?: boolean; initialCategory?: string }) {
  const [search, setSearch] = useState(''); const [query, setQuery] = useState(''); const [category, setCategory] = useState(initialCategory); const [page, setPage] = useState(1);
  const categories = useResource<Category[]>(async () => (await categoryApi.getAll()).data.categories, 'categories');
  const products = useResource<{ products: Product[]; pages: number; total: number }>(async () => (await productApi.getAll({ search: query, category, page, limit: 20 })).data, `${query}:${category}:${page}`);
  return <Screen title={wholesale ? 'Wholesale shop' : 'KBR Fresh Foods Products'} subtitle={wholesale ? 'Build a bulk order using the wholesale prices and minimum quantities.' : 'Fresh produce sourced daily — bananas, fruits, vegetables & more from Negombo, Sri Lanka.'} onRefresh={() => { void products.refresh(); }} refreshing={products.loading && !!products.data}>
    <View style={styles.row}><View style={{ flex: 1 }}><Field label="Search products" value={search} onChangeText={setSearch} returnKeyType="search" onSubmitEditing={() => { setQuery(search); setPage(1); }} /></View><Button title="Search" onPress={() => { setQuery(search); setPage(1); }} /></View>
    <Choices values={[{ value: '', label: 'All' }, ...(categories.data || []).map(c => ({ value: c._id, label: c.name }))]} value={category} onChange={value => { setCategory(value); setPage(1); }} />
    <ErrorBox message={categories.error || products.error} />
    {wholesale && <Button title="Review bulk order" onPress={() => router.push('/wholesale-checkout')} />}
    {products.loading && !products.data ? <Loading /> : <>{products.data && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{products.data.products.map(product => <View key={product._id} style={{ width: '47%', maxWidth: '49%', flexGrow: 1 }}><ProductCard product={product} wholesale={wholesale} compact /></View>)}</View>}{products.data?.products.length === 0 && <Empty text="No products found. Try another search or category." />}</>}
    {!!products.data && products.data.pages > 1 && <View style={styles.row}><Button secondary title="Previous" disabled={page === 1} onPress={() => setPage(page - 1)} /><Text style={styles.muted}>{page} / {products.data.pages}</Text><Button secondary title="Next" disabled={page >= products.data.pages} onPress={() => setPage(page + 1)} /></View>}
  </Screen>;
}
export function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = useResource<Product>(async () => (await productApi.getById(id)).data.product, id);
  return <Screen title="Product details" onRefresh={() => { void resource.refresh(); }} refreshing={resource.loading && !!resource.data}><ErrorBox message={resource.error} />{resource.loading && !resource.data && <Loading />}{resource.data && <><ProductCard product={resource.data} /><Card><Text style={styles.subtitle}>About this product</Text><Text style={styles.text}>{resource.data.description || 'Freshly selected for your kitchen.'}</Text><Text style={styles.muted}>Wholesale: {money(resource.data.wholesalePrice)} / {resource.data.unit} · Minimum {resource.data.minWholesaleQty}</Text></Card></>}</Screen>;
}
export function WishlistScreen() {
  const { wishlist, ready, error } = useShopping();
  return <Screen title="Your wishlist"><ErrorBox message={error} />{!ready ? <Loading /> : wishlist.length ? wishlist.map(product => <ProductCard key={product._id} product={product} />) : <Empty text="Save products from the shop to find them here." />}</Screen>;
}
export function CartScreen({ wholesale = false }: { wholesale?: boolean }) {
  const shopping = useShopping(); const { user } = useAuth();
  const total = shopping.cart.reduce((sum, item) => sum + item.quantity * (wholesale ? item.wholesalePrice : item.retailPrice), 0);
  return <Screen title={wholesale ? 'Your bulk order' : 'Your cart'}><ErrorBox message={shopping.error} />{!shopping.ready ? <Loading /> : shopping.cart.length === 0 ? <><Empty text="Your cart is empty. Find something fresh in the shop." /><Button title="Browse products" onPress={() => router.push('/shop')} /></> : <>
    {shopping.cart.map(item => <Card key={item.product}><Text style={styles.subtitle}>{item.name}</Text><Text style={styles.muted}>{money(wholesale ? item.wholesalePrice : item.retailPrice)} / {item.unit}{wholesale ? ` · Minimum ${item.minWholesaleQty}` : ''}</Text><View style={styles.row}><Button secondary title="−" onPress={() => shopping.quantity(item.product, Math.max(0, item.quantity - 1))} /><Text style={styles.subtitle}>{item.quantity} {item.unit}</Text><Button secondary title="+" disabled={item.quantity >= item.stockQuantity} onPress={() => shopping.quantity(item.product, item.quantity + 1)} /><Button secondary title="Remove" onPress={() => shopping.quantity(item.product, 0)} /></View><Text style={styles.text}>{money(item.quantity * (wholesale ? item.wholesalePrice : item.retailPrice))}</Text></Card>)}
    <Card><Text style={styles.subtitle}>Subtotal {money(total)}</Text><Text style={styles.muted}>Prices and stock are checked when you submit. Delivery is calculated by the server.</Text><Button title={user ? wholesale ? 'Request bulk quote' : 'Continue to checkout' : 'Sign in to continue'} disabled={!!user && !wholesale && user.role !== 'customer'} onPress={() => router.push(user ? wholesale ? '/bulk-submit' : '/checkout' : '/login')} />{user && user.role !== 'customer' && !wholesale && <Text style={styles.muted}>Retail checkout is available to customer accounts. Use the wholesale shop for bulk ordering.</Text>}</Card>
  </>}</Screen>;
}
export function CheckoutScreen({ wholesale = false }: { wholesale?: boolean }) {
  const { user } = useAuth(); const shopping = useShopping(); const action = useAction();
  const defaultAddress = user?.addresses.find(a => a.isDefault) || user?.addresses[0];
  const [address, setAddress] = useState<Address>(defaultAddress || { line1: '', line2: '', city: 'Negombo' });
  const [payment, setPayment] = useState('cod'); const [otp, setOtp] = useState(''); const [notes, setNotes] = useState(''); const [date, setDate] = useState(''); const [otpSent, setOtpSent] = useState(false);
  const subtotal = shopping.cart.reduce((sum, item) => sum + item.quantity * (wholesale ? item.wholesalePrice : item.retailPrice), 0);
  async function submit() {
    if (!shopping.ready || !shopping.cart.length) throw new Error('Your cart is empty or still loading.');
    if (!wholesale && (!address.line1.trim() || !address.city.trim())) throw new Error('Enter your delivery address and city.');
    if (wholesale && date && Number.isNaN(Date.parse(date))) throw new Error('Enter a valid delivery date: YYYY-MM-DD.');
    const fresh: Product[] = await Promise.all(shopping.cart.map(async item => (await productApi.getById(item.product)).data.product));
    fresh.forEach((product, index) => {
      const item = shopping.cart[index]; const minimum = wholesale ? Math.max(1, product.minWholesaleQty) : 1;
      if (!validQuantity(item.quantity, product.stockQuantity, minimum)) throw new Error(`${product.name}: quantity must be between ${minimum} and ${product.stockQuantity} ${product.unit}.`);
      if ((wholesale ? product.wholesalePrice : product.retailPrice) !== (wholesale ? item.wholesalePrice : item.retailPrice)) throw new Error(`${product.name}'s price has changed. Remove it from the cart and add it again to review the new price.`);
    });
    const items = shopping.cart.map(({ product, quantity }) => ({ product, quantity }));
    const res = wholesale ? await wholesaleApi.requestQuote({ items, notes, requestedDeliveryDate: date || undefined }) : await orderApi.create({ items, deliveryAddress: address, paymentMethod: payment, paymentOtp: payment === 'card' ? otp : undefined });
    shopping.clear();
    router.replace(wholesale ? `/wholesale/orders/${res.data.order._id}` : `/orders/${res.data.order._id}`);
  }
  return <Screen title={wholesale ? 'Request a bulk quote' : 'Checkout'}><ErrorBox message={action.error || shopping.error} />
    <Card>{shopping.cart.map(item => <Text key={item.product} style={styles.text}>{item.name} × {item.quantity} · {money(item.quantity * (wholesale ? item.wholesalePrice : item.retailPrice))}</Text>)}<Text style={styles.subtitle}>Subtotal {money(subtotal)}</Text></Card>
    {wholesale ? <Card><Field label="Requested delivery date (YYYY-MM-DD, optional)" value={date} onChangeText={setDate} /><Field label="Order notes" value={notes} onChangeText={setNotes} multiline /></Card> : <>
      <Card><Text style={styles.subtitle}>Deliver to</Text>{!!user?.addresses.length && <Choices values={user.addresses.map(a => ({ value: a._id!, label: `${a.label || 'Address'} · ${a.line1}` }))} value={address._id || ''} onChange={id => setAddress(user.addresses.find(a => a._id === id)!)} />}
        {(['line1', 'line2', 'city'] as const).map(key => <Field key={key} label={key === 'line1' ? 'Street address' : key === 'line2' ? 'Apartment / additional details' : 'City'} value={address[key] || ''} onChangeText={value => setAddress({ ...address, [key]: value })} />)}
        <Text style={styles.muted}>Coordinates are optional and help calculate delivery distance.</Text>{(['lat', 'lng'] as const).map(key => <Field key={key} label={key === 'lat' ? 'Latitude' : 'Longitude'} value={address[key] === undefined ? '' : String(address[key])} keyboardType="numbers-and-punctuation" onChangeText={value => setAddress({ ...address, [key]: value && Number.isFinite(Number(value)) ? Number(value) : undefined })} />)}
      </Card><Card><Text style={styles.subtitle}>Payment method</Text><Choices values={[{ value: 'cod', label: 'Cash on delivery' }, { value: 'bank_transfer', label: 'Bank transfer' }, { value: 'qr', label: 'QR payment' }, { value: 'card', label: 'Card verification' }]} value={payment} onChange={setPayment} />
        <Text style={styles.muted}>{payment === 'cod' ? 'Pay when your order arrives.' : payment === 'card' ? 'This uses the existing email OTP flow. Card charging requires a connected payment gateway.' : 'Your payment stays pending until staff confirm receipt.'}</Text>
        {payment === 'card' && <><Button secondary title={otpSent ? 'Resend payment code' : 'Email payment code'} busy={action.busy} onPress={() => { void action.run(async () => { await orderApi.requestPaymentOtp(subtotal); setOtpSent(true); }, 'Check your email for your payment code.'); }} /><Field label="Payment code" value={otp} onChangeText={setOtp} keyboardType="number-pad" /></>}
      </Card></>}
    <Button title={wholesale ? 'Submit quote request' : 'Place order'} busy={action.busy} disabled={!shopping.ready || shopping.cart.length === 0 || (!wholesale && payment === 'card' && !otp)} onPress={() => { void action.run(submit); }} />
  </Screen>;
}
