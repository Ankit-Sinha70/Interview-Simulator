import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiRequest } from '@/services/api';

const ROLES = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'Product Manager'];
const LEVELS = ['Junior', 'Mid-level', 'Senior', 'Lead'];
const MODES: { label: string; value: 'text' | 'voice' | 'hybrid'; emoji: string }[] = [
  { label: 'Text', value: 'text', emoji: '⌨️' },
  { label: 'Voice', value: 'voice', emoji: '🎤' },
  { label: 'Hybrid', value: 'hybrid', emoji: '🔀' },
];

export default function InterviewScreen() {
  const router = useRouter();
  const [role, setRole] = useState('Software Engineer');
  const [customRole, setCustomRole] = useState('');
  const [level, setLevel] = useState('Mid-level');
  const [mode, setMode] = useState<'text' | 'voice' | 'hybrid'>('text');
  const [loading, setLoading] = useState(false);

  const finalRole = customRole.trim() || role;

  async function startInterview() {
    setLoading(true);
    try {
      const res = await apiRequest<{ data: { sessionId: string } }>('/interview/start', {
        method: 'POST',
        body: {
          role: finalRole,
          experienceLevel: level.toLowerCase().replace('-', '_'),
          mode,
          interviewMode: 'manual',
        },
      });
      router.push(`/session/${res.data.sessionId}`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-4 pb-6">
          <Text className="text-white text-2xl font-bold">New Interview</Text>
          <Text className="text-slate-400 text-sm mt-1">Configure your practice session</Text>
        </View>

        {/* Role */}
        <Section title="Select Role">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            {ROLES.map(r => (
              <TouchableOpacity
                key={r}
                className={`mr-2 px-4 py-2 rounded-full border ${role === r && !customRole ? 'bg-blue-600 border-blue-600' : 'border-slate-600 bg-slate-800'}`}
                onPress={() => { setRole(r); setCustomRole(''); }}
              >
                <Text className={`text-sm font-medium ${role === r && !customRole ? 'text-white' : 'text-slate-300'}`}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TextInput
            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white"
            placeholder="Or type a custom role..."
            placeholderTextColor="#64748b"
            value={customRole}
            onChangeText={setCustomRole}
          />
        </Section>

        {/* Level */}
        <Section title="Experience Level">
          <View className="flex-row gap-3">
            {LEVELS.map(l => (
              <TouchableOpacity
                key={l}
                className={`flex-1 py-3 rounded-xl items-center border ${level === l ? 'bg-blue-600 border-blue-600' : 'border-slate-600 bg-slate-800'}`}
                onPress={() => setLevel(l)}
              >
                <Text className={`text-xs font-semibold ${level === l ? 'text-white' : 'text-slate-300'}`}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Mode */}
        <Section title="Interview Mode">
          <View className="flex-row gap-3">
            {MODES.map(m => (
              <TouchableOpacity
                key={m.value}
                className={`flex-1 py-4 rounded-xl items-center border ${mode === m.value ? 'bg-blue-600 border-blue-600' : 'border-slate-600 bg-slate-800'}`}
                onPress={() => setMode(m.value)}
              >
                <Text className="text-2xl mb-1">{m.emoji}</Text>
                <Text className={`text-xs font-semibold ${mode === m.value ? 'text-white' : 'text-slate-300'}`}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Summary */}
        <View className="mx-6 mt-2 bg-slate-800 rounded-xl p-4">
          <Text className="text-slate-400 text-xs font-medium mb-2">YOUR SESSION</Text>
          <Text className="text-white font-medium">{finalRole}</Text>
          <Text className="text-slate-400 text-sm">{level} · {mode} mode</Text>
        </View>

        {/* Start button */}
        <View className="px-6 mt-6">
          <TouchableOpacity
            className="bg-blue-600 rounded-2xl py-5 items-center"
            onPress={startInterview}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Start Interview 🚀</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="px-6 mb-6">
      <Text className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">{title}</Text>
      {children}
    </View>
  );
}
