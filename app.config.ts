import type { ConfigContext, ExpoConfig } from 'expo/config';
export default ({ config }: ConfigContext): ExpoConfig => {
  const mapKey = process.env.EXPO_PUBLIC_ANDROID_MAPS_API_KEY;
  return {
    ...config,
    name: config.name || 'KBR Fresh Foods',
    slug: config.slug || 'kbr-fresh-foods',
    plugins: [...(config.plugins || []), ...(mapKey ? [['react-native-maps', { androidGoogleMapsApiKey: mapKey }] as [string, { androidGoogleMapsApiKey: string }]] : [])],
  };
};
