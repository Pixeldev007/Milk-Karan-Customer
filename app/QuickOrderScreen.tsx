import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { getProducts, getToday, setOverride, Product } from '@/services/localData';

export default function QuickOrderScreen() {
  const [slotAM, setSlotAM] = useState(true);
  const [slotPM, setSlotPM] = useState(false);
  const [date] = useState<Date>(new Date());
  const products = useMemo(() => getProducts(), []);
  const rows = useMemo(() => getToday(date) as { product: Product; litersMorning: number; litersEvening: number }[], [date.toDateString()]);
  const [qty, setQty] = useState<Record<string, { am: number; pm: number }>>(() => {
    const map: Record<string, { am: number; pm: number }> = {};
    rows.forEach(r => { map[r.product.id] = { am: 0, pm: 0 }; });
    return map;
  });

  const toggle = (key: 'am' | 'pm', id: string, delta: number) => {
    setQty(prev => {
      const cur = prev[id] ?? { am: 0, pm: 0 };
      const next = { ...cur, [key]: Math.max(0, Number((cur as any)[key]) + delta) } as { am: number; pm: number };
      return { ...prev, [id]: next };
    });
  };

  const totalLiters = products.reduce((s, p) => s + (slotAM ? (qty[p.id]?.am || 0) : 0) + (slotPM ? (qty[p.id]?.pm || 0) : 0), 0);
  const totalAmount = products.reduce((s, p) => s + ((slotAM ? (qty[p.id]?.am || 0) : 0) + (slotPM ? (qty[p.id]?.pm || 0) : 0)) * p.pricePerLiter, 0);

  const placeOrder = () => {
    // Save as overrides for today
    products.forEach(p => {
      const v = qty[p.id] || { am: 0, pm: 0 };
      setOverride(date, {
        productId: p.id,
        type: 'adjust',
        litersMorning: slotAM ? v.am : 0,
        litersEvening: slotPM ? v.pm : 0,
        date: '' as any,
      } as any);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Order (Today)</Text>
      <View style={styles.slotRow}>
        <TouchableOpacity style={[styles.slotBtn, slotAM && styles.slotActive]} onPress={() => setSlotAM(s => !s)}><Text style={[styles.slotText, slotAM && styles.slotActiveText]}>Morning</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.slotBtn, slotPM && styles.slotActive]} onPress={() => setSlotPM(s => !s)}><Text style={[styles.slotText, slotPM && styles.slotActiveText]}>Evening</Text></TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => {
          const v = qty[item.id] || { am: 0, pm: 0 };
          return (
            <View style={styles.card}>
              <Text style={styles.productName}>{item.name} · ₹{item.pricePerLiter}/L</Text>
              {slotAM && (
                <View style={styles.row}>
                  <Text style={styles.label}>AM (L)</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => toggle('am', item.id, -0.5)}><Text style={styles.stepperText}>-</Text></TouchableOpacity>
                    <Text style={styles.qtyVal}>{v.am.toFixed(1)}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => toggle('am', item.id, +0.5)}><Text style={styles.stepperText}>+</Text></TouchableOpacity>
                  </View>
                </View>
              )}
              {slotPM && (
                <View style={styles.row}>
                  <Text style={styles.label}>PM (L)</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => toggle('pm', item.id, -0.5)}><Text style={styles.stepperText}>-</Text></TouchableOpacity>
                    <Text style={styles.qtyVal}>{v.pm.toFixed(1)}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => toggle('pm', item.id, +0.5)}><Text style={styles.stepperText}>+</Text></TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 8 }} />}
      />

      <View style={styles.footer}>
        <Text style={styles.summary}>{totalLiters.toFixed(1)} L • ₹{totalAmount.toFixed(0)}</Text>
        <TouchableOpacity style={styles.placeBtn} onPress={placeOrder} disabled={!slotAM && !slotPM}>
          <Text style={styles.placeText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#2e7d32', marginBottom: 12 },
  slotRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  slotBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#c8e6c9' },
  slotActive: { backgroundColor: 'rgb(144, 238, 144)', borderColor: 'rgb(144, 238, 144)' },
  slotText: { color: '#1b5e20', fontWeight: '700' },
  slotActiveText: { color: '#fff' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgb(144, 238, 144)', borderRadius: 12, padding: 12, marginBottom: 10 },
  productName: { fontWeight: '700', marginBottom: 8, color: '#1b5e20' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#4f4f4f' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgb(144, 238, 144)', alignItems: 'center', justifyContent: 'center' },
  stepperText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  qtyVal: { minWidth: 48, textAlign: 'center', color: '#1b5e20', fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summary: { color: '#1b5e20', fontWeight: '700' },
  placeBtn: { backgroundColor: '#2e7d32', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  placeText: { color: '#fff', fontWeight: '700' },
});
