export default function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <p className="text-center text-sm text-gray-600">
          © {new Date().getFullYear()} Nekovccat App. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

