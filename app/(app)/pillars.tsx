import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth';
import { PILLARS } from '../../lib/pillars';

export default function PillarsScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const scores = profile?.pillarScores ?? {};

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text className="text-white text-2xl font-bold mb-1">Pillars</Text>
        <Text className="text-white/40 text-sm mb-8">
          Your 7 dimensions of excellence.
        </Text>

        <View className="gap-4">
          {PILLARS.map((pillar) => {
            const score = scores[pillar.id] ?? null;
            const isActive = profile?.activePillars?.includes(pillar.id);
            const pct = score != null ? Math.round((score / 10) * 100) : 0;

            return (
              <View
                key={pillar.id}
                className="bg-surface-raised rounded-2xl p-5"
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: isActive ? pillar.color : '#2A2A2A',
                }}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-row items-center gap-2">
                    <Text style={{ fontSize: 22 }}>{pillar.icon}</Text>
                    <View>
                      <Text className="text-white font-bold text-base">
                        {pillar.label}
                      </Text>
                      <Text className="text-white/40 text-xs">
                        {pillar.description}
                      </Text>
                    </View>
                  </View>
                  {score != null && (
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: pillar.color }}
                    >
                      {score.toFixed(1)}
                    </Text>
                  )}
                </View>

                {/* Progress bar */}
                {score != null && (
                  <View className="h-1 bg-surface-overlay rounded-full mb-3">
                    <View
                      className="h-1 rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pillar.color,
                      }}
                    />
                  </View>
                )}

                {/* North star metrics */}
                <View className="gap-1">
                  {pillar.northStarMetrics.map((m) => (
                    <Text key={m.id} className="text-white/30 text-xs">
                      ◎ {m.label}
                    </Text>
                  ))}
                </View>

                {!isActive && (
                  <View className="mt-3">
                    <Text className="text-white/20 text-xs italic">
                      Not active — enable in settings
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
