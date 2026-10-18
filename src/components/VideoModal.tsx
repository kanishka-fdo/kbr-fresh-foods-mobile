import { Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VideoPlayer from './VideoPlayer';
import { Button, styles } from './ui';
export default function VideoModal({ id, close }: { id: string | null; close: () => void }) {
  return <Modal visible={!!id} animationType="slide" onRequestClose={close}><SafeAreaView style={{ flex: 1, backgroundColor: '#0d1f0d', padding: 18, gap: 18 }}><Text style={[styles.subtitle, { color: '#fff' }]}>KBR Fresh Foods — Our story</Text><View style={{ flex: 1 }}>{id && <VideoPlayer id={id} />}</View><Button secondary title="Close video" onPress={close} /></SafeAreaView></Modal>;
}
