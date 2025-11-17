import PageLayout from '@/components/layout/page-layout'
import PreloadPanorama from '@/components/shared/preload-panorama'

export default function Home() {
  // 使用全景图作为背景
  // 使用 public/images/9.png 作为全景图
  const panoramaImage = '/images/9.png'

  return (
    <>
      <PreloadPanorama imageSrc={panoramaImage} />
      <PageLayout 
        panoramaImage={panoramaImage}
        enablePanoramaInteraction={true} // 启用鼠标拖动查看全景图
        enablePanoramaAutoRotate={true} // 启用自动旋转（30秒一圈）
        panoramaRotateSpeed={12} // 旋转速度：12度/秒 = 30秒一圈
        textColor="white"
      >
        <h1 
          className="text-[96px] font-normal leading-[1em] text-center text-white drop-shadow-lg"
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
