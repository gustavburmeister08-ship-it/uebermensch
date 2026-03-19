import type { FastifyInstance } from 'fastify';
import { generateText } from 'ai';
import { getModel, COACH_SYSTEM_PROMPT } from '../lib/ai';
import type { DirectiveRequest, DirectiveResponse, PillarId } from '../lib/types';

const PILLAR_LABELS: Record<PillarId, string> = {
  mind: 'Mind (cognition, focus, learning)',
  emotion: 'Emotion (regulation, resilience, stress)',
  body: 'Body (health, fitness, energy)',
  relationships: 'Relationships (tribe, intimacy, trust)',
  vocation: 'Vocation (craft, career, output)',
  wealth: 'Wealth (savings, investing, discipline)',
  adventure: 'Adventure (experiences, creation, aliveness)',
};

function findWeakestPillar(
  activePillars: PillarId[],
  pillarScores: Partial<Record<PillarId, number>>
): PillarId {
  return activePillars.reduce((weakest, pillar) => {
    const score = pillarScores[pillar] ?? 5;
    const weakestScore = pillarScores[weakest] ?? 5;
    return score < weakestScore ? pillar : weakest;
  }, activePillars[0]);
}

function buildDirectivePrompt(req: DirectiveRequest): string {
  const weakest = findWeakestPillar(req.activePillars, req.pillarScores);
  const avgMood = req.recentMoods.length
    ? (req.recentMoods.reduce((a, b) => a + b, 0) / req.recentMoods.length).toFixed(1)
    : 'unknown';
  const avgEnergy = req.recentEnergy.length
    ? (req.recentEnergy.reduce((a, b) => a + b, 0) / req.recentEnergy.length).toFixed(1)
    : 'unknown';

  const scoresText = req.activePillars
    .map((p) => `  - ${PILLAR_LABELS[p]}: ${(req.pillarScores[p] ?? 0).toFixed(1)}/10`)
    .join('\n');

  return `Generate a single daily directive for this user.

USER CONTEXT:
- Phase: ${req.phase}
- Average mood (7 days): ${avgMood}/10
- Average energy (7 days): ${avgEnergy}/10
- Weakest pillar: ${PILLAR_LABELS[weakest]}

PILLAR SCORES:
${scoresText}

DIRECTIVE RULES:
- Target the weakest pillar: ${weakest}
- Be specific — no generic advice
- The action must be completable today
- Match intensity to phase (dissonance=gentle activation, uncertainty=direction, discovery=optimization)
- Be direct. No softening language.

Respond with ONLY this JSON (no other text):
{
  "pillar": "${weakest}",
  "title": "Short directive title (max 8 words)",
  "body": "2-3 sentences explaining the directive and why it matters for this user right now.",
  "why": "One sentence: the specific mechanism — why this produces results.",
  "action": "Single concrete action. Start with a verb. Be specific. Max 20 words."
}`;
}

export async function directiveRoute(fastify: FastifyInstance) {
  fastify.post<{ Body: DirectiveRequest }>('/directive', async (request, reply) => {
    const body = request.body;

    if (!body.userId || !body.phase || !body.activePillars?.length) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    const provider = body.provider ?? 'anthropic';
    const model = getModel(provider);
    const modelId = provider === 'anthropic' ? 'claude-sonnet-4-6' : 'gpt-4o';

    try {
      const prompt = buildDirectivePrompt(body);

      const { text } = await generateText({
        model,
        system: COACH_SYSTEM_PROMPT,
        prompt,
        maxOutputTokens: 400,
        temperature: 0.7,
      });

      // Parse the JSON response
      const parsed = JSON.parse(text.trim()) as Omit<DirectiveResponse, 'model'>;

      const directive: DirectiveResponse = {
        ...parsed,
        model: modelId,
      };

      return reply.send(directive);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate directive' });
    }
  });
}
