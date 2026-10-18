export default function VideoPlayer({ id }: { id: string }) {
  return <iframe title="KBR Fresh Foods video" src={'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&playsinline=1'} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{ width: '100%', height: '100%', border: 0, background: '#000' }} />;
}
