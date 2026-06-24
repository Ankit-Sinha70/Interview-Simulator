import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/services/api';

interface DashboardStats {
  totalSessions: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number;
}

interface RecentSession {
  _id: string;
  role: string;
  overallScore: number;
  createdAt: string;
  status: string;
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchDashboard() {
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        apiRequest<{ data: DashboardStats }>('/analytics/stats'),
        apiRequest<{ data: RecentSession[] }>('/interview/sessions?limit=5'),
      ]);
      setStats(statsRes.data);
      setSessions(sessionsRes.data || []);
    } catch {
      // silently fail — stats just won't show
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchDashboard(); }, []);

  function onRefresh() {
    setRefreshing(true);
    fetchDashboard();
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-slate-400 text-sm">Welcome back,</Text>
          <Text className="text-white text-2xl font-bold">{user?.name?.split(' ')[0] ?? 'Ankit'} 👋</Text>
        </View>

        {/* Stats row */}
        {loading ? (
          <ActivityIndicator color="#3b82f6" className="my-8" />
        ) : (
          <View className="flex-row px-6 gap-3 mb-6">
            <StatCard label="Sessions" value={stats?.totalSessions ?? 0} emoji="🎯" />
            <StatCard label="Avg Score" value={`${stats?.averageScore?.toFixed(0) ?? 0}%`} emoji="📈" />
            <StatCard label="Best" value={`${stats?.bestScore?.toFixed(0) ?? 0}%`} emoji="🏆" />
          </View>
        )}

        {/* Quick start */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            className="bg-blue-600 rounded-2xl p-5 flex-row items-center justify-between"
            onPress={() => router.push('/(tabs)/interview')}
          >
            <View>
              <Text className="text-white text-lg font-bold">Start Interview</Text>
              <Text className="text-blue-200 text-sm mt-1">Practice makes perfect</Text>
            </View>
            <Text className="text-4xl">🎤</Text>
          </TouchableOpacity>
        </View>

        {/* Recent sessions */}
        <View className="px-6">
          <Text className="text-white font-semibold text-base mb-3">Recent Sessions</Text>
          {sessions.length === 0 ? (
            <View className="bg-slate-800 rounded-xl p-6 items-center">
              <Text className="text-slate-400 text-sm">No sessions yet. Start your first interview!</Text>
            </View>
          ) : (
            sessions.map(session => (
              <SessionCard key={session._id} session={session} />
            ))
          )}
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: string | number; emoji: string }) {
  return (
    <View className="flex-1 bg-slate-800 rounded-xl p-3 items-center">
      <Text className="text-xl mb-1">{emoji}</Text>
      <Text className="text-white font-bold text-lg">{value}</Text>
      <Text className="text-slate-400 text-xs">{label}</Text>
    </View>
  );
}

function SessionCard({ session }: { session: RecentSession }) {
  const score = session.overallScore ?? 0;
  const scoreColor = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const date = new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View className="bg-slate-800 rounded-xl p-4 mb-3 flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-white font-medium" numberOfLines={1}>{session.role}</Text>
        <Text className="text-slate-400 text-xs mt-0.5">{date}</Text>
      </View>
      <Text className={`font-bold text-lg ${scoreColor}`}>{score.toFixed(0)}%</Text>
    </View>
  );
}
