'use client'

import { useState, useRef, useEffect } from 'react'

export interface RetroMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface RetroComputerProps {
  messages: RetroMessage[]
  onSendMessage: (message: string) => void
  onResetConversation?: () => void
  isLoading?: boolean
  errorMessage?: string | null
}

export default function RetroComputer({ 
  messages, 
  onSendMessage, 
  onResetConversation,
  isLoading = false,
  errorMessage = null
}: RetroComputerProps) {
  const [input, setInput] = useState('')
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput('')
      inputRef.current?.focus()
    }
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inputRef.current === document.activeElement) {
        setInput('')
      }
      // Ctrl/Cmd + Enter 发送
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && input.trim()) {
        handleSubmit(e as any)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [input, isLoading])

  // 复制消息内容
  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      // 可以添加一个 toast 提示
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="w-full max-w-6xl h-[90vh] flex flex-col mx-auto">
      {/* 主容器 */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-4 border-gray-700 rounded-2xl shadow-2xl flex flex-col h-full relative overflow-hidden backdrop-blur-sm">
        {/* 背景效果 */}
        <div className="absolute inset-0 pointer-events-none opacity-5 z-0">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-green-400/20 to-transparent animate-scan"></div>
        </div>
        
        {/* 顶部标题栏 */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b-2 border-gray-700 px-6 py-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50 animate-pulse"></div>
            </div>
            <div className="font-mono text-green-400 text-sm font-bold tracking-wider">
              TERMINAL v2.0
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 rounded-lg border border-green-500/30">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-green-400 text-xs font-mono">
                {isLoading ? 'THINKING...' : 'READY'}
              </span>
            </div>
            {onResetConversation && (
              <button
                type="button"
                onClick={onResetConversation}
                disabled={messages.length <= 1 || isLoading}
                className="px-4 py-1.5 border border-red-400/50 text-red-400 text-xs font-mono hover:bg-red-400 hover:text-black transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed rounded"
              >
                RESET
              </button>
            )}
          </div>
        </div>

        {/* 消息区域 */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-gradient-to-b from-black via-gray-950 to-black p-6 font-mono relative z-20 scroll-smooth"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#10b981 transparent'
          }}
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 欢迎消息 - 只在没有任何消息时显示 */}
            {messages.length === 0 && (
              <div className="text-center py-12 space-y-4">
                <div className="text-green-400 text-lg mb-6">
                  <div className="mb-2">╔═══════════════════════════════════╗</div>
                  <div className="mb-2">║  Welcome to My World Terminal     ║</div>
                  <div className="mb-2">╚═══════════════════════════════════╝</div>
                </div>
                <div className="text-gray-400 text-sm space-y-2">
                  <p>Type your message below and press ENTER to start chatting</p>
                  <p className="text-xs text-gray-500">Press ESC to clear input • Ctrl+Enter to send</p>
                </div>
              </div>
            )}

            {/* 消息列表 - 显示所有消息，包括欢迎消息 */}
            {messages.length > 0 && messages.map((message, index) => {
              const messageDate = message.timestamp instanceof Date 
                ? message.timestamp 
                : new Date(message.timestamp)
              const uniqueKey = `${message.id}-${index}`
              const isUser = message.role === 'user'
              const isHovered = hoveredMessageId === message.id

              return (
                <div
                  key={uniqueKey}
                  data-message-id={message.id}
                  data-message-role={message.role}
                  className={`group flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} transition-all duration-200`}
                  onMouseEnter={() => setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {/* 头像/图标 */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    isUser 
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white' 
                      : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                  } shadow-lg`}>
                    {isUser ? 'U' : 'AI'}
                  </div>

                  {/* 消息内容 */}
                  <div className={`flex-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2 max-w-[75%]`}>
                    {/* 消息气泡 */}
                    <div className={`relative rounded-2xl px-5 py-3 shadow-lg transition-all duration-200 ${
                      isUser
                        ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 text-cyan-100 rounded-tr-sm'
                        : 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-400/30 text-green-100 rounded-tl-sm'
                    } ${isHovered ? 'scale-[1.02] shadow-xl' : ''}`}>
                      {/* 消息角色标签 */}
                      <div className={`text-xs font-bold mb-2 pb-2 border-b ${
                        isUser 
                          ? 'border-cyan-400/30 text-cyan-300' 
                          : 'border-green-400/30 text-green-300'
                      }`}>
                        {isUser ? '👤 USER' : '🤖 AI AGENT'}
                      </div>
                      
                      {/* 消息内容 */}
                      <div className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                        {message.content || (isLoading && index === messages.length - 1 ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="animate-pulse">思考中</span>
                            <span className="animate-bounce">.</span>
                            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                          </span>
                        ) : '')}
                      </div>

                      {/* 操作按钮（悬停时显示） */}
                      {isHovered && (
                        <div className={`absolute top-2 ${isUser ? 'left-2' : 'right-2'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="p-1.5 bg-black/50 hover:bg-black/70 rounded text-xs text-gray-300 hover:text-white transition-colors"
                            title="复制消息"
                          >
                            📋
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 时间戳 */}
                    <div className={`text-xs text-gray-500 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
                      {formatTime(messageDate)}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* 加载指示器 */}
            {isLoading && messages.length > 0 && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center font-bold text-sm text-white shadow-lg">
                  AI
                </div>
                <div className="flex-1 flex items-center gap-2 text-green-400">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm">正在思考中...</span>
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {errorMessage && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center font-bold text-sm text-white shadow-lg">
                  !
                </div>
                <div className="flex-1 bg-red-500/20 border border-red-400/30 rounded-2xl px-5 py-3 text-red-300 text-sm">
                  <div className="font-bold mb-1">⚠️ 系统错误</div>
                  <div>{errorMessage}</div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入区域 */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-t-2 border-gray-700 p-5 relative z-30">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 bg-black/50 rounded-xl border border-green-400/30 p-3 focus-within:border-green-400/60 focus-within:shadow-lg focus-within:shadow-green-400/20 transition-all duration-200">
              <span className="text-green-400 font-mono text-lg font-bold">{'>'}</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入你的消息..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-green-100 placeholder-gray-500 font-mono text-sm focus:outline-none disabled:opacity-50"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono hidden sm:block">
                  {input.length > 0 && `${input.length} 字符`}
                </span>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-mono font-bold rounded-lg hover:from-green-400 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:hover:shadow-none"
                >
                  {isLoading ? '发送中...' : '发送'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500 font-mono px-1">
              <div className="flex items-center gap-4">
                <span>ENTER 发送</span>
                <span>ESC 清空</span>
                <span>Ctrl+Enter 发送</span>
              </div>
              <div className="text-gray-600">
                {messages.length > 1 ? `${messages.length - 1} 条消息` : '新对话'}
              </div>
            </div>
          </form>
        </div>

        {/* 背景动画效果 */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-0">
          <div className="h-full w-full bg-white animate-flicker"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.05; }
        }
        .animate-scan {
          animation: scan 10s linear infinite;
        }
        .animate-flicker {
          animation: flicker 0.2s infinite;
        }
        /* 自定义滚动条样式 */
        :global(.scroll-smooth) {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  )
}
