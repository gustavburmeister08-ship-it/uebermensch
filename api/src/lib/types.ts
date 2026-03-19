export type AIProvider = 'anthropic' | 'openai';
export type Phase = 'dissonance' | 'uncertainty' | 'discovery';
export type PillarId =
  | 'mind' | 'emotion' | 'body' | 'relationships'
  | 'vocation' | 'wealth' | 'adventure';

export interface DirectiveRequest {
  userId: string;
  phase: Phase;
  activePillars: PillarId[];
  pillarScores: Partial<Record<PillarId, number>>;
  recentMoods: number[];
  recentEnergy: number[];
  recentMetrics: Record<string, number[]>; // metricId -> last 7 values
  provider?: AIProvider;
}

export interface DirectiveResponse {
  pillar: PillarId;
  title: string;
  body: string;
  why: string;
  action: string;
  model: string;
}

export interface AuditRequest {
  userId: string;
  phase: Phase;
  pillarScores: Partial<Record<PillarId, number>>;
  weeklyMetrics: Record<string, number[]>;
  directiveCompletion: number;
  provider?: AIProvider;
}

export interface AuditResponse {
  summary: string;
  highlights: string[];
  gaps: string[];
}
