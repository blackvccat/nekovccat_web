import PageLayout from '@/components/layout/page-layout'
import PreloadPanorama from '@/components/shared/preload-panorama'
import panorama from '../../public/images/panorama-assets.json'

export default function Home() {
  // Content hashes allow immutable caching while keeping later asset updates safe.
  const panoramaImage = panorama.desktop.src
  const panoramaMobileImage = panorama.mobile.src
  const panoramaPoster = panorama.preview.src

  return (
    <>
      <PreloadPanorama imageSrc={panoramaPoster} />
      <link rel="preload" as="font" type="font/woff2" href="/fonts/jersey-25-latin-400-normal.woff2" crossOrigin="anonymous" />
      <PageLayout 
        panoramaImage={panoramaImage}
        panoramaMobileImage={panoramaMobileImage}
        panoramaPoster={panoramaPoster}
        enablePanoramaInteraction={true} // 启用鼠标拖动查看全景图
        enablePanoramaAutoRotate={true} // 启用自动旋转（30秒一圈）
        panoramaRotateSpeed={12} // 旋转速度：12度/秒 = 30秒一圈
        textColor="white"
      >
        <h1 
          className="mx-auto max-w-6xl text-[clamp(2.5rem,8vw,6rem)] font-normal leading-[1.05] text-balance text-center text-white drop-shadow-lg"
          style={{
            fontFamily: '"Jersey 25", system-ui, -apple-system, sans-serif',
          }}
        >
          Welcome to my world web by neko
        </h1>
      </PageLayout>
    </>
  )
}
