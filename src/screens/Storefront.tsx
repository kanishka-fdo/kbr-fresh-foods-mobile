import React, { useState } from 'react';
import { Image, ImageBackground, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Empty, ErrorBox, Field, Grid, Loading, colors, font, styles, useAction } from '../components/ui';
import { editorial, editorialItalic } from '../components/Brand';
import Icon from '../components/Icon';
import VideoModal from '../components/VideoModal';
import ProductTile from '../components/ProductTile';
import { siteContent as content } from '../lib/site-content';
import { SITE_URL, siteImage } from '../lib/site-assets';
import { useResource } from '../hooks/useResource';
import { categoryApi, productApi } from '../lib/services';
import type { Category, Product } from '../lib/types';

const local = StyleSheet.create({
  // Keep the footer used by About unchanged; the homepage has its own spacing.
  section: { paddingHorizontal: 22, paddingVertical: 32, gap: 20, maxWidth: 1000, width: '100%', alignSelf: 'center' },
  homeSection: { paddingHorizontal: 16, paddingVertical: 24, gap: 16, maxWidth: 780, width: '100%', alignSelf: 'center' },
  heading: { ...editorial, fontSize: 30, lineHeight: 34, color: colors.forest, letterSpacing: -0.4 },
  eyebrow: { fontFamily: font.semibold, color: '#806139', fontSize: 12, lineHeight: 18, letterSpacing: 1.5, textTransform: 'uppercase' },
  body: { ...styles.text, fontSize: 16, lineHeight: 24 },
  heroCopy: { padding: 24, gap: 16, backgroundColor: 'rgba(4,8,4,0.72)', minHeight: 300, flex: 1, justifyContent: 'center' },
  heroTitle: { ...editorial, color: colors.white, fontSize: 38, lineHeight: 40, letterSpacing: -0.6 },
  goldButton: { backgroundColor: colors.gold, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.field, borderWidth: 1, borderColor: colors.border },
  accordion: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.white, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, padding: 16 },
  accordionBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 16 },
  storyImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.field },
  textAction: { minHeight: 48, paddingVertical: 12, justifyContent: 'center' },
  picker: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 12 },
});

function Heading({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return <View style={{ gap: 8 }}>
    {!!eyebrow && <Text style={local.eyebrow}>{eyebrow}</Text>}
    <Text accessibilityRole="header" style={local.heading}>{title}</Text>
    {!!text && <Text style={[styles.muted, { fontSize: 14, lineHeight: 21 }]}>{text}</Text>}
  </View>;
}

function HomeAccordion({ title, image, eyebrow, children, initiallyOpen = false }: React.PropsWithChildren<{ title: string; image?: string; eyebrow?: string; initiallyOpen?: boolean }>) {
  const [open, setOpen] = useState(initiallyOpen);
  return <View style={local.accordion}>
    <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)}
      style={({ pressed }) => [local.accordionHeader, { opacity: pressed ? 0.75 : 1 }]}>
      {!!image && <Image source={siteImage(image)} style={local.storyImage} resizeMode="cover" />}
      <View style={{ flex: 1, gap: 4 }}>{!!eyebrow && <Text style={local.eyebrow}>{eyebrow}</Text>}<Text style={styles.subtitle}>{title}</Text></View>
      <View style={{ transform: [{ rotate: open ? '270deg' : '90deg' }] }}><Icon name="chevron" size={18} color={colors.green} /></View>
    </Pressable>
    {open && <View style={local.accordionBody}>{children}</View>}
  </View>;
}

function CategoryImage({ category }: { category: Category }) {
  const path = /banana/i.test(category.name) ? '/cat_banana.png' : category.type === 'fruit' ? '/cat_fruit.png' : category.type === 'vegetable' ? '/cat_vegetable.png' : '/cat_others.png';
  return <Pressable accessibilityRole="button" accessibilityLabel={'Shop ' + category.name}
    style={({ pressed }) => ({ borderRadius: 16, overflow: 'hidden', opacity: pressed ? 0.85 : 1 })}
    onPress={() => router.push({ pathname: '/shop', params: { category: category._id } })}>
    <ImageBackground source={siteImage(path)} style={{ minHeight: 104 }} resizeMode="cover">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000070', padding: 12, minHeight: 104 }}>
        <Text style={{ color: colors.white, fontFamily: font.semibold, fontSize: 16, lineHeight: 22 }}>{category.name}</Text>
      </View>
    </ImageBackground>
  </Pressable>;
}

