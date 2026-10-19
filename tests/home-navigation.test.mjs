import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import React from 'react';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const Redirect = () => null;
const Storefront = () => null;
const ui = {
  Button: 'Button', Card: 'Card', Choices: 'Choices', TextButton: 'TextButton', Empty: 'Empty', ErrorBox: 'ErrorBox', Field: 'Field', Grid: 'Grid', Loading: 'Loading', Screen: 'Screen',
  styles: { text: {} }, colors: { white: '#fff', green: '#176f3c', forest: '#0d1f0d', cream: '#faf7f2', muted: '#607469', border: '#e6e8e3' },
  font: { bold: 'Inter', regular: 'Inter', semibold: 'Inter' }, useAction: () => ({ run: operation => operation(), error: '' }),
};

// Run the actual route components with native views replaced by inert elements.
// This exercises navigation decisions without requiring an emulator or a backend.
function loadComponent(path, { user = null, loading = false, width = 390, fontScale = 1, resource = null, focused = true, state = [], native = {}, clock = {} } = {}) {
  const pushes = [];
  const operations = [];
  const requests = [];
  const effects = [];
  let stateIndex = 0;
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const content = require('../src/lib/site-content.ts').siteContent;
  const dependencies = {
    'react': { ...React, useState: initial => [stateIndex < state.length ? state[stateIndex++] : typeof initial === 'function' ? initial() : initial, () => {}], useRef: initial => ({ current: initial }), useEffect: effect => effects.push(effect) },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'react-native': { Image: 'Image', ImageBackground: 'ImageBackground', Pressable: 'Pressable', RefreshControl: 'RefreshControl', ScrollView: 'ScrollView', Text: 'Text', View: 'View', StyleSheet: { create: value => value }, useWindowDimensions: () => ({ width, fontScale }), Linking: { openURL: async () => {} }, ...native },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    'expo-router': { Redirect, router: { push: path => pushes.push(path), replace: path => pushes.push(path) } },
    'expo-router/react-navigation': { useIsFocused: () => focused },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    'react-native-svg': { __esModule: true, default: 'Svg', Defs: 'Defs', LinearGradient: 'LinearGradient', Rect: 'Rect', Stop: 'Stop' },
    '../components/ui': { ...ui, useAction: () => ({ run: operation => { const promise = Promise.resolve().then(operation); operations.push(promise); return promise; }, error: '' }) }, '../../components/ui': ui,
    '../components/WelcomePhotos': { default: 'WelcomePhotos', __esModule: true },
    '../components/Brand': { editorial: {}, editorialItalic: {} },
    '../components/Icon': { default: 'Icon', __esModule: true },
    '../components/VideoModal': { default: 'VideoModal', __esModule: true },
    '../components/ProductTile': { default: 'ProductTile', __esModule: true },
    '../context/AuthContext': { useAuth: () => ({ user, loading, signIn: async (...args) => requests.push(['signIn', ...args]) }) },
    '../../context/AuthContext': { useAuth: () => ({ user, loading }) },
    '../../screens/Storefront': { default: Storefront, __esModule: true },
    '../lib/site-assets': { siteImage: value => ({ uri: value }), SITE_URL: 'https://example.test' },
    '../lib/site-content': { siteContent: content },
    '../hooks/useResource': { useResource: () => ({ data: resource, loading: !resource, refreshing: false, error: '', refresh: async () => {} }) },
    '../lib/services': { categoryApi: {}, productApi: {}, authApi: { register: async payload => requests.push(['register', payload]) } },
  };
  const module = { exports: {} };
  runInNewContext(compiled, { ...clock, module, exports: module.exports, require: name => {
    if (!(name in dependencies)) throw new Error('Unexpected component dependency: ' + name);
    return dependencies[name];
  } });
  return { component: module.exports.default, exports: module.exports, pushes, operations, requests, effects };
}

