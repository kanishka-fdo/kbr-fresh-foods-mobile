import MapView, { Marker } from 'react-native-maps';
import { Platform, Text, View } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import Icon from './Icon';
import { colors, styles } from './ui';

// Google Maps on Android aborts without an API key. Expo Go ships its own key; custom builds need EXPO_PUBLIC_ANDROID_MAPS_API_KEY.
const mapsAvailable = Platform.OS !== 'android' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient || !!process.env.EXPO_PUBLIC_ANDROID_MAPS_API_KEY;

export default function DeliveryMap({ lat, lng, title = 'Delivery destination' }: { lat: number; lng: number; title?: string }) {
  if (!mapsAvailable) return <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: colors.lime }}><Icon name="pin" size={20} color={colors.green} /><Text style={[styles.muted, { flex: 1 }]}>{lat.toFixed(5)}, {lng.toFixed(5)}</Text></View>;
  return <View style={{ height: 200, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.field }}><MapView style={{ flex: 1 }} initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false} toolbarEnabled={false}><Marker coordinate={{ latitude: lat, longitude: lng }} title={title} /></MapView></View>;
}
