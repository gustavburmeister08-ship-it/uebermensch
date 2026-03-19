import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { PILLARS } from '../lib/pillars';
import type { Phase, PillarId, OnboardingAnswer } from '../types';

// 12 questions to detect phase and pillar priorities
const QUESTIONS = [
  {
    id: 'q1',
    text: 'Right now, how clear are you on what you actually want in life?',
    options: ['Completely lost', 'Some idea, lots of fog', 'Getting clearer', 'Crystal clear'],
  },
  {
    id: 'q2',
    text: 'How would you rate your energy and physical health on a typical day?',
    options: ['Depleted', 'Below average', 'Decent', 'Excellent'],
  },
  {
    id: 'q3',
    text: 'Your career or craft — where does it stand?',
    options: ['Stagnant or wrong path', 'Moving but unfocused', 'On track', 'Thriving and building'],
  },
  {
    id: 'q4',
    text: 'How are your key relationships (partner, family, close friends)?',
    options: ['Strained or isolated', 'Mediocre, surface-level', 'Solid with room to grow', 'Deep and nourishing'],
  },
  {
    id: 'q5',
    text: 'Do you have control over your emotions under pressure?',
    options: ['Rarely', 'Sometimes', 'Mostly', 'Consistently'],
  },
  {
    id: 'q6',
    text: 'Your finances — where are you?',
    options: ['Living paycheck to paycheck', 'Stable but not building wealth', 'Saving and investing', 'Building significant wealth'],
  },
  {
    id: 'q7',
    text: 'When did you last do something that genuinely excited or challenged you?',
    options: ['Can\'t remember', 'Months ago', 'Recently', 'Regularly'],
  },
  {
    id: 'q8',
    text: 'How much of your day do you spend in focused, deep work?',
    options: ['Almost none', 'An hour or less', '2–4 hours', '4+ hours'],
  },
  {
    id: 'q9',
    text: 'Which area feels most broken right now?',
    options: ['Health / Body', 'Mind / Focus', 'Career / Craft', 'Relationships'],
  },
  {
    id: 'q10',
    text: 'Which area feels most broken right now? (continued)',
    options: ['Finances', 'Emotional resilience', 'Sense of adventure / purpose', 'Multiple areas equally'],
  },
  {
    id: 'q11',
    text: 'What\'s your primary motivation for being here?',
    options: ['I\'m in crisis and need out', 'I\'m drifting and need direction', 'I\'m good but want to be great', 'I\'m already high-performing, need edge'],
  },
  {
    id: 'q12',
    text: 'How consistent are you with self-improvement practices right now?',
    options: ['Never / just starting', 'Sporadic', 'Regular but disorganized', 'Systematic and disciplined'],
  },
];

function detectPhase(answers: OnboardingAnswer[]): Phase {
  // Score: 0=very bad, 1=bad, 2=ok, 3=good
  const scores = answers.map((a) => Number(a.answer));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  if (avg < 1.2) return 'dissonance';
  if (avg < 2.2) return 'uncertainty';
  return 'discovery';
}

function detectTopPillars(answers: OnboardingAnswer[]): PillarId[] {
  // q9 and q10 directly tell us broken areas
  const q9 = Number(answers.find((a) => a.questionId === 'q9')?.answer ?? 3);
  const q10 = Number(answers.find((a) => a.questionId === 'q10')?.answer ?? 3);

  const pillarsByScore: Record<string, number> = {
    body: Number(answers.find((a) => a.questionId === 'q2')?.answer ?? 3),
    mind: Number(answers.find((a) => a.questionId === 'q8')?.answer ?? 3),
    vocation: Number(answers.find((a) => a.questionId === 'q3')?.answer ?? 3),
    relationships: Number(answers.find((a) => a.questionId === 'q4')?.answer ?? 3),
    emotion: Number(answers.find((a) => a.questionId === 'q5')?.answer ?? 3),
    wealth: Number(answers.find((a) => a.questionId === 'q6')?.answer ?? 3),
    adventure: Number(answers.find((a) => a.questionId === 'q7')?.answer ?? 3),
  };

  // Sort ascending (lowest score = weakest = prioritized first)
  return Object.entries(pillarsByScore)
    .sort(([, a], [, b]) => a - b)
    .map(([id]) => id) as PillarId[];
}

