import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-700">页面未找到</h2>
        <p className="mt-2 text-gray-600">抱歉，您访问的页面不存在。</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}

