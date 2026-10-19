import * as Location from 'expo-location';

/** Current device coordinates for a delivery address. Throws a readable message when unavailable. */
export async function currentCoordinates() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission was not granted. Allow location access in Settings, or enter the coordinates manually.');
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: Number(position.coords.latitude.toFixed(6)), lng: Number(position.coords.longitude.toFixed(6)) };
}
