export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  error?: string;
} 