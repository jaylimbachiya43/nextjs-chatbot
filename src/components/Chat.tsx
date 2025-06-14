'use client';

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import '../styles/chat.css';
import { ChatMessage } from '../types/chat';

interface ChatBotProps {
  apiKey: string;
  companyName: string;
  welcomeMessage?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export default function ChatBot({ 
  apiKey, 
  companyName, 
  welcomeMessage = "Welcome! I'm your virtual assistant. How can I help you today?",
  position = 'bottom-right'
}: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: welcomeMessage,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadIndex, setLastReadIndex] = useState(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Update unread count when messages change
  useEffect(() => {
    if (!isOpen && messages.length > lastReadIndex + 1) {
      setUnreadCount(messages.length - (lastReadIndex + 1));
    }
  }, [messages, isOpen, lastReadIndex]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setLastReadIndex(messages.length - 1);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const messagesToSend = messages.length === 1 ? [userMessage] : messages.concat(userMessage);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: messagesToSend,
          apiKey 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response },
        ]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionClass = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  return (
    <div className={`fixed ${getPositionClass()} z-50`}>
      {/* Chat toggle button */}
      {!isOpen && (
        <div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="chat-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
            {unreadCount > 0 && (
              <div className="unread-badge">
                {unreadCount}
              </div>
            )}
          </button>
        </div>
      )}

      {/* Chat window */}
      <div
        ref={chatRef}
        className={`chat-window ${isOpen ? 'open' : 'closed'}`}
      >
        <div className="chat-container">
          {/* Chat header */}
          <div className="chat-header">
            <div>
              <h2 className="text-lg font-semibold">{companyName}</h2>
              <p className="text-sm text-blue-100">Virtual Assistant</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="close-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Chat messages */}
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message-container ${message.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}>
                  <p className="message-text">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-container assistant">
                <div className="loading-indicator">
                  <div className="dot" />
                  <div className="dot" />
                  <div className="dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <div className="chat-input-container">
            <form onSubmit={handleSubmit} className="chat-form">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="chat-input"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="send-button"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 