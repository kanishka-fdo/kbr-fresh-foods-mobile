import MapView, { Marker } from 'react-native-maps';
import { View } from 'react-native';
export default function DeliveryMap({ lat, lng }: { lat: number; lng: number }) {
  return <View style={{ height: 240, borderRadius: 18, overflow: 'hidden' }}><MapView style={{ flex: 1 }} initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.04, longitudeDelta: 0.04 }}><Marker coordinate={{ latitude: lat, longitude: lng }} title="Delivery destination" /></MapView></View>;
}