function elements(tree) {
  if (!React.isValidElement(tree)) return [];
  return [tree, ...React.Children.toArray(tree.props.children).flatMap(elements)];
}

test('signed-out app entry opens the welcome screen before storefront content', () => {
  const { component } = loadComponent('../src/app/(tabs)/index.tsx');
  const element = component();
  assert.equal(element.type, Redirect);
  assert.equal(element.props.href, '/welcome');
});

test('session restoration finishes before choosing the first screen', () => {
  const { component } = loadComponent('../src/app/(tabs)/index.tsx', { loading: true });
  const tree = elements(component());
  assert.ok(tree.some(element => element.type === ui.Loading));
  assert.ok(!tree.some(element => element.type === Redirect || element.type === Storefront));
});

test('returning signed-in users open the homepage without another login', () => {
  const { component } = loadComponent('../src/app/(tabs)/index.tsx', { user: { _id: 'customer-1' } });
  assert.equal(component().type, Storefront);
});

test('welcome actions open the existing login and registration screens', () => {
  const { component, pushes } = loadComponent('../src/screens/Welcome.tsx');
  const buttons = elements(component()).filter(element => element.type === ui.Button);
  buttons.find(element => element.props.title === 'Log in').props.onPress();
  buttons.find(element => element.props.title === 'Sign up').props.onPress();
  assert.deepEqual(pushes, ['/login', '/register']);
});

test('a signed-in user following a welcome link returns home', () => {
  const { component } = loadComponent('../src/screens/Welcome.tsx', { user: { _id: 'customer-1' } });
  const element = component();
  assert.equal(element.type, Redirect);
  assert.equal(element.props.href, '/');
});

test('welcome only overrides status-bar colours while it is the active screen', () => {
  for (const focused of [true, false]) {
    const { component } = loadComponent('../src/screens/Welcome.tsx', { focused });
    const bars = elements(component()).filter(element => element.type === 'StatusBar');
    assert.equal(bars.length, focused ? 1 : 0);
    if (focused) assert.equal(bars[0].props.style, 'light');
  }
});

test('homepage search opens the existing Shop without changing its route contract', () => {
  const { component, pushes } = loadComponent('../src/screens/Storefront.tsx');
  const search = elements(component()).find(element => element.props.accessibilityLabel === 'Search products in the shop');
  search.props.onPress();
  assert.deepEqual(pushes, ['/shop']);
});

test('homepage cards keep two columns normally and reflow for large text', () => {
  for (const [width, fontScale, expected] of [[390, 1, 2], [320, 1, 1], [390, 1.6, 1]]) {
    const { component } = loadComponent('../src/screens/Storefront.tsx', { width, fontScale });
    const tree = elements(component());
    const productSections = tree.filter(element => typeof element.type === 'function' && element.type.name === 'ProductGrid');
    assert.equal(productSections.length, 2);
    for (const section of productSections) assert.equal(section.props.columns, expected);
  }
});

test('restyled sign-in keeps recovery and signup links and hides the resend card', () => {
  const { exports, pushes } = loadComponent('../src/screens/Auth.tsx');
  const tree = elements(exports.LoginScreen());
  assert.ok(!tree.some(element => element.props.title === 'Resend verification email'));
  tree.find(element => element.props.title === 'Forgot password?').props.onPress();
  tree.find(element => element.props.title === 'Sign up').props.onPress();
  assert.deepEqual(pushes, ['/forgot-password', '/register']);
});

test('sign-in still submits credentials and returns home', async () => {
  const { exports, requests, operations, pushes } = loadComponent('../src/screens/Auth.tsx', { state: ['buyer@example.com', 'secret123'] });
  elements(exports.LoginScreen()).find(element => element.props.title === 'Sign in').props.onPress();
  await Promise.all(operations);
  assert.deepEqual(requests, [['signIn', 'buyer@example.com', 'secret123']]);
  assert.deepEqual(pushes, ['/']);
});

