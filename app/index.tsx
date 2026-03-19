import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth';

// Entry point — routes to auth or app based on session state
export default function Index() {
  const { session, profile, initialized, loading } = useAuthStore();

  if (!initialized || loading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#C9A84C" size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!profile?.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(app)" />;
}
