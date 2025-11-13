import { getCustomerId } from '@/lib/customers';
import { listCustomerDeliveries } from '@/lib/dailyDeliveries';
import { getCustomerSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, FlatList, Text, View } from 'react-native';

type OrderRow = {
  date: string;
  shift: 'morning' | 'evening';
  liters: number;
  delivered: boolean;
  delivered_at: string | null;
  delivery_agent_name: string | null;
  delivery_agent_phone: string | null;
};

export default function MyOrdersScreen() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const session = await getCustomerSession();
      if (!session?.phone) { setCustomerId(null); return; }
      const id = await getCustomerId(session.name, session.phone);
      setCustomerId(id);
    })();
  }, []);

  const loadOrders = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const data = await listCustomerDeliveries({ customerId, date: selectedDate });
      setRows(data as any);
    } finally {
      setLoading(false);
    }
  }, [customerId, selectedDate]);

  useEffect(() => {
    loadOrders();
    if (!customerId) return;
    const sub = supabase
      .channel(`dd-customer-${customerId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'daily_deliveries',
        filter: `customer_id=eq.${customerId}`,
      }, () => loadOrders())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [customerId, loadOrders]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.navigate('Dashboard');
        return true;
      });
      return () => sub.remove();
    }, [navigation])
  );

  if (loading && rows.length === 0) return <ActivityIndicator />;

  return (
    <FlatList
      data={rows}
      keyExtractor={(item, idx) => `${item.date}-${item.shift}-${idx}`}
      renderItem={({ item }) => (
        <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' }}>
          <Text style={{ fontWeight: '700', color: '#1b5e20' }}>{item.date} • {item.shift === 'morning' ? 'Morning' : 'Evening'}</Text>
          <Text style={{ color: '#1b5e20' }}>{item.liters.toFixed(1)} L • {item.delivered ? 'Delivered' : 'Pending'}</Text>
          {item.delivered_at ? <Text style={{ color: '#4f4f4f' }}>Delivered at {new Date(item.delivered_at).toLocaleString()}</Text> : null}
          {item.delivery_agent_name ? <Text style={{ color: '#4f4f4f' }}>Agent: {item.delivery_agent_name} ({item.delivery_agent_phone})</Text> : null}
        </View>
      )}
      ListEmptyComponent={() => <Text style={{ padding: 16, color: '#666' }}>No orders in the recent period</Text>}
    />
  );
}
