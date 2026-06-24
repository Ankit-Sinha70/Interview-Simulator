import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiRequest } from '@/services/api';

interface Session {
  _id: string;
  role: string;
  experienceLevel: string;
  mode: string;
  overallScore: number;
  status: string;
  createdAt: string;
  totalQuestions?: number;
}

export default function ReportsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchSessions() {
    try {
      const res = await apiRequest<{ data: Session[] }>('/interview/sessions');
      setSessions(res.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchSessions(); }, []);

  function onRefresh() {
    setRefreshing(true);
    fetchSessions();
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="px-6 pt-4 pb-4">
        <Text className="text-white text-2xl font-bold">Reports</Text>
        <Text className="text-slate-400 text-sm mt-1">Your interview history</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#3b82f6" className="mt-12" />
      ) : (
        <ScrollView
          className="flex-1 px-6"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        >
          {sessions.length === 0 ? (
            <View className="bg-slate-800 rounded-xl p-8 items-center mt-4">
              <Text className="text-4xl mb-3">📋</Text>
              <Text className="text-white font-semibold mb-1">No reports yet</Text>
              <Text className="text-slate-400 text-sm text-center">Complete an interview to see your performance report here.</Text>
            </View>
          ) : (
            sessions.map(session => (
              <TouchableOpacity
                key={session._id}
                className="bg-slate-800 rounded-xl p-4 mb-3"
                onPress={() => router.push(`/report/${session._id}`)}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-white font-semibold" numberOfLines={1}>{session.role}</Text>
                    <Text className="text-slate-400 text-xs mt-0.5">
                      {session.experienceLevel} · {session.mode} mode
                    </Text>
                    <Text className="text-slate-500 text-xs mt-0.5">
                      {new Date(session.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <ScoreBadge score={session.overallScore} />
                </View>
              </TouchableOpacity>
            ))
          )}
          <View className="h-8" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const bg = score >= 75 ? 'bg-green-900' : score >= 50 ? 'bg-yellow-900' : 'bg-red-900';
  const text = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  return (
    <View className={`${bg} rounded-xl px-3 py-2 items-center`}>
      <Text className={`${text} font-bold text-lg`}>{score?.toFixed(0) ?? 0}</Text>
      <Text className={`${text} text-xs`}>/ 100</Text>
    </View>
  );
}
