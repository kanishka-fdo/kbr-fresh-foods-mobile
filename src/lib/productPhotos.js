/**
 * Fallback photo lookup — all Unsplash real photos, no 3D/animated/Wikimedia.
 * Keys are lowercase partial name matches.
 */
const PRODUCT_PHOTOS = {
  // === BANANA VARIETIES ===
  'banana sour':       'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=600&fit=crop&auto=format',
  'banana kk':         'https://images.unsplash.com/photo-1528825871115-3581a5387915?w=600&fit=crop&auto=format',
  'banana red':        'https://images.unsplash.com/photo-1634467524884-897d0af5e104?w=600&fit=crop&auto=format',
  'banana sweet':      'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=600&fit=crop&auto=format',
  'banana green':      'https://images.unsplash.com/photo-1576088899849-514d232585f0?w=600&fit=crop&auto=format',
  'banana blossom':    'https://images.unsplash.com/photo-1612479536859-90d56b001d67?w=600&fit=crop&auto=format',
  'banana':            'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=600&fit=crop&auto=format',
  'puwalu':            'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=600&fit=crop&auto=format',
  'cavendish':         'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=600&fit=crop&auto=format',

  // === FRUIT ===
  'melon rocky':       'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=600&fit=crop&auto=format',
  'melon tornaa':      'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&fit=crop&auto=format',
  'melon':             'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=600&fit=crop&auto=format',
  'mango':             'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&fit=crop&auto=format',
  'sour sop':          'https://images.unsplash.com/photo-1623228943755-1f9b9a96afc4?w=600&fit=crop&auto=format',
  'soursop':           'https://images.unsplash.com/photo-1623228943755-1f9b9a96afc4?w=600&fit=crop&auto=format',
  'custard apple':     'https://images.unsplash.com/photo-1560015534-cee980ba7e13?w=600&fit=crop&auto=format',
  'casted apple':      'https://images.unsplash.com/photo-1560015534-cee980ba7e13?w=600&fit=crop&auto=format',
  'wood apple':        'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=600&fit=crop&auto=format',
  'passion fruit':     'https://images.unsplash.com/photo-1610486893699-b1d5bf5952db?w=600&fit=crop&auto=format',
  'pittu kekiri':      'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=600&fit=crop&auto=format',
  'pomegranate':       'https://images.unsplash.com/photo-1615486171448-4fb003759ace?w=600&fit=crop&auto=format',
  'papaw':             'https://images.unsplash.com/photo-1517282009859-f000ef1b4395?w=600&fit=crop&auto=format',
  'papaya':            'https://images.unsplash.com/photo-1517282009859-f000ef1b4395?w=600&fit=crop&auto=format',

  // === VEGETABLE ===
  'brinjal':           'https://images.unsplash.com/photo-1601646736222-38666324db00?w=600&fit=crop&auto=format',
  'eggplant':          'https://images.unsplash.com/photo-1601646736222-38666324db00?w=600&fit=crop&auto=format',
  'beans long':        'https://images.unsplash.com/photo-1596706927552-32a76f2b0928?w=600&fit=crop&auto=format',
  'beans':             'https://images.unsplash.com/photo-1596706927552-32a76f2b0928?w=600&fit=crop&auto=format',
  'drumstick':         'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&fit=crop&auto=format',
  'lime':              'https://images.unsplash.com/photo-1590502593747-42a996111139?w=600&fit=crop&auto=format',
  'thibbatu':          'https://images.unsplash.com/photo-1596647907572-10f769d0387b?w=600&fit=crop&auto=format',
  'chili':             'https://images.unsplash.com/photo-1596647907572-10f769d0387b?w=600&fit=crop&auto=format',
  'tomato':            'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&fit=crop&auto=format',
  'nai miris':         'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&fit=crop&auto=format',

  // === RICE ===
  'red rice':          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&fit=crop&auto=format',
  'white rice':        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&fit=crop&auto=format',
  'samba':             'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&fit=crop&auto=format',
  'keeri samba':       'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&fit=crop&auto=format',
  'nadu':              'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&fit=crop&auto=format',
  'basmati':           'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&fit=crop&auto=format',
  'rice':              'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&fit=crop&auto=format',

  // === OTHERS ===
  'eithral':           'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&fit=crop&auto=format',
  'kuruluthuda':       'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&fit=crop&auto=format',
};

// Category fallback — real Unsplash photos only
const CATEGORY_FALLBACK = {
  Banana:    'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=600&fit=crop&auto=format',
  Fruit:     'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&fit=crop&auto=format',
  Vegetable: 'https://images.unsplash.com/photo-1598046937895-25e24c297cb7?w=600&fit=crop&auto=format',
  OTHERS:    'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&fit=crop&auto=format',
  fruit:     'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&fit=crop&auto=format',
  vegetable: 'https://images.unsplash.com/photo-1598046937895-25e24c297cb7?w=600&fit=crop&auto=format',
  other:     'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&fit=crop&auto=format',
};

/**
 * Return the best matching Unsplash photo URL for a product by name.
 */
export function getProductPhoto(name = '', categoryType = 'other') {
  const lower = name.toLowerCase().trim();

  for (const [key, url] of Object.entries(PRODUCT_PHOTOS)) {
    if (lower.includes(key)) return url;
  }

  return CATEGORY_FALLBACK[categoryType] || CATEGORY_FALLBACK.Fruit;
}
