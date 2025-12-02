import { getCustomerId } from '@/lib/customers';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';

export async function registerCustomerPushToken(name: string, phone: string) {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    const expoToken = token.data;
    if (!expoToken) return;

    const customerId = await getCustomerId(name, phone);
    if (!customerId) return;

    await supabase
      .from('device_tokens')
      .upsert(
        {
          user_id: customerId,
          role: 'customer',
          expo_push_token: expoToken,
        },
        { onConflict: 'user_id,role' }
      );
  } catch (e) {
    console.log('Failed to register push token', e);
  }
}
