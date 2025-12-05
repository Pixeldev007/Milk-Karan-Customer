import { clearCustomerSession } from '@/lib/session';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.icon}>👤</Text>
        <Text style={styles.text}>Update Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.text}>Change Password</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.icon}>📄</Text>
        <Text style={styles.text}>Terms And Conditions</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.item}
        onPress={async () => {
          await clearCustomerSession();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }}
      >
        <Text style={styles.icon}>🚪</Text>
        <Text style={styles.text}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 16 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 10, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#bebebe' },
  icon: { fontSize: 20, marginRight: 16 },
  text: { fontSize: 16, fontWeight: 'bold' },
});
