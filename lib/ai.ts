import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { AIProvider, DirectiveGenerationInput, Directive } from '../types';
import { PILLAR_MAP } from './pillars';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

// All AI calls go through our backend to keep API keys off device
export async function generateDirective(
  input: DirectiveGenerationInput
): Promise<Omit<Directive, 'id' | 'generatedAt'>> {
  const response = await fetch(`${API_BASE_URL}/api/directive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  return response.json();
}

export async function generateWeeklySummary(params: {
  userId: string;
  weekData: Record<string, unknown>;
}): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/audit/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.summary;
}

// Builds the system prompt for the coaching engine
export function buildCoachingSystemPrompt(provider: AIProvider): string {
  return `You are the Uebermensch coaching engine — a direct, elite-level personal coach focused on outcomes and discipline. You operate across 7 pillars: Mind, Emotion, Body, Relationships, Vocation, Wealth, and Adventure.

Your communication style:
- Direct, precise, no filler
- High standards — you hold the user accountable
- Evidence-based recommendations
- Never preachy, never soft-pedaling
- Short sentences. Dense value per word.

You have access to the user's recent check-in data, phase (Dissonance/Uncertainty/Discovery), and pillar scores. Use this to generate personalized, actionable directives.

Format all directives as JSON with: { title, body, why, action, pillar }`;
}
