'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface RetroComputerProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
}

export default function RetroComputer({ 
  messages, 
  onSendMessage, 
  isLoading = false 
}: RetroComputerProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  // ESC 键清除输入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inputRef.current === document.activeElement) {
        setInput('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="w-full max-w-5xl h-[85vh] flex flex-col mx-auto">
      {/* 复古电脑屏幕框架 */}
      <div className="bg-gray-900 border-4 border-gray-700 rounded-lg shadow-2xl flex flex-col h-full relative overflow-hidden">
        {/* CRT 屏幕扫描线效果 */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-green-400/20 to-transparent animate-scan"></div>
        </div>
        {/* 屏幕顶部装饰 */}
        <div className="bg-gray-800 border-b-2 border-gray-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="font-mono text-green-400 text-xs">
            TERMINAL v1.0
          </div>
        </div>

        {/* 聊天消息区域 */}
        <div className="flex-1 overflow-y-auto bg-black p-6 font-mono text-green-400 text-sm relative z-10">
          <div className="space-y-2">
            {/* 欢迎消息 */}
            {messages.length === 0 && (
              <div className="text-green-400">
                <div className="mb-2">
                  {'>'} Welcome to My World Terminal
                </div>
                <div className="mb-2">
                  {'>'} Type your message and press ENTER to chat...
                </div>
                <div className="text-green-500">
                  {'>'} {'_'.repeat(50)}
                </div>
              </div>
            )}

            {/* 消息列表 */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${
                  message.role === 'user' ? 'text-cyan-400' : 'text-green-400'
                }`}
              >
                <div className="mb-1">
                  {message.role === 'user' ? (
                    <span className="text-yellow-400">{'>'} USER:</span>
                  ) : (
                    <span className="text-green-500">{'>'} AGENT:</span>
                  )}
                </div>
                <div className="ml-4 whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                <div className="text-gray-600 text-xs mt-1 ml-4">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}

            {/* 加载指示器 */}
            {isLoading && (
              <div className="text-green-400">
                <div className="flex items-center gap-2">
                  <span>{'>'} AGENT:</span>
                  <span className="animate-pulse">正在思考...</span>
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入区域 */}
        <div className="bg-gray-800 border-t-2 border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <span className="text-green-400 font-mono">{'>'}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-black border border-green-400 text-green-400 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-green-400 text-black px-4 py-2 font-mono font-bold hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              SEND
            </button>
          </form>
          <div className="text-gray-500 text-xs mt-2 font-mono">
            Press ENTER to send | ESC to clear
          </div>
        </div>

        {/* CRT 屏幕闪烁效果 */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="h-full w-full bg-white animate-flicker"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.1; }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
        .animate-flicker {
          animation: flicker 0.15s infinite;
        }
      `}</style>
    </div>
  )
}

