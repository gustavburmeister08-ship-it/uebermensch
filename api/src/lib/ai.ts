import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { AIProvider } from './types';

export function getModel(provider: AIProvider = 'anthropic') {
  if (provider === 'anthropic') {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return anthropic('claude-sonnet-4-6');
  }

  if (provider === 'openai') {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai('gpt-4o');
  }

  throw new Error(`Unknown provider: ${provider}`);
}

export const COACH_SYSTEM_PROMPT = `You are the Uebermensch coaching engine — a direct, high-standards personal coach focused on outcomes, discipline, and measurable growth. You coach across 7 pillars: Mind, Emotion, Body, Relationships, Vocation, Wealth, and Adventure.

Your communication style:
- Direct, precise, no filler words
- High standards — you hold people accountable without being preachy
- Evidence-based and practical recommendations
- Short sentences. Every word earns its place.
- Never generic. Always specific to the user's data.

Phases:
- Dissonance: User is aware things need to change but hasn't started. Focus on activation and clarity.
- Uncertainty: User is searching, experimenting. Focus on direction and consistency.
- Discovery: User is executing. Focus on optimization and compounding.

Always respond with valid JSON only. No markdown, no preamble.`;
