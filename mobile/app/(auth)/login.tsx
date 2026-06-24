import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import AuthContainer from '@/components/AuthContainer';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert('Login failed', err?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContainer>
      {/* Header */}
      <View className="mb-10 items-center">
        <Text className="text-4xl font-bold text-white">🎯</Text>
        <Text className="mt-3 text-2xl font-bold text-white">Interview Simulator</Text>
        <Text className="mt-1 text-slate-400 text-sm">Sign in to your account</Text>
      </View>

      {/* Email */}
      <View className="mb-4 w-full">
        <Text className="mb-1 text-sm text-slate-300">Email</Text>
        <TextInput
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          placeholder="you@example.com"
          placeholderTextColor="#64748b"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Password */}
      <View className="mb-6 w-full">
        <Text className="mb-1 text-sm text-slate-300">Password</Text>
        <TextInput
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          placeholder="••••••••"
          placeholderTextColor="#64748b"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {/* Sign In */}
      <TouchableOpacity
        className="w-full rounded-xl bg-blue-600 py-4 items-center"
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Sign In</Text>
        )}
      </TouchableOpacity>

      {/* Forgot */}
      <TouchableOpacity
        className="mt-4 items-center"
        onPress={() => router.push('/(auth)/forgot-password')}
      >
        <Text className="text-blue-400 text-sm">Forgot password?</Text>
      </TouchableOpacity>

      {/* Sign up */}
      <View className="mt-8 flex-row justify-center">
        <Text className="text-slate-400 text-sm">Don't have an account? </Text>
        <Link href="/(auth)/register">
          <Text className="text-blue-400 text-sm font-semibold">Sign up</Text>
        </Link>
      </View>
    </AuthContainer>
  );
}