function ProductGrid({ products, columns }: { products: Product[]; columns: number }) {
  return <Grid columns={columns} items={products} keyOf={product => product._id} render={product => <ProductTile product={product} />} />;
}

export function StorefrontFooter() {
  const action = useAction();
  return <View style={{ backgroundColor: '#0d1f0d' }}><View style={local.section}><Image source={siteImage('/kbr-logo.png')} accessibilityLabel="KBR Fresh Foods logo" style={{ width: 66, height: 66 }} /><Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 22 }}>KBR Fresh Foods</Text><Text style={[styles.text, { color: '#b9cbb9' }]}>Negombo&apos;s trusted source for farm-fresh organic fruits, vegetables, dairy, and grocery essentials. Supplying Keells, Food City, and homes across Negombo since 2010.</Text><Text style={[styles.text, { color: '#fff' }]}>No11, Mirigama Road,{'\n'}Koppara Junction,{'\n'}Negombo, Sri Lanka</Text><Text style={[styles.muted, { color: '#b9cbb9' }]}>Mon–Sat: 6:00 AM – 8:00 PM{'\n'}Sunday: 7:00 AM – 5:00 PM</Text><Button secondary title="+94 77 977 9316" onPress={() => { void action.run(() => Linking.openURL('tel:+94779779316')); }} /><Button secondary title="Chat on WhatsApp" onPress={() => { void action.run(() => Linking.openURL('https://wa.me/94779779316')); }} /><Button secondary title="info@kbrfreshfoods.lk" onPress={() => { void action.run(() => Linking.openURL('mailto:info@kbrfreshfoods.lk')); }} /><View style={styles.row}>{[['about', 'Our story'], ['contact', 'Contact us'], ['stores', 'Store locations'], ['register', 'Wholesale accounts']].map(([path, label]) => <Button key={path} secondary title={label} onPress={() => router.push('/' + path)} />)}</View><Text style={[styles.muted, { color: '#91a891', fontSize: 11 }]}>© {new Date().getFullYear()} KBR Fresh Foods (Pvt) Ltd. All rights reserved. Negombo, Sri Lanka.</Text><ErrorBox message={action.error} /></View></View>;
}

function HomeFooter() {
  return <View style={{ backgroundColor: colors.forest }}><View style={local.homeSection}>
    <View style={[styles.row, { flexWrap: 'nowrap' }]}>
      <Image source={siteImage('/kbr-logo.png')} accessibilityLabel="KBR Fresh Foods logo" style={{ width: 44, height: 44, borderRadius: 8 }} />
      <View style={{ flex: 1 }}><Text style={[styles.subtitle, { color: colors.white }]}>KBR Fresh Foods</Text><Text style={[styles.muted, { color: '#c4d4c4' }]}>Fresh from Negombo</Text></View>
    </View>
    <View style={[styles.row, { gap: 24 }]}>
      {([['/about', 'Our story'], ['/contact', 'Contact'], ['/stores', 'Stores']] as const).map(([path, title]) =>
        <Pressable key={path} accessibilityRole="link" onPress={() => router.push(path)} style={local.textAction}><Text style={{ color: colors.white, fontFamily: font.semibold, fontSize: 14 }}>{title}</Text></Pressable>)}
    </View>
    <Text style={[styles.muted, { color: '#c4d4c4', fontSize: 12 }]}>© {new Date().getFullYear()} KBR Fresh Foods (Pvt) Ltd.</Text>
  </View></View>;
}

