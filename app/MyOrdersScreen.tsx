import { getCustomerId } from '@/lib/customers';
import { listMyOrdersDetailed } from '@/lib/orders';
import { getCustomerSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, FlatList, StyleSheet, Text, View } from 'react-native';

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
      const today = new Date();
      const from = new Date();
      from.setDate(today.getDate() - 30);

      const fromStr = from.toISOString().slice(0, 10);
      const toStr = today.toISOString().slice(0, 10);

      const data = await listMyOrdersDetailed(customerId, fromStr, toStr);
      const mapped: OrderRow[] = data.map((r: any) => ({
        date: r.date,
        shift: (r.shift ?? '').toString().toLowerCase().includes('even') || (r.shift ?? '').toString().toLowerCase().includes('pm') ? 'evening' : 'morning',
        liters: Number(r.liters ?? 0),
        delivered: !!r.delivered,
        delivered_at: r.deliveredAt ?? null,
        delivery_agent_name: r.deliveryAgentName ?? null,
        delivery_agent_phone: r.deliveryAgentPhone ?? null,
      }));
      setRows(mapped);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

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

  if (loading && rows.length === 0) return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <FlatList
        style={{ backgroundColor: '#ffffff' }}
        contentContainerStyle={{ backgroundColor: '#ffffff', padding: 12 }}
        data={rows}
        keyExtractor={(item, idx) => `${item.date}-${item.shift}-${idx}`}
        renderItem={({ item }) => (
          <View style={styles.orderBox}>
            <Text style={{ fontWeight: '700', color: '#01559d' }}>{item.date} • {item.shift === 'morning' ? 'Morning' : 'Evening'}</Text>
            <Text style={{ color: '#01559d' }}>{item.liters.toFixed(1)} L • {item.delivered ? 'Delivered' : 'Pending'}</Text>
            {item.delivered_at ? <Text style={{ color: '#4f4f4f' }}>Delivered at {new Date(item.delivered_at).toLocaleString()}</Text> : null}
            {item.delivery_agent_name ? <Text style={{ color: '#4f4f4f' }}>Agent: {item.delivery_agent_name} ({item.delivery_agent_phone})</Text> : null}
          </View>
        )}
        ListEmptyComponent={() => <Text style={{ padding: 16, color: '#666' }}>No orders in the recent period</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orderBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bebebe'
  }
});
