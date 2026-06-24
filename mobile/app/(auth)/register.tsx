import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import AuthContainer from '@/components/AuthContainer';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert('Registration failed', err?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContainer>
      {/* Header */}
      <View className="mb-10 items-center">
        <Text className="text-4xl font-bold text-white">🎯</Text>
        <Text className="mt-3 text-2xl font-bold text-white">Create Account</Text>
        <Text className="mt-1 text-slate-400 text-sm">Start practicing interviews today</Text>
      </View>

      {/* Name */}
      <View className="mb-4 w-full">
        <Text className="mb-1 text-sm text-slate-300">Full Name</Text>
        <TextInput
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          placeholder="Ankit Sharma"
          placeholderTextColor="#64748b"
          value={name}
          onChangeText={setName}
        />
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
          placeholder="Min. 6 characters"
          placeholderTextColor="#64748b"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        className="w-full rounded-xl bg-blue-600 py-4 items-center"
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Create Account</Text>
        )}
      </TouchableOpacity>

      {/* Sign in link */}
      <View className="mt-8 flex-row justify-center">
        <Text className="text-slate-400 text-sm">Already have an account? </Text>
        <Link href="/(auth)/login">
          <Text className="text-blue-400 text-sm font-semibold">Sign in</Text>
        </Link>
      </View>
    </AuthContainer>
  );
}
