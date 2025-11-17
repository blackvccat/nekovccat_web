'use client'

import { useState, useCallback, useRef } from 'react'
import PageLayout from '@/components/layout/page-layout'
import RetroComputer from '@/components/my-world/retro-computer'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function MyWorld() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesRef = useRef<Message[]>([])
  
  // Keep ref and state in sync
  const updateMessages = useCallback((newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    if (typeof newMessages === 'function') {
      setMessages(prev => {
        const updated = newMessages(prev)
        messagesRef.current = updated
        return updated
      })
    } else {
      messagesRef.current = newMessages
      setMessages(newMessages)
    }
  }, [])

  const handleSendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    // Update state so the new user message renders immediately
    updateMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Use the ref to get the latest messages array (including the new user message)
      const currentMessages = [...messagesRef.current]
      
      // Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Validate response payload
      if (!data.content) {
        throw new Error('Invalid response format from server')
      }

      // Add AI response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(data.timestamp || Date.now())
      }

      updateMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error 
          ? `Error: ${error.message}` 
          : 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      }
      
      updateMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [updateMessages])

  return (
    <PageLayout use3DBackground={false} textColor="black" transparentHeader={true}>
      <div className="w-full h-full flex items-center justify-center py-8">
        <div className="mt-16">
          <RetroComputer
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </PageLayout>
  )
}

