import { Text } from 'react-native';
import { styles } from './ui';
export default function DeliveryMap({ lat, lng }: { lat: number; lng: number }) {
  return <Text style={styles.muted}>Destination: {lat.toFixed(5)}, {lng.toFixed(5)}. Use Open directions to view the map.</Text>;
}
