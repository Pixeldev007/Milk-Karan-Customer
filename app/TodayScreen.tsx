import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { getProducts, getSchedule, getToday, setOverride, Product } from '@/services/localData';

 type Row = {
  product: Product;
  litersMorning: number;
  litersEvening: number;
};

export default function TodayScreen() {
  const [date, setDate] = useState<Date>(new Date());
  const products = useMemo(() => getProducts(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [savedProductId, setSavedProductId] = useState<string | null>(null);

  const refresh = () => {
    const data = getToday(date) as Row[];
    setRows(data);
  };

  // Refresh on mount and every minute to keep the header date current.
  useEffect(() => {
    refresh();
    const id = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // If the calendar day changes, recompute rows for the new date.
  useEffect(() => {
    refresh();
  }, [date.toDateString()]);

  const setRow = (productId: string, patch: Partial<Row>) => {
    setRows(prev => prev.map(r => (r.product.id === productId ? { ...r, ...patch } : r)));
  };

  const saveRow = (productId: string) => {
    const r = rows.find(x => x.product.id === productId);
    if (!r) return;
    setOverride(date, {
      productId,
      type: 'adjust',
      litersMorning: r.litersMorning,
      litersEvening: r.litersEvening,
      date: '', // filled in service
    } as any);
    setSavedProductId(productId);
    refresh();
    setTimeout(() => setSavedProductId(null), 1000);
  };

  const skipRow = (productId: string) => {
    setOverride(date, { productId, type: 'skip', date: '' } as any);
    refresh();
  };

  const resetRow = (productId: string) => {
    const latest = getSchedule();
    const base = latest.lines.find(l => l.productId === productId);
    setOverride(date, {
      productId,
      type: 'adjust',
      litersMorning: base?.litersMorning ?? 0,
      litersEvening: base?.litersEvening ?? 0,
      date: '' as any,
    } as any);
    refresh();
  };

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const headerDate = `${dayNames[date.getDay()]}, ${String(date.getDate()).padStart(2,'0')} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;

  const history = useMemo(() => {
    const items: { key: string; label: string; total: number }[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(date);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      const label = `${dayNames[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      const rows = getToday(d) as Row[];
      const total = rows.reduce((sum, r) => sum + (r.litersMorning || 0) + (r.litersEvening || 0), 0);
      items.push({ key, label, total });
    }
    return items;
  }, [date.toDateString(), rows]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today&apos;s Order</Text>
      <Text style={styles.dateBadge}>{headerDate}</Text>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.product.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.productName}>{item.product.name}</Text>
            <View style={styles.row}> 
              <View style={styles.col}>
                <Text style={styles.label}>Morning (L)</Text>
                <TextInput
                  value={String(item.litersMorning ?? 0)}
                  onChangeText={(t) => setRow(item.product.id, { litersMorning: Number(t) || 0 })}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Evening (L)</Text>
                <TextInput
                  value={String(item.litersEvening ?? 0)}
                  onChangeText={(t) => setRow(item.product.id, { litersEvening: Number(t) || 0 })}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.btn, styles.skipBtn]} onPress={() => skipRow(item.product.id)}>
                <Text style={styles.btnText}>Skip Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={() => saveRow(item.product.id)}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.resetBtn]} onPress={() => resetRow(item.product.id)}>
                <Text style={styles.btnText}>Reset</Text>
              </TouchableOpacity>
            </View>
            {savedProductId === item.product.id && <Text style={styles.savedHint}>Saved</Text>}
          </View>
        )}
        ListFooterComponent={
          <View style={{ paddingTop: 12 }}>
            <Text style={styles.historyTitle}>History (last 7 days)</Text>
            {history.map(h => (
              <View key={h.key} style={styles.historyRow}>
                <Text style={styles.historyDate}>{h.label}</Text>
                <Text style={styles.historyValue}>{h.total > 0 ? `${h.total.toFixed(1)} L` : 'No order'}</Text>
              </View>
            ))}
            <View style={{ height: 8 }} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', color: '#2e7d32', marginBottom: 12 },
  dateBadge: { alignSelf: 'flex-start', backgroundColor: '#e8f5e9', color: '#1b5e20', borderColor: '#c8e6c9', borderWidth: 1, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgb(144, 238, 144)', borderRadius: 12, padding: 12, marginBottom: 10 },
  productName: { fontWeight: '700', marginBottom: 8, color: '#1b5e20' },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  label: { fontSize: 12, color: '#4f4f4f', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#c8e6c9', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#f9fff9', color: '#1b5e20', textAlign: 'center' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  skipBtn: { backgroundColor: '#ffb300' },
  saveBtn: { backgroundColor: '#2e7d32' },
  resetBtn: { backgroundColor: 'rgb(144, 238, 144)' },
  btnText: { color: '#fff', fontWeight: '700' },
  savedHint: { marginTop: 6, color: '#2e7d32' },
  historyTitle: { marginTop: 8, marginBottom: 6, fontWeight: '700', color: '#2e7d32' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  historyDate: { color: '#4f4f4f' },
  historyValue: { color: '#1b5e20', fontWeight: '700' },
});
