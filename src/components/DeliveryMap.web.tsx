import { Text, View } from 'react-native';
import Icon from './Icon';
import { colors, styles } from './ui';
export default function DeliveryMap({ lat, lng }: { lat: number; lng: number; title?: string }) {
  return <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: colors.lime }}><Icon name="pin" size={20} color={colors.green} /><Text style={[styles.muted, { flex: 1 }]}>{lat.toFixed(5)}, {lng.toFixed(5)}</Text></View>;
}
