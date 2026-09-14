import type { PixelIconName } from './pixel-icon'

export type { PixelIconName } from './pixel-icon'

// Drawn on a 24 px grid for the harbor console. Keep display sizes at 24 / 48 / 72 px.
export default function HarborPixelIcon({ name, size = 48 }: { name: PixelIconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" shapeRendering="crispEdges" aria-hidden="true" className="pixel-icon">
    {name === 'agent' && <>
      <path d="M4 3h17v2h2v17h-2v2H4v-2H2V6h2z" fill="#172d39" />
      <path d="M3 2h17v2h2v17h-2v2H3v-2H1V5h2z" fill="#335766" />
      <path d="M4 3h15v1H4zM2 5h2v15H2z" fill="#87a3a8" />
      <path d="M5 4h3v2h2v2h4V6h2V4h3v3h1v11h-2v2H6v-1H4V8h1z" fill="#142f40" />
      <path d="M6 5h1v2h2v3h6V8h2V6h1v5h1v6h-2v2H7v-1H5V9h1z" fill="#fff0ca" />
      <path d="M6 7h1v3H6zM17 8h1v3h-2V9h1z" fill="#d59d8c" />
      <path d="M5 15h1v2h2v1h9v-1h2v1h-2v2H7v-1H5z" fill="#cbb78e" />
      <path d="M8 12h2v3H8zM15 12h2v3h-2zM12 16h2v1h-2z" fill="#203e50" />
      <path d="M7 15h1v1H7zM17 15h1v1h-1z" fill="#deb1a0" />
      <path d="M5 21h14v1H5zM20 5h1v14h-1z" fill="#1b3847" />
    </>}
    {name === 'explorer' && <>
      <path d="M9 2h7v1h4v2h2v4h1v8h-2v3h-3v2h-5v1H8v-2H5v-2H3v-4H2V9h2V5h3V3h2z" fill="#172e3a" />
      <path d="M8 1h7v1h4v2h2v3h1v9h-1v3h-3v2h-4v1H8v-1H5v-2H3v-3H2V7h1V4h3V2h2z" fill="#284958" />
      <path d="M8 3h7v1h3v2h2v3h1v6h-2v3h-3v2H8v-1H5v-3H4V8h1V5h3z" fill="#6f94a0" />
      <path d="M8 3h5v1H8zM5 5h3v1H5zM4 8h1v6H4zM6 4h2v1H6z" fill="#b6c8ba" />
      <path d="M15 4h2v2h2v3h1v6h-2v3h-3v2H9v-1h6v-2h2v-3h1V9h-1V6h-2z" fill="#496d7e" />
      <path d="M10 3h1v2H9v3H8v8h1v3h2v2H9v-1H8v-3H7V7h1V4h2zM13 3h1v1h2v3h1v10h-1v3h-2v1h-1v-2h2v-3h1V8h-1V5h-2z" fill="#294b5c" />
      <path d="M3 10h18v2H3zM5 5h3v1h8V5h3v2h-3v1H8V7H5zM4 15h4v1h8v-1h4v2h-4v1H8v-1H4zM11 2h2v19h-2z" fill="#254654" />
      <path d="M9 3h2v1H9zM13 3h1v1h-1zM4 9h2v1H4z" fill="#c8d1b9" />
    </>}
    {name === 'music' && <>
      <path d="M9 6h5V4h7V2h2v17h-2v3h-6v-1h-2v-4h2v-2h3V9h-6v11h-2v3H4v-1H2v-4h2v-2h4V7h1z" fill="#142e3b" />
      <path d="M8 5h5V3h7V1h2v17h-2v3h-6v-1h-2v-4h2v-2h4V8h-7v11H9v3H3v-1H1v-4h2v-2h4V6h1z" fill="#315565" />
      <path d="M8 6h2v10H8zM10 5h4V4h6V3h1v3h-7v2h-4zM19 8h2v8h-2z" fill="#aab4a0" />
      <path d="M9 6h1v8H9zM14 4h5v1h-5zM3 17h4v2H3zM14 16h4v2h-4z" fill="#f0d8a9" />
      <path d="M3 19h4v1H3zM14 18h4v1h-4zM10 8h1v10h-1zM20 7h1v8h-1z" fill="#65818a" />
      <path d="M7 16h2v3H7zM18 15h2v3h-2z" fill="#1b3949" />
    </>}
    {name === 'notes' && <>
      <path d="M5 2h17v20H5v2H2V5h3z" fill="#182f3b" />
      <path d="M3 1h17v20H3v2H1V3h2z" fill="#325361" />
      <path d="M4 2h15v18H4z" fill="#e0c59b" />
      <path d="M5 3h13v15H5z" fill="#f9e9c6" />
      <path d="M5 3h13v1H5zM5 4h1v13H5z" fill="#fff4d8" />
      <path d="M18 4h1v15h-1zM5 18h13v1H5z" fill="#b89e7d" />
      <path d="M7 6h9v2H7zM7 10h9v1H7zM7 13h9v1H7zM7 16h6v1H7z" fill="#3e6273" />
      <path d="M2 5h1v16H2zM4 21h15v1H4zM20 4h1v17h-1z" fill="#70909a" />
    </>}
    {name === 'settings' && <>
      <path d="M10 2h6v3h3V4h3v5h2v7h-3v5h-4v3h-7v-3H6v1H3v-5H1v-7h3V6h3V4h3z" fill="#152e3a" />
      <path d="M9 1h6v3h3V3h3v5h2v7h-3v5h-4v3H9v-3H5v1H2v-5H0V9h3V5h3V3h3z" fill="#2d4d5a" />
      <path d="M10 2h4v4h4V5h2v4h2v5h-4v4h-4v4h-4v-4H6v1H3v-4H1v-4h4V6h3V5h2z" fill="#81919a" />
      <path d="M10 2h4v2h-4zM6 5h2v3H5v3H2v3H1v-3h3V8h1V6h1zM18 5h2v3h-2z" fill="#edc995" />
      <path d="M20 10h2v4h-4v4h-4v4h-4v-2h3v-4h4v-4h3zM3 16h2v3H3z" fill="#526b79" />
      <path d="M9 7h6v1h2v2h1v5h-2v2h-6v-1H8v-2H7V9h2z" fill="#203e4e" />
      <path d="M10 8h4v1h2v2h1v3h-2v2h-5v-2H8v-4h2z" fill="#e6ceaa" />
      <path d="M11 10h3v1h1v3h-4v-1h-1v-2h1z" fill="#334f60" />
      <path d="M10 8h4v1h-4zM9 9h1v3H9z" fill="#fff0c9" />
    </>}
    {name === 'sponsor' && <>
      <path fillRule="evenodd" d="M9 2h7v1h4v3h2v3h2v7h-2v4h-3v2h-4v2H9v-2H5v-2H3v-4H1V9h2V5h3V3h3zM10 9v1H9v5h1v2h5v-1h2v-6h-2V9z" fill="#182f3b" />
      <path fillRule="evenodd" d="M8 1h7v1h4v3h2v3h2v7h-2v4h-3v2h-4v2H8v-2H4v-2H2v-4H0V8h2V4h3V2h3zM9 8v1H8v5h1v2h5v-1h2V9h-2V8z" fill="#3a5661" />
      <path fillRule="evenodd" d="M8 2h7v1h3v3h2v3h2v6h-2v3h-3v2h-3v2H8v-2H5v-2H3v-4H1V9h2V5h3V3h2zM9 7H8v1H7v7h1v2h7v-1h2V8h-2V7z" fill="#ddc9a1" />
      <path d="M8 2h7v1H8zM6 3h2v2H5v3H3v5H2V9h1V5h3zM6 18h2v2H6z" fill="#fff0c6" />
      <path d="M18 6h2v3h2v6h-2v3h-3v2h-3v2H8v-2h5v-2h3v-2h2z" fill="#aa9577" />
      <path d="M9 2h5v5H9zM1 9h6v5H1zM17 9h5v5h-5zM9 17h5v5H9z" fill="#355465" />
      <path d="M9 2h5v1H9zM1 9h2v5H1zM17 9h2v5h-2zM9 17h5v1H9z" fill="#809aa0" />
    </>}
    {name === 'about' && <>
      <path d="M4 2h18v16h-2v2h3v3H2v-3h5v-2H2V4h2z" fill="#162f3c" />
      <path d="M3 1h17v16H3zM8 17h9v3H8zM2 20h20v2H2z" fill="#486b7b" />
      <path d="M4 2h15v1H4zM3 3h1v13H3zM3 20h17v1H3z" fill="#d5c8a9" />
      <path d="M5 4h13v10H5z" fill="#172f3d" />
      <path d="M8 5h2v2h3V5h2v3h1v4h-2v1h-4v-1H7V8h1z" fill="#f4e6be" />
      <path d="M8 6h1v2H8zM14 6h1v2h-1z" fill="#d7a89a" />
      <path d="M9 9h1v2H9zM13 9h1v2h-1zM11 12h1v1h-1z" fill="#29485b" />
      <path d="M5 15h10v1H5zM6 21h2v1H6zM10 21h2v1h-2zM14 21h2v1h-2z" fill="#8199a0" />
      <path d="M17 15h1v1h-1z" fill="#efbc79" />
    </>}
    {name === 'home' && <>
      <path d="M12 2h2v2h2v2h2V3h3v7h2v2h1v3h-3v8H4v-8H1v-3h2v-2h2V8h2V6h2V4h3z" fill="#173440" />
      <path d="M11 1h2v2h2v2h2V2h3v7h2v2h1v3h-3v8H3v-8H0v-3h2V9h2V7h2V5h2V3h3z" fill="#365867" />
      <path d="M11 3h2v2h2v2h2v2h2v2h2v1H2v-1h2V9h2V7h2V5h3z" fill="#72909a" />
      <path d="M11 3h2v1h-2zM8 5h3v1H8zM6 7h2v1H6zM4 9h2v1H4z" fill="#d5ccb1" />
      <path d="M5 13h13v8H5z" fill="#ead4ad" />
      <path d="M5 13h13v1H5zM5 14h1v6H5z" fill="#fff0c8" />
      <path d="M13 16h3v5h-3zM7 15h4v4H7z" fill="#355768" />
      <path d="M8 16h2v2H8z" fill="#8dacb4" />
      <path d="M17 14h1v7h-1zM6 20h6v1H6z" fill="#c2a983" />
    </>}
    {name === 'our-space' && <>
      <path d="M2 8h2V5h3v3h2V5h3v3h1v11H2zM12 8h2V5h3v3h2V5h3v14H12z" fill="#35463f" />
      <path d="M3 9h8v9H3zM4 6h2v4H4zM9 6h2v4H9z" fill="#eee4bd" />
      <path d="M13 9h8v9h-8zM14 6h2v4h-2zM19 6h2v4h-2z" fill="#a7b6a1" />
      <path d="M4 11h1v2H4zM9 11h1v2H9zM14 11h1v2h-1zM19 11h1v2h-1zM6 14h2v1H6zM16 14h2v1h-2z" fill="#35463f" />
      <path d="M8 17h3v1h2v-1h3v3h-1v1h-1v1h-4v-1H9v-1H8z" fill="#956f62" />
      <path d="M9 18h2v1h2v-1h2v2h-1v1h-4v-1H9z" fill="#cfac8b" />
    </>}
  </svg>
}
