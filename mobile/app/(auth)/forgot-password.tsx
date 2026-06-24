import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiRequest } from '@/services/api';
import AuthContainer from '@/components/AuthContainer';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email) return;
    setLoading(true);
    try {
      await apiRequest('/auth/forgot-password', { method: 'POST', body: { email } });
      setSent(true);
    } catch {
      Alert.alert('Error', 'Could not send reset email. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthContainer>
        <View className="items-center">
          <Text className="text-5xl mb-4">📧</Text>
          <Text className="text-white text-xl font-bold mb-2">Check your email</Text>
          <Text className="text-slate-400 text-center mb-8">
            We sent a reset link to {email}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-400">Back to Login</Text>
          </TouchableOpacity>
        </View>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <TouchableOpacity onPress={() => router.back()} className="mb-8">
        <Text className="text-blue-400 text-base">← Back</Text>
      </TouchableOpacity>

      <Text className="text-white text-2xl font-bold mb-2">Reset Password</Text>
      <Text className="text-slate-400 mb-8">Enter your email to receive a reset link.</Text>

      <View className="w-full mb-4">
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

      <TouchableOpacity
        className="w-full rounded-xl bg-blue-600 py-4 items-center"
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold">Send Reset Link</Text>
        )}
      </TouchableOpacity>
    </AuthContainer>
  );
}
