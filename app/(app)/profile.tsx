import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';
import { PILLARS } from '../../lib/pillars';

const PHASE_DESCRIPTIONS = {
  dissonance: 'You\'re aware something is off. The gap between who you are and who you could be is visible. Good — awareness precedes change.',
  uncertainty: 'You\'re searching. The old patterns don\'t fit. You\'re building new ones. Stay in the work.',
  discovery: 'You\'re executing. The systems are in place. Now it\'s about compounding gains.',
};

export default function Profile() {
  const { profile, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  if (!profile) return null;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity block */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-surface-raised border-2 border-gold items-center justify-center mb-4">
            <Text className="text-3xl">
              {profile.displayName?.[0]?.toUpperCase() ?? '◉'}
            </Text>
          </View>
          <Text className="text-white text-xl font-bold">
            {profile.displayName ?? 'Operator'}
          </Text>
          <Text className="text-white/40 text-sm">{profile.email}</Text>
          <View className="flex-row gap-3 mt-3">
            <View className="bg-surface-raised rounded-full px-4 py-1.5">
              <Text className="text-gold text-xs font-medium tracking-widest uppercase">
                Level {profile.level}
              </Text>
            </View>
            <View className="bg-surface-raised rounded-full px-4 py-1.5">
              <Text className="text-white/50 text-xs tracking-widest uppercase">
                {profile.subscriptionTier === 'pro' ? 'Pro' : 'Free'}
              </Text>
            </View>
          </View>
        </View>

        {/* Phase block */}
        <View className="bg-surface-raised rounded-2xl p-5 mb-6">
          <Text className="text-gold text-xs tracking-widest uppercase mb-2">
            Current Phase
          </Text>
          <Text className="text-white text-lg font-bold mb-2 capitalize">
            {profile.phase}
          </Text>
          <Text className="text-white/50 text-sm leading-relaxed">
            {PHASE_DESCRIPTIONS[profile.phase]}
          </Text>
        </View>

        {/* Active pillars */}
        <View className="bg-surface-raised rounded-2xl p-5 mb-6">
          <Text className="text-white/50 text-xs tracking-widest uppercase mb-4">
            Active Pillars
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PILLARS.map((pillar) => {
              const active = profile.activePillars?.includes(pillar.id);
              return (
                <View
                  key={pillar.id}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: active ? pillar.color + '22' : '#1A1A1A',
                    borderWidth: 1,
                    borderColor: active ? pillar.color + '55' : '#2A2A2A',
                  }}
                >
                  <Text style={{ fontSize: 12 }}>{pillar.icon}</Text>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: active ? pillar.color : '#444' }}
                  >
                    {pillar.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Settings */}
        <View className="bg-surface-raised rounded-2xl overflow-hidden mb-6">
          {[
            { label: 'Upgrade to Pro', icon: '💎', highlight: true },
            { label: 'Notification Settings', icon: '🔔' },
            { label: 'Privacy & Data', icon: '🔒' },
            { label: 'About Uebermensch', icon: 'ℹ️' },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              className="flex-row items-center px-5 py-4"
              style={{
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: '#2A2A2A',
              }}
            >
              <Text className="mr-3" style={{ fontSize: 16 }}>{item.icon}</Text>
              <Text
                className="text-sm font-medium flex-1"
                style={{ color: item.highlight ? '#C9A84C' : '#CCC' }}
              >
                {item.label}
              </Text>
              <Text className="text-white/20">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          className="py-4 items-center rounded-2xl border border-surface-border"
          onPress={handleSignOut}
        >
          <Text className="text-white/40 text-sm">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
