// ─── Pillars ─────────────────────────────────────────────────────────────────

export type PillarId =
  | 'mind'
  | 'emotion'
  | 'body'
  | 'relationships'
  | 'vocation'
  | 'wealth'
  | 'adventure';

export type Phase = 'dissonance' | 'uncertainty' | 'discovery';

export type Level = '1.0' | '2.0' | '3.0';

export interface Pillar {
  id: PillarId;
  label: string;
  description: string;
  color: string;
  icon: string; // emoji for now
  northStarMetrics: MetricDefinition[];
  leadingMetrics: MetricDefinition[];
  optionalMetrics: MetricDefinition[];
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export type MetricType =
  | 'score'      // 0-10 rating
  | 'count'      // integer count
  | 'boolean'    // yes/no
  | 'duration'   // minutes
  | 'percentage'; // 0-100

export interface MetricDefinition {
  id: string;
  pillar: PillarId;
  label: string;
  description: string;
  type: MetricType;
  unit?: string;
  isNorthStar?: boolean;
  isLeading?: boolean;
}

export interface MetricEntry {
  id: string;
  metricId: string;
  userId: string;
  value: number; // booleans stored as 0/1, scores as 0-10, etc.
  loggedAt: string; // ISO timestamp
  note?: string;
}

// ─── Check-in ─────────────────────────────────────────────────────────────────

export interface CheckIn {
  id: string;
  userId: string;
  entries: MetricEntry[];
  completedAt: string;
  mood: number; // 0-10 overall mood
  energyLevel: number; // 0-10
  note?: string;
}

// ─── Directive ────────────────────────────────────────────────────────────────

export interface Directive {
  id: string;
  userId: string;
  pillar: PillarId;
  title: string;
  body: string;
  why: string;
  action: string;
  generatedAt: string;
  completedAt?: string;
  skippedAt?: string;
  model: string; // which AI model generated this
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  phase: Phase;
  level: Level;
  activePillars: PillarId[];
  onboardingComplete: boolean;
  subscriptionTier: 'free' | 'pro';
  createdAt: string;
  pillarScores: Partial<Record<PillarId, number>>; // 0-10 cached scores
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export interface OnboardingAnswer {
  questionId: string;
  answer: string | number | boolean;
}

export interface OnboardingResult {
  phase: Phase;
  topPillars: PillarId[];
  initialScores: Partial<Record<PillarId, number>>;
}

// ─── Weekly Audit ─────────────────────────────────────────────────────────────

export interface WeeklyAudit {
  id: string;
  userId: string;
  weekStart: string; // ISO date
  pillarScores: Partial<Record<PillarId, number>>;
  highlights: string[];
  gaps: string[];
  directiveCompletion: number; // percentage
  aiSummary?: string;
  completedAt: string;
}

// ─── AI Engine ───────────────────────────────────────────────────────────────

export type AIProvider = 'anthropic' | 'openai';

export interface AIEngineConfig {
  provider: AIProvider;
  model: string;
}

export interface DirectiveGenerationInput {
  user: UserProfile;
  recentCheckIns: CheckIn[];
  weakestPillar: PillarId;
  phase: Phase;
}