test('signup preserves customer and wholesale fields, payloads, and verification redirect', async () => {
  for (const role of ['customer', 'wholesale']) {
    const form = { name: 'Buyer', email: 'buyer@example.com', phone: '0771234567', password: 'secret123', businessName: 'Fresh Shop', businessRegNo: '123' };
    const { exports, requests, operations, pushes } = loadComponent('../src/screens/Auth.tsx', { state: [form, role] });
    const tree = elements(exports.RegisterScreen());
    assert.equal(tree.filter(element => element.type === ui.Field).length, role === 'customer' ? 4 : 6);
    tree.find(element => element.props.title === 'Sign up').props.onPress();
    await Promise.all(operations);
    assert.deepEqual(JSON.parse(JSON.stringify(requests)), [['register', { ...form, role }]]);
    assert.deepEqual(pushes, ['/login']);
  }
});

test('invalid sign-in and signup still stop before calling authentication services', async () => {
  for (const screen of ['LoginScreen', 'RegisterScreen']) {
    const { exports, operations, requests } = loadComponent('../src/screens/Auth.tsx');
    const title = screen === 'LoginScreen' ? 'Sign in' : 'Sign up';
    elements(exports[screen]()).find(element => element.type === ui.Button && element.props.title === title).props.onPress();
    await assert.rejects(operations[0], /Enter your/);
    assert.deepEqual(requests, []);
  }
});

test('welcome rotates three photos every five seconds and releases timers when inactive', async () => {
  let tick;
  let delay;
  let appChanged;
  let motionChanged;
  let removed = 0;
  class Value {
    constructor(value) { this.value = value; }
    setValue(value) { this.value = value; }
  }
  const { component, effects } = loadComponent('../src/components/WelcomePhotos.tsx', {
    clock: { setInterval: (callback, milliseconds) => { tick = callback; delay = milliseconds; return 1; }, clearInterval: () => { tick = undefined; } },
    native: {
      Animated: { View: 'AnimatedView', Value,
        timing: (value, config) => ({ start: () => value.setValue(config.toValue) }),
        parallel: animations => ({ start: () => animations.forEach(animation => animation.start()), stop: () => {} }),
      },
      AppState: { currentState: 'active', addEventListener: (_, listener) => { appChanged = listener; return { remove: () => removed++ }; } },
      AccessibilityInfo: { isReduceMotionEnabled: async () => false, addEventListener: (_, listener) => { motionChanged = listener; return { remove: () => removed++ }; } },
    },
  });
  const tree = elements(component());
  const photos = tree.filter(element => element.type === 'Image');
  assert.equal(photos.length, 3);
  assert.equal(new Set(photos.map(photo => photo.props.source.uri)).size, 3);
  const values = tree.filter(element => element.type === 'AnimatedView').map(element => element.props.style[1].opacity);
  const selected = () => values.map(value => value.value);
  const dispose = effects[0]();
  await Promise.resolve();
  assert.equal(delay, 5000);
  assert.deepEqual(selected(), [1, 0, 0]);
  tick(); assert.deepEqual(selected(), [0, 1, 0]);
  tick(); assert.deepEqual(selected(), [0, 0, 1]);
  tick(); assert.deepEqual(selected(), [1, 0, 0]);
  appChanged('background'); assert.equal(tick, undefined);
  appChanged('active'); assert.equal(typeof tick, 'function');
  motionChanged(true); assert.equal(tick, undefined);
  motionChanged(false); assert.equal(typeof tick, 'function');
  dispose(); assert.equal(tick, undefined); assert.equal(removed, 2);
});

test('welcome photo rotation does not start behind another screen', () => {
  const { component, effects } = loadComponent('../src/components/WelcomePhotos.tsx', {
    focused: false, native: { Animated: { View: 'AnimatedView', Value: class {} } },
  });
  component();
  assert.equal(effects[0](), undefined);
});
