export type CustomerSession = {
  name: string;
  phone: string;
};

const STORAGE_KEY = 'customer_session';

export async function setCustomerSession(session: CustomerSession) {
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    // no-op
  }
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
