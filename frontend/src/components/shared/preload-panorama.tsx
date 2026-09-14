/** Discover the small poster in the server HTML; the full texture loads only when needed. */
export default function PreloadPanorama({ imageSrc }: { imageSrc: string }) {
  return <link rel="preload" as="image" type="image/webp" href={imageSrc} fetchPriority="high" />
}