export default function Onboarding() {
  const router = useRouter();
  const { user, loadProfile } = useAuthStore();
  const [step, setStep] = useState(0); // 0 = intro, 1-12 = questions, 13 = done
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const isIntro = step === 0;
  const isDone = step > QUESTIONS.length;
  const question = QUESTIONS[step - 1];

  const handleAnswer = (index: number) => {
    setSelectedOption(index);
    Haptics.selectionAsync();
  };

  const handleNext = async () => {
    if (isIntro) {
      setStep(1);
      return;
    }

    if (selectedOption === null) return;

    const newAnswers = [
      ...answers.filter((a) => a.questionId !== question.id),
      { questionId: question.id, answer: selectedOption },
    ];
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (step < QUESTIONS.length) {
      setStep(step + 1);
    } else {
      // Final step — compute results and save
      await finishOnboarding(newAnswers);
    }
  };

  const finishOnboarding = async (finalAnswers: OnboardingAnswer[]) => {
    if (!user?.id) return;
    setSaving(true);

    const phase = detectPhase(finalAnswers);
    const topPillars = detectTopPillars(finalAnswers);
    const activePillars = topPillars; // all 7, but ranked

    // Initial scores from answers (scale 0-3 → 0-10)
    const pillarScores: Record<string, number> = {};
    activePillars.forEach((pillarId, i) => {
      // Rough initial score from question responses
      pillarScores[pillarId] = Math.round(
        (finalAnswers.find((a) =>
          ['q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'].includes(a.questionId)
        )?.answer as number ?? 1) * 3.33
      );
    });

    // Save profile
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email!,
      phase,
      level: '1.0',
      active_pillars: activePillars,
      onboarding_complete: true,
      subscription_tier: 'free',
      pillar_scores: pillarScores,
    });

    // Save answers
    const answerRows = finalAnswers.map((a) => ({
      user_id: user.id,
      question_id: a.questionId,
      answer: String(a.answer),
    }));
    await supabase.from('onboarding_answers').insert(answerRows);

    await loadProfile(user.id);
    setSaving(false);
    setStep(QUESTIONS.length + 1);
  };

  if (isDone) {
    const phase = detectPhase(answers);
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-8">
        <Text className="text-5xl mb-6">⚡</Text>
        <Text className="text-gold text-xs tracking-widest uppercase mb-3">
          Initiation Complete
        </Text>
        <Text className="text-white text-3xl font-bold text-center mb-4">
          Phase:{' '}
          <Text className="capitalize">{phase}</Text>
        </Text>
        <Text className="text-white/50 text-base text-center mb-10 leading-relaxed">
          Your profile has been calibrated. Your first directive awaits. The work begins now.
        </Text>
        <TouchableOpacity
          className="bg-gold rounded-2xl py-4 px-10"
          onPress={() => router.replace('/(app)')}
        >
          <Text className="text-surface font-bold text-base">Enter the Arena</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (saving) {
    return (
      <View className="flex-1 bg-surface items-center justify-center gap-4">
        <ActivityIndicator color="#C9A84C" size="large" />
        <Text className="text-white/50 text-sm">Calibrating your profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Progress */}
      {!isIntro && (
        <View className="h-1 bg-surface-border mx-6 mt-4 rounded-full">
          <View
            className="h-1 bg-gold rounded-full"
            style={{ width: `${((step) / QUESTIONS.length) * 100}%` }}
          />
        </View>
      )}

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {isIntro ? (
          <View className="flex-1 justify-between">
            <View className="gap-6 mt-8">
              <Text className="text-gold text-xs tracking-[6px] uppercase">
                Initiation Assessment
              </Text>
              <Text className="text-white text-3xl font-bold leading-tight">
                12 questions.{'\n'}No bullshit.{'\n'}Real calibration.
              </Text>
              <Text className="text-white/50 text-base leading-relaxed">
                This determines your current phase, your weakest pillars, and your first directive. Be honest — this only works if you are.
              </Text>
              <Text className="text-white/30 text-sm">
                Takes about 2 minutes.
              </Text>
            </View>
            <TouchableOpacity
              className="bg-gold rounded-2xl py-4 items-center mt-10"
              onPress={handleNext}
            >
              <Text className="text-surface font-bold text-base">Start Assessment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1 justify-between">
            {/* Question */}
            <View className="gap-6 mt-6">
              <Text className="text-white/30 text-xs tracking-widest">
                {step} / {QUESTIONS.length}
              </Text>
              <Text className="text-white text-xl font-bold leading-snug">
                {question.text}
              </Text>

              <View className="gap-3 mt-2">
                {question.options.map((option, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleAnswer(i)}
                    className="rounded-2xl px-5 py-4"
                    style={{
                      backgroundColor:
                        selectedOption === i ? '#C9A84C22' : '#1A1A1A',
                      borderWidth: 1.5,
                      borderColor:
                        selectedOption === i ? '#C9A84C' : '#2A2A2A',
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color: selectedOption === i ? '#C9A84C' : '#888',
                      }}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Next */}
            <TouchableOpacity
              className="bg-gold rounded-2xl py-4 items-center mt-8"
              onPress={handleNext}
              disabled={selectedOption === null}
              style={{ opacity: selectedOption === null ? 0.3 : 1 }}
            >
              <Text className="text-surface font-bold">
                {step === QUESTIONS.length ? 'Finish' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
