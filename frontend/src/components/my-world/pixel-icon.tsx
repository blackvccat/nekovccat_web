export type PixelIconName = 'agent' | 'explorer' | 'music' | 'notes' | 'settings' | 'about' | 'home' | 'our-space' | 'sponsor'

export default function PixelIcon({ name, size = 36 }: { name: PixelIconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" shapeRendering="crispEdges" aria-hidden="true" className="pixel-icon">
    {name === 'agent' && <>
      <path d="M3 3h18v15H3zM7 18h10v3H7zM5 21h14v1H5z" fill="#283b43" />
      <path d="M4 4h16v12H4z" fill="#d9e4b0" /><path d="M5 5h14v10H5z" fill="#99b08c" />
      <path d="M8 7V5h2v2h4V5h2v2h1v6H7V7z" fill="#f8edd1" /><path d="M9 9h1v2H9zM14 9h1v2h-1zM11 12h2v1h-2z" fill="#293c42" />
      <path d="M4 17h14v1H4z" fill="#e9dbb7" /><path d="M19 17h1v1h-1z" fill="#90bb6a" />
    </>}
    {name === 'explorer' && <>
      <path d="M2 3h20v18H2z" fill="#3f5148" /><path d="M3 4h18v16H3z" fill="#eee5c5" /><path d="M3 4h18v4H3z" fill="#778e83" /><path d="M5 5h2v2H5zM9 5h10v2H9z" fill="#ecebd2" /><path d="M5 10h6v8H5z" fill="#bccaa0" /><path d="M13 10h6v1h-6zM13 13h6v1h-6zM13 16h4v1h-4z" fill="#879878" />
    </>}
    {name === 'sponsor' && <>
      <path d="M6 2h12v2h3v3h2v12h-3v3H4v-3H1V7h2V4h3z" fill="#5a563c" /><path d="M6 4h12v2h3v12h-3v2H5v-2H3V7h3z" fill="#debf76" /><path d="M7 7h3v2h4V7h3v7h-2v2h-2v2h-2v-2H9v-2H7z" fill="#947360" /><path d="M7 5h10v1H7zM4 8h1v8H4z" fill="#f6e2a9" />
    </>}
    {name === 'notes' && <>
      <path d="M4 2h13l4 4v16H4z" fill="#515847" /><path d="M5 3h11v5h4v13H5z" fill="#f4e9b6" /><path d="M16 3v4h4z" fill="#bfb987" />
      <path d="M7 10h10v1H7zM7 13h10v1H7zM7 16h7v1H7z" fill="#aaa782" /><path d="M3 5h3v1H3zM3 9h3v1H3zM3 13h3v1H3zM3 17h3v1H3z" fill="#71776a" />
    </>}
    {name === 'music' && <>
      <path d="M3 4h18v2h1v15H2V6h1z" fill="#354641" />
      <path d="M3 6h18v14H3z" fill="#bc886f" /><path d="M4 7h16v8H4z" fill="#efe6bf" />
      <path d="M5 10h14v4H5z" fill="#53655c" /><path d="M6 10h3v3H6zM15 10h3v3h-3z" fill="#d9dfb7" />
      <path d="M10 11h4v1h-4z" fill="#b3bc9c" /><path d="M7 17h10l2 3H5z" fill="#e4c69b" />
      <path d="M5 8h10v1H5zM4 18h1v1H4zM19 18h1v1h-1z" fill="#5c6b52" />
    </>}
    {name === 'settings' && <>
      <path d="M9 2h6v3h3V4h2v4h2v7h-3v3h1v2h-5v2H9v-3H6v1H4v-5H2V9h3V6H4V4h5z" fill="#394649" />
      <path d="M10 3h4v3h4v3h3v5h-3v4h-4v3h-4v-3H6v-4H3v-4h3V6h4z" fill="#9ea9a0" />
      <path d="M9 8h6v1h1v6h-1v1H9v-1H8V9h1z" fill="#e6e6cd" /><path d="M10 10h4v4h-4z" fill="#435957" />
    </>}
    {name === 'our-space' && <>
      <path d="M2 8h2V5h3v3h2V5h3v3h1v11H2zM12 8h2V5h3v3h2V5h3v14H12z" fill="#35463f" />
      <path d="M3 9h8v9H3zM4 6h2v4H4zM9 6h2v4H9z" fill="#eee4bd" />
      <path d="M13 9h8v9h-8zM14 6h2v4h-2zM19 6h2v4h-2z" fill="#a7b6a1" />
      <path d="M4 11h1v2H4zM9 11h1v2H9zM14 11h1v2h-1zM19 11h1v2h-1zM6 14h2v1H6zM16 14h2v1h-2z" fill="#35463f" />
      <path d="M8 17h3v1h2v-1h3v3h-1v1h-1v1h-4v-1H9v-1H8z" fill="#956f62" />
      <path d="M9 18h2v1h2v-1h2v2h-1v1h-4v-1H9z" fill="#cfac8b" />
    </>}
    {name === 'about' && <>
      <path d="M2 3h20v15H2zM8 18h8v3H8zM5 21h14v1H5z" fill="#394749" /><path d="M3 4h18v13H3z" fill="#ded9bd" /><path d="M5 6h14v9H5z" fill="#779c96" /><path d="M11 7h2v2h-2zM10 10h3v3h1v1h-4v-1h1v-2h-1z" fill="#f3ecd4" /><path d="M18 16h2v1h-2z" fill="#6b9762" />
    </>}
    {name === 'home' && <><path d="M11 2h2v2h2v2h2v2h2v2h3v3h-3v9H5v-9H2v-3h3V8h2V6h2V4h2z" fill="#374b4a" /><path d="M7 11h10v10H7z" fill="#ede0b6" /><path d="M10 15h4v6h-4z" fill="#8a9c86" /><path d="M8 11h8v2H8z" fill="#c29972" /></>}
  </svg>
}
