import PageLayout from '@/components/layout/page-layout'

export default function About() {
  return (
    <PageLayout use3DBackground={false} textColor="black">
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-3xl">
          <h1 
            className="text-[96px] font-normal leading-[1em] text-center text-black mb-8"
            style={{
              fontFamily: '"Jersey 25", system-ui, -apple-system, sans-serif',
            }}
          >
            About
          </h1>
          <div className="text-lg text-gray-700 space-y-4">
            <p>
              Welcome to my world. This is a space where creativity meets technology.
            </p>
            <p>
              Here you&apos;ll find stories, ideas, and projects that inspire.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

