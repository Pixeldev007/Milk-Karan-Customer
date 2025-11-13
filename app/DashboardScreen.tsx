import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

import { getCustomerSession } from '@/lib/session';
import { getCustomerId } from '@/lib/customers';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

type ShiftRow = {
  date: string;
  shift: 'morning' | 'evening';
  liters: number;
  delivered: boolean;
  delivered_at: string | null;
  delivery_agent_id: string | null;
  delivery_agent_name: string | null;
  delivery_agent_phone: string | null;
};

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [rows, setRows] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const session = await getCustomerSession();
      if (!mounted) return;
      if (!session?.phone) {
        setCustomerId(null);
        return;
      }
      const id = await getCustomerId(session.name, session.phone);
      if (mounted) setCustomerId(id);
    })();
    return () => { mounted = false; };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        const session = await getCustomerSession();
        if (!active) return;
        if (!session?.phone) {
          setCustomerId(null);
          return;
        }
        const id = await getCustomerId(session.name, session.phone);
        if (active) setCustomerId(id);
      })();
      return () => { active = false; };
    }, [])
  );

  const loadDay = useCallback(async () => {
    if (!customerId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_customer_day_details', {
        p_customer_id: customerId,
        p_date: null,
      });
      if (error) throw error;
      setRows((data ?? []).map((r: any) => ({
        date: r.date,
        shift: r.shift,
        liters: Number(r.liters ?? 0),
        delivered: !!r.delivered,
        delivered_at: r.delivered_at ?? null,
        delivery_agent_id: r.delivery_agent_id ?? null,
        delivery_agent_name: r.delivery_agent_name ?? null,
        delivery_agent_phone: r.delivery_agent_phone ?? null,
      })));
    } catch (error) {
      console.error('get_customer_day_details error', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (!customerId) {
      setRows([]);
      return;
    }
    loadDay();
  }, [customerId, loadDay]);

  useEffect(() => {
    if (!customerId) return;
    const sub = supabase
      .channel(`dd-customer-${customerId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'daily_deliveries',
        filter: `customer_id=eq.${customerId}`,
      }, () => loadDay())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [customerId, loadDay]);

  const morning = useMemo(() => rows.find(r => r.shift === 'morning') || null, [rows]);
  const evening = useMemo(() => rows.find(r => r.shift === 'evening') || null, [rows]);

  const agentName = useMemo(() => {
    return morning?.delivery_agent_name || evening?.delivery_agent_name || '—';
  }, [morning, evening]);

  const agentPhone = useMemo(() => {
    return morning?.delivery_agent_phone || evening?.delivery_agent_phone || '—';
  }, [morning, evening]);

  const today = useMemo(() => new Date(), []);
  const calendarDays = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 3);
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      const isToday = d.toDateString() === today.toDateString();
      return {
        key: d.toISOString().slice(0, 10),
        day: d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
        date: d.getDate(),
        isToday,
      };
    });
  }, [today]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
          setRefreshing(true);
          await loadDay();
          setRefreshing(false);
        }} />}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <Text style={styles.menuIcon}>☰</Text>
            <Text style={styles.appTitle}>Milk Wala</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.calendarRow}>
            {calendarDays.map((item) => (
              <View key={item.key} style={[styles.calendarCell, item.isToday && styles.calendarCellActive]}>
                <Text style={[styles.calendarDay, item.isToday && styles.calendarDayActive]}>{item.day}</Text>
                <Text style={[styles.calendarDate, item.isToday && styles.calendarDateActive]}>{item.date}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.headerDate}>{today.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Delivery Boy</Text>
          <Text style={styles.cardValue}>{agentName}</Text>
          <Text style={styles.cardSub}>{agentPhone}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Order</Text>
          <View style={styles.shiftRow}>
            <Text style={styles.shiftLabel}>Morning</Text>
            <View style={styles.shiftDetail}>
              <Text style={styles.shiftValue}>{Number(morning?.liters ?? 0).toFixed(1)} L</Text>
              <Text style={[styles.shiftStatus, morning?.delivered ? styles.shiftStatusDone : styles.shiftStatusPending]}>
                {morning?.delivered ? 'Delivered' : 'Pending'}
              </Text>
            </View>
          </View>
          {morning?.delivered_at ? (
            <Text style={styles.shiftMeta}>Delivered at {new Date(morning.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          ) : null}

          <View style={[styles.shiftRow, { marginTop: 12 }]}>
            <Text style={styles.shiftLabel}>Evening</Text>
            <View style={styles.shiftDetail}>
              <Text style={styles.shiftValue}>{Number(evening?.liters ?? 0).toFixed(1)} L</Text>
              <Text style={[styles.shiftStatus, evening?.delivered ? styles.shiftStatusDone : styles.shiftStatusPending]}>
                {evening?.delivered ? 'Delivered' : 'Pending'}
              </Text>
            </View>
          </View>
          {evening?.delivered_at ? (
            <Text style={styles.shiftMeta}>Delivered at {new Date(evening.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          ) : null}

          {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> : null}
        </View>

        <View style={styles.tileGrid}>
          <MenuTile
            label="My Orders"
            icon="🧾"
            onPress={() => navigation.navigate('My Orders')}
          />
          <MenuTile
            label="Transactions"
            icon="📊"
            onPress={() => navigation.navigate('Transactions')}
          />
          <MenuTile
            label="Payments"
            icon="💵"
            onPress={() => navigation.navigate('Payment')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function MenuTile({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" style={styles.tile} onPress={onPress}>
      <View style={styles.tileIconCircle}>
        <Text style={styles.tileIcon}>{icon}</Text>
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#e8f5e9' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  headerCard: { backgroundColor: '#90ee90', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
  appTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  calendarCell: { alignItems: 'center', padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', flex: 1, marginHorizontal: 4 },
  calendarCellActive: { backgroundColor: '#fff' },
  calendarDay: { color: '#f2fef2', fontWeight: '600', fontSize: 11 },
  calendarDayActive: { color: '#90ee90' },
  calendarDate: { marginTop: 4, color: '#f2fef2', fontWeight: '700', fontSize: 16 },
  calendarDateActive: { color: '#90ee90' },
  headerDate: { marginTop: 16, color: '#fff', fontWeight: '700', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontWeight: '700', fontSize: 16, color: '#90ee90', marginBottom: 4 },
  cardValue: { fontSize: 15, fontWeight: '600', color: '#90ee90' },
  cardSub: { color: '#4f4f4f', marginTop: 2 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  shiftLabel: { fontWeight: '600', color: '#1b5e20' },
  shiftDetail: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shiftValue: { fontWeight: '700', color: '#1b5e20' },
  shiftStatus: { fontWeight: '600' },
  shiftStatusDone: { color: '#2e7d32' },
  shiftStatusPending: { color: '#a1a1a1' },
  shiftMeta: { color: '#4f4f4f', marginTop: 4 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  tile: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexBasis: '30%', flexGrow: 1, borderWidth: 1, borderColor: '#c8e6c9', shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 1 },
  tileIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#90ee90', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileIcon: { fontSize: 22, color: '#fff' },
  tileLabel: { fontWeight: '700', color: '#1b5e20' },
});
