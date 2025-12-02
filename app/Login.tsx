import { registerCustomerPushToken } from '@/lib/notifications';
import { setCustomerSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Login() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const trimmedName = name.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    if (trimmedName.length < 2) {
      Alert.alert('Invalid name', 'Please enter your full name.');
      return false;
    }
    if (phoneDigits.length < 10) {
      Alert.alert('Invalid phone', 'Please enter a valid 10-digit phone number.');
      return false;
    }
    return true;
  };

  const onSignIn = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const phoneDigits = phone.replace(/\D/g, '');
      const trimmedName = name.trim();
      const { data, error } = await supabase.rpc('validate_customer', { p_name: trimmedName, p_phone: phoneDigits });
      if (error) {
        console.error('RPC validate error:', error);
        Alert.alert('Sign in failed', error.message);
        return;
      }
      if (data === true) {
        await setCustomerSession({ name: trimmedName, phone: phoneDigits });
        await registerCustomerPushToken(trimmedName, phoneDigits);
        navigation.reset({ index: 0, routes: [{ name: '(tabs)' }] });
      } else {
        Alert.alert('Invalid credentials', 'Name or phone number is incorrect.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue managing your dairy business.</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          placeholder="Your name"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
          style={styles.input}
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Text style={[styles.label, { marginTop: 10 }]}>Phone Number</Text>
        <TextInput
          placeholder="Enter your phone number"
          placeholderTextColor="#9ca3af"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^0-9+\s-]/g, ''))}
          style={styles.input}
          keyboardType="phone-pad"
          returnKeyType="done"
          maxLength={16}
        />

        {/* No OTP required */}

        <TouchableOpacity style={styles.signInBtn} onPress={onSignIn} disabled={loading}>
          <Text style={styles.signInText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '90%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#bebebe', shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#01559d', marginBottom: 6 },
  subtitle: { color: '#6b7280', marginBottom: 14 },
  label: { color: '#01559d', fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#bebebe', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#ffffff', color: '#01559d' },
  signInBtn: { backgroundColor: '#01559d', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  signInText: { color: '#fff', fontWeight: '800' },
  footerText: { textAlign: 'center', marginTop: 12, color: '#01559d' },
  footerLink: { fontWeight: '800', color: '#01559d' },
});
