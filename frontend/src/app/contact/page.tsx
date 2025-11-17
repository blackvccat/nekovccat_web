import PageLayout from '@/components/layout/page-layout'

export default function Contact() {
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
            Contact
          </h1>
          <div className="text-lg text-gray-700 space-y-4">
            <p>
              Get in touch with me.
            </p>
            <p>
              I&apos;d love to hear from you.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

