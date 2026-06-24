import { ReactNode } from 'react';
import {
  View, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native';

export default function AuthContainer({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any } : {}),
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  card: {
    width: '100%',
    ...(Platform.OS === 'web' ? { maxWidth: 440 } : {}),
  },
});
