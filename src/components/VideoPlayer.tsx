import { WebView } from 'react-native-webview';
export default function VideoPlayer({ id }: { id: string }) {
  return <WebView source={{ uri: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&playsinline=1' }} allowsFullscreenVideo allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} style={{ flex: 1, backgroundColor: '#000' }} />;
}