export default function StorefrontScreen() {
  const { width, fontScale } = useWindowDimensions();
  const action = useAction();
  const [current, setCurrent] = useState(0);
  const [collection, setCollection] = useState(0);
  const [video, setVideo] = useState<string | null>(null);
  const [review, setReview] = useState(0);
  const [email, setEmail] = useState('');
  const columns = width < 350 || fontScale > 1.3 ? 1 : 2;
  const resource = useResource<{ categories: Category[]; products: Product[] }>(async () => {
    const [categories, products] = await Promise.all([categoryApi.getAll(), productApi.getAll({ limit: 20 })]);
    return { categories: categories.data.categories, products: products.data.products };
  }, 'storefront');
  const slide = content.hero[current];
  const panel = content.collections[collection];
  const testimonial = content.reviews[review];
  const products = resource.data?.products || [];
  const categoryShop = (type: string) => {
    const category = resource.data?.categories.find(item => item.type === type);
    router.push(category ? { pathname: '/shop', params: { category: category._id } } : '/shop');
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['bottom']}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 0 }}
      refreshControl={<RefreshControl refreshing={resource.refreshing} onRefresh={() => { void resource.refresh(); }} tintColor={colors.green} colors={[colors.green]} />}>
      <View style={[local.homeSection, { paddingVertical: 12 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Search products in the shop" onPress={() => router.push('/shop')}
          style={({ pressed }) => [local.search, { opacity: pressed ? 0.75 : 1 }]}>
          <Icon name="search" size={20} color={colors.muted} /><Text style={[styles.muted, { flex: 1, fontSize: 15 }]}>Search fresh produce</Text><Icon name="chevron" size={18} color={colors.green} />
        </Pressable>
      </View>

      <ImageBackground source={siteImage(slide.img)} accessibilityLabel={slide.eyebrow} style={{ minHeight: 300, width: '100%' }} resizeMode="cover">
        <View style={local.heroCopy}>
          <Text style={[local.eyebrow, { color: '#e1c39e' }]}>{slide.eyebrow} · {slide.tag}</Text>
          <Text accessibilityRole="header" style={[local.heroTitle, width < 350 && { fontSize: 34, lineHeight: 37 }]}>
            {slide.headline.replace(/\n/g, ' ')}{'\n'}<Text style={[editorialItalic, { color: '#e1c39e' }]}>{slide.accent}</Text>
          </Text>
          <Text style={[local.body, { color: '#ecf0e9', maxWidth: 520 }]}>{slide.sub}</Text>
          <View style={[styles.row, { gap: 16 }]}>
            <Pressable accessibilityRole="button" onPress={() => router.push('/shop')} style={({ pressed }) => [local.goldButton, { opacity: pressed ? 0.8 : 1 }]}>
              <Text style={{ color: colors.forest, fontFamily: font.bold, fontSize: 15 }}>Shop now →</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setVideo('nUNbUf1neL0')} style={local.textAction}>
              <Text style={{ color: colors.white, fontFamily: font.semibold, fontSize: 14 }}>▷ Our story</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {content.hero.map((item, index) => <Pressable key={item.eyebrow} accessibilityRole="button" accessibilityLabel={'Show ' + item.eyebrow}
              accessibilityState={{ selected: current === index }} onPress={() => setCurrent(index)} style={local.picker}>
              <View style={{ width: 24, height: 3, borderRadius: 2, backgroundColor: current === index ? '#e1c39e' : '#ffffff88' }} />
            </Pressable>)}
          </View>
        </View>
      </ImageBackground>

      <View style={[local.homeSection, { backgroundColor: colors.cream, paddingVertical: 16 }]}>
        <Grid columns={columns} gap={12} items={[...content.features]} keyOf={item => item.title} render={feature => <View style={{ gap: 4 }}>
          <Text style={[styles.subtitle, { fontSize: 14 }]}>{feature.title}</Text><Text style={[styles.muted, { fontSize: 12 }]}>{feature.desc}</Text>
        </View>} />
      </View>

      <View style={local.homeSection}>
        <Heading title="Shop by Category" text="Find your everyday favourites" />
        <ErrorBox message={resource.error} />
        {!!resource.error && <Button secondary title="Retry loading products" onPress={() => { void resource.refresh(); }} />}
        {resource.loading && !resource.data && <Loading />}
        {!!resource.data && <Grid columns={columns} items={resource.data.categories} keyOf={category => category._id} render={category => <CategoryImage category={category} />} />}
      </View>

      <View style={local.homeSection}>
        <Heading eyebrow="Handpicked for you" title="Featured Products" text="Top-rated organic produce from local farms" />
        <ProductGrid columns={columns} products={products.slice(0, 6)} />
        {resource.data && !products.length && <Empty text="No products are currently available." />}
        <Button secondary title="View all products" onPress={() => router.push('/shop')} />
      </View>

      <View style={local.homeSection}>
        <Heading title="Featured collections" />
        <ImageBackground source={siteImage(panel.img)} style={{ minHeight: 220, overflow: 'hidden', borderRadius: 16 }} resizeMode="cover">
          <View style={{ flex: 1, padding: 20, gap: 12, backgroundColor: '#040804bd', justifyContent: 'center', minHeight: 220 }}>
            <Text style={[local.eyebrow, { color: '#e1c39e' }]}>{panel.tag}</Text>
            <Text accessibilityRole="header" style={[local.heading, { color: colors.white }]}>{panel.headline.replace(/\n/g, ' ')}</Text>
            <Button secondary title={panel.cta} onPress={() => categoryShop(collection === 0 ? 'vegetable' : 'fruit')} />
          </View>
        </ImageBackground>
        <View style={styles.between}>
          <Text style={styles.muted}>{collection + 1} / {content.collections.length}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous collection" style={local.picker} onPress={() => setCollection(value => (value + content.collections.length - 1) % content.collections.length)}><View style={{ transform: [{ rotate: '180deg' }] }}><Icon name="chevron" color={colors.green} /></View></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Next collection" style={local.picker} onPress={() => setCollection(value => (value + 1) % content.collections.length)}><Icon name="chevron" color={colors.green} /></Pressable>
          </View>
        </View>
        <HomeAccordion key={panel.tag} title="About this collection"><Text style={local.body}>{panel.body}</Text><Button secondary icon="play" title="Watch video" onPress={() => setVideo(content.collectionVideos[collection])} /></HomeAccordion>
      </View>

      <View style={local.homeSection}>
        <Heading eyebrow="The Process" title="A Four-Step Promise." />
        {content.process.map(step => <HomeAccordion key={step.num} title={step.title} image={step.img} eyebrow={'Step ' + step.num}><Text style={local.body}>{step.desc}</Text></HomeAccordion>)}
      </View>

      <View style={[local.homeSection, { backgroundColor: colors.cream }]}>
        <Heading eyebrow="Farm to your table" title="Freshness, from the source." />
        <Button icon="play" title="Watch our farm story" onPress={() => setVideo('nUNbUf1neL0')} />
        <HomeAccordion title="How we bring you fresh produce">
          <Text style={local.body}>Every morning before dawn, our sourcing team is on the ground at partner farms across Sri Lanka. Watch how we maintain an unbroken cold chain from highland harvest to your doorstep — in under 24 hours.</Text>
          {content.promises.map(point => <Text key={point} style={local.body}>✓ {point}</Text>)}
          <Button secondary title="Our story" onPress={() => router.push('/about')} />
        </HomeAccordion>
      </View>

      <View style={local.homeSection}>
        <HomeAccordion title="Everyday freshness & cleanliness" image="https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=500&q=80">
          <Text style={styles.subtitle}>Everyday Fresh & Cleanliness</Text><Text style={local.body}>Experience daily freshness & impeccable cleanliness.</Text>
          <Image source={siteImage('https://images.unsplash.com/photo-1596368708356-6e1e1025ee72?auto=format&fit=crop&w=400&q=80')} style={{ width: '100%', height: 140, borderRadius: 12 }} resizeMode="cover" />
          <Text style={styles.subtitle}>Everyday Healthy & Cleanliness</Text><Button secondary title="Shop now" onPress={() => router.push('/shop')} />
        </HomeAccordion>
        <Heading eyebrow="Our heritage" title="Fresh Sri Lankan Food." />
        <HomeAccordion title="The traditional art of sourcing">
          <Text style={local.body}>For fifteen years, KBR Fresh Foods has operated on a single belief: that exceptional food begins with exceptional sourcing. Our three-pillar quality system ensures every product you receive is held to the highest standard in Sri Lanka.</Text>
          <Button secondary title="Read our full story" onPress={() => router.push('/about')} /><Button icon="play" title="Watch our sourcing story" onPress={() => setVideo('nUNbUf1neL0')} />
        </HomeAccordion>
        {content.pillars.map(pillar => <HomeAccordion key={pillar.num} title={pillar.title} image={pillar.img} eyebrow={'Pillar ' + pillar.num}><Text style={local.body}>{pillar.desc}</Text></HomeAccordion>)}
      </View>

      <View style={[local.homeSection, { backgroundColor: colors.lime }]}>
        <HomeAccordion title="Tropical Sri Lankan Fruits" image="/images/fruits.png" eyebrow="Authentic island flavours">
          <Text style={local.body}>Experience the true taste of Sri Lanka with our fresh selection of Ambul bananas, sweet TJC mangoes, and local papaws straight from our partner farms.</Text>
          <Text style={local.body}>✓ 100% Local Produce   ✓ Negombo Farm Fresh{'\n'}✓ Ayurvedic Benefits   ✓ Pesticide Free</Text>
          <Button title="Shop fruits →" onPress={() => categoryShop('fruit')} />
        </HomeAccordion>
      </View>

      <View style={local.homeSection}>
        <Heading title="Authentic Curry Essentials" text="Handpicked traditional Sri Lankan vegetables from Negombo's finest growers" />
        <ProductGrid columns={columns} products={products.slice(6, 12)} />
        <Button secondary title="Explore all" onPress={() => router.push('/shop')} />
      </View>

      <View style={{ backgroundColor: colors.forest }}><View style={local.homeSection}>
        <Text style={[local.eyebrow, { color: '#e1c39e' }]}>Customer stories</Text>
        <Text accessibilityLabel="Five star review" style={{ color: '#e1c39e', fontSize: 20 }}>★★★★★</Text>
        <Text style={[editorial, { color: colors.white, fontSize: 25, lineHeight: 32 }]}>“{testimonial.text}”</Text>
        <View style={[styles.row, { flexWrap: 'nowrap' }]}><Image source={siteImage(testimonial.img)} style={{ height: 44, width: 44, borderRadius: 22 }} /><View style={{ flex: 1 }}><Text style={[styles.subtitle, { color: colors.white }]}>{testimonial.name}</Text><Text style={[styles.muted, { color: '#c4d4c4' }]}>{testimonial.role}</Text></View></View>
        <Button secondary title="Next customer story →" onPress={() => setReview(value => (value + 1) % content.reviews.length)} />
      </View></View>

      <View style={local.homeSection}>
        <Heading title="Frequently Asked Questions" />
        {content.faqs.map(item => <HomeAccordion key={item.title} title={item.title}><Text style={local.body}>{item.body}</Text></HomeAccordion>)}
      </View>

      <View style={local.homeSection}>
        <Heading title="Fresh Blog Updates" text="Tips, recipes, and news from our organic community" />
        {content.blog.map(post => <HomeAccordion key={post.id} title={post.title} image={post.image} eyebrow={post.category}>
          <Text style={styles.muted}>{post.date}</Text><Text style={local.body}>{post.excerpt}</Text><Button secondary title="Read Article" onPress={() => { void action.run(() => Linking.openURL(SITE_URL)); }} />
        </HomeAccordion>)}
      </View>

      <View style={local.homeSection}>
        <HomeAccordion title="Get fresh organic updates weekly!">
          <Text style={local.body}>Subscribe to our newsletter for exclusive discounts, new product alerts, and healthy recipes.</Text>
          <Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Button title="Subscribe" disabled={!/^\S+@\S+\.\S+$/.test(email.trim())} onPress={() => { void action.run(() => Linking.openURL('mailto:info@kbrfreshfoods.lk?subject=' + encodeURIComponent('Newsletter subscription') + '&body=' + encodeURIComponent('Please add ' + email.trim() + ' to the KBR Fresh Foods newsletter.'))); }} />
          <Text style={styles.muted}>Opens your email app with a subscription request to our team. We respect your privacy.</Text>
        </HomeAccordion>
        <ErrorBox message={action.error} />
      </View>
      <HomeFooter />
    </ScrollView>
    <VideoModal id={video} close={() => setVideo(null)} />
  </SafeAreaView>;
}
