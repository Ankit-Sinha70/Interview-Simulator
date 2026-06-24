import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function confirmLogout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  }

  const initials = user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U';

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-white text-2xl font-bold">Profile</Text>
        </View>

        {/* Avatar + name */}
        <View className="items-center pb-8">
          <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center mb-3">
            <Text className="text-white text-3xl font-bold">{initials}</Text>
          </View>
          <Text className="text-white text-xl font-bold">{user?.name}</Text>
          <Text className="text-slate-400 text-sm mt-0.5">{user?.email}</Text>
          <View className={`mt-2 px-3 py-1 rounded-full ${user?.subscription?.plan === 'premium' ? 'bg-yellow-900' : 'bg-slate-700'}`}>
            <Text className={`text-xs font-semibold ${user?.subscription?.plan === 'premium' ? 'text-yellow-400' : 'text-slate-400'}`}>
              {user?.subscription?.plan === 'premium' ? '⭐ Premium' : 'Free Plan'}
            </Text>
          </View>
        </View>

        {/* Menu items */}
        <View className="px-6 gap-2">
          <MenuItem emoji="✏️" label="Edit Profile" onPress={() => router.push('/edit-profile')} />
          <MenuItem emoji="🔒" label="Change Password" onPress={() => router.push('/change-password')} />
          <MenuItem emoji="💳" label="Subscription" onPress={() => router.push('/subscription')} />
          <MenuItem emoji="🔔" label="Notifications" onPress={() => router.push('/notifications')} />
          <MenuItem emoji="❓" label="Help & Support" onPress={() => router.push('/support')} />

          <View className="h-4" />

          <TouchableOpacity
            className="bg-red-900/40 border border-red-800 rounded-xl p-4 flex-row items-center"
            onPress={confirmLogout}
          >
            <Text className="text-xl mr-3">🚪</Text>
            <Text className="text-red-400 font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      className="bg-slate-800 rounded-xl p-4 flex-row items-center justify-between"
      onPress={onPress}
    >
      <View className="flex-row items-center">
        <Text className="text-xl mr-3">{emoji}</Text>
        <Text className="text-white font-medium">{label}</Text>
      </View>
      <Text className="text-slate-500">›</Text>
    </TouchableOpacity>
  );
}
