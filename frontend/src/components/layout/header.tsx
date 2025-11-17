'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/my-world', label: 'My World' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <header className="bg-white relative">
      <div className="px-[37px] py-[57px]">
        {/* 移动端：汉堡菜单 */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden flex flex-col gap-[4px] cursor-pointer"
          aria-label="菜单"
        >
          <span className="w-[35px] h-[6px] bg-[#D9D9D9] block"></span>
          <span className="w-[35px] h-[6px] bg-[#D9D9D9] block"></span>
          <span className="w-[35px] h-[6px] bg-[#D9D9D9] block"></span>
        </button>

        {/* 移动端：菜单面板 */}
        {isMenuOpen && (
          <nav className="md:hidden absolute top-[70px] left-[37px] bg-white border border-gray-200 rounded shadow-lg p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-gray-600 hover:text-gray-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Web端：导航链接 */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative group px-4 py-2"
              >
                <span className="relative z-10 text-black transition-colors duration-200 group-hover:text-white">
                  {item.label}
                </span>
                {/* 悬停时的圆角按钮背景 - 只在悬停时显示 */}
                <span
                  className="absolute inset-0 rounded-[50px] bg-black transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                />
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

