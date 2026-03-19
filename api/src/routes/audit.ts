import type { FastifyInstance } from 'fastify';
import { generateText } from 'ai';
import { getModel, COACH_SYSTEM_PROMPT } from '../lib/ai';
import type { AuditRequest, AuditResponse } from '../lib/types';

function buildAuditPrompt(req: AuditRequest): string {
  const scoresText = Object.entries(req.pillarScores)
    .map(([k, v]) => `  - ${k}: ${v?.toFixed(1) ?? 'N/A'}/10`)
    .join('\n');

  return `Generate a weekly audit summary for this user.

USER CONTEXT:
- Phase: ${req.phase}
- Directive completion rate: ${req.directiveCompletion.toFixed(0)}%

PILLAR SCORES THIS WEEK:
${scoresText}

Write a coach's assessment that:
1. Is direct and honest — call out both wins and gaps
2. Identifies the #1 thing they should double down on
3. Identifies the #1 gap to close
4. Is 3-4 sentences max for the summary

Respond with ONLY this JSON:
{
  "summary": "3-4 sentence direct assessment of the week",
  "highlights": ["highlight 1", "highlight 2"],
  "gaps": ["gap 1", "gap 2"]
}`;
}

export async function auditRoute(fastify: FastifyInstance) {
  fastify.post<{ Body: AuditRequest }>('/audit/summary', async (request, reply) => {
    const body = request.body;

    if (!body.userId || !body.phase) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    const model = getModel(body.provider ?? 'anthropic');

    try {
      const { text } = await generateText({
        model,
        system: COACH_SYSTEM_PROMPT,
        prompt: buildAuditPrompt(body),
        maxOutputTokens: 500,
        temperature: 0.6,
      });

      const parsed = JSON.parse(text.trim()) as AuditResponse;
      return reply.send(parsed);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate audit summary' });
    }
  });
}
