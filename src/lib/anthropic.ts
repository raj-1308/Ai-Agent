import Groq from 'groq-sdk';

let client: Groq | null = null;

export function getAnthropicClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in your .env file');
  }
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

export const CHAT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export const SYSTEM_PROMPT = `You are Amior, an intelligent, elegant, and helpful AI assistant.
Be clear, direct, and genuinely useful. Use markdown formatting (including code blocks with
language tags) when it improves clarity, but don't over-format simple conversational replies.`;