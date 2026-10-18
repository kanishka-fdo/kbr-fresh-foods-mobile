import { useLocalSearchParams } from 'expo-router';
import { CatalogScreen } from '../../screens/Shop';
export default function Shop() { const { category } = useLocalSearchParams<{ category?: string }>(); return <CatalogScreen key={category || 'all'} initialCategory={category || ''} />; }
