import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { getProducts, getSchedule, saveSchedule, Product, Schedule, ScheduleLine } from '@/services/localData';

export default function PlanScreen() {
  const products = useMemo<Product[]>(() => getProducts(), []);
  const [draft, setDraft] = useState<Schedule>(() => getSchedule());
  const [saved, setSaved] = useState(false);
  const [paused, setPaused] = useState(false);

  const linesById = useMemo<Record<string, ScheduleLine>>(() => {
    const map: Record<string, ScheduleLine> = {};
    for (const p of products) {
      const existing = draft.lines.find(l => l.productId === p.id);
      map[p.id] = existing ?? { productId: p.id, litersMorning: 0, litersEvening: 0 };
    }
    return map;
  }, [products, draft]);

  const setLine = (productId: string, partial: Partial<ScheduleLine>) => {
    setSaved(false);
    setDraft(prev => {
      const next: Schedule = { lines: [...prev.lines] };
      const idx = next.lines.findIndex(l => l.productId === productId);
      const base = idx >= 0 ? next.lines[idx] : { productId, litersMorning: 0, litersEvening: 0 } as ScheduleLine;
      const merged = { ...base, ...partial } as ScheduleLine;
      if (idx >= 0) next.lines[idx] = merged; else next.lines.push(merged);
      return next;
    });
  };

  const handleSave = () => {
    saveSchedule(draft);
    setSaved(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Plan</Text>

      <View style={styles.pauseRow}>
        <Text style={styles.pauseLabel}>Pause Plan</Text>
        <TouchableOpacity style={[styles.pauseBtn, paused && styles.pauseBtnActive]} onPress={() => setPaused(p => !p)}>
          <Text style={[styles.pauseText, paused && styles.pauseTextActive]}>{paused ? 'Paused' : 'Active'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => {
          const line = linesById[item.id];
          const disabled = paused;
          return (
            <View style={[styles.card, disabled && {opacity: 0.6}]}> 
              <Text style={styles.productName}>{item.name} · ₹{item.pricePerLiter}/L</Text>
              <View style={styles.row}> 
                <View style={styles.col}>
                  <Text style={styles.label}>Morning (L)</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity disabled={disabled} style={styles.stepperBtn} onPress={() => setLine(item.id, { litersMorning: Math.max(0, (line.litersMorning || 0) - 0.5) })}><Text style={styles.stepperText}>-</Text></TouchableOpacity>
                    <TextInput
                      editable={!disabled}
                      value={String(line.litersMorning ?? 0)}
                      onChangeText={(t) => setLine(item.id, { litersMorning: Number(t) || 0 })}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                    <TouchableOpacity disabled={disabled} style={styles.stepperBtn} onPress={() => setLine(item.id, { litersMorning: (line.litersMorning || 0) + 0.5 })}><Text style={styles.stepperText}>+</Text></TouchableOpacity>
                  </View>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Evening (L)</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity disabled={disabled} style={styles.stepperBtn} onPress={() => setLine(item.id, { litersEvening: Math.max(0, (line.litersEvening || 0) - 0.5) })}><Text style={styles.stepperText}>-</Text></TouchableOpacity>
                    <TextInput
                      editable={!disabled}
                      value={String(line.litersEvening ?? 0)}
                      onChangeText={(t) => setLine(item.id, { litersEvening: Number(t) || 0 })}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                    <TouchableOpacity disabled={disabled} style={styles.stepperBtn} onPress={() => setLine(item.id, { litersEvening: (line.litersEvening || 0) + 0.5 })}><Text style={styles.stepperText}>+</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 8 }} />}
      />

      <TouchableOpacity disabled={paused} style={[styles.saveBtn, paused && {opacity: 0.6}]} onPress={handleSave}>
        <Text style={styles.saveText}>Save Plan</Text>
      </TouchableOpacity>
      {saved && <Text style={styles.savedHint}>Saved!</Text>}

      <View style={{ height: 8 }} />
      <Text style={styles.subTitle}>Skips & Exceptions (UI only)</Text>
      <View style={styles.skipBox}>
        <Text style={styles.skipHint}>In future, you will manage pause ranges and skip specific dates here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', color: '#2e7d32', marginBottom: 12 },
  subTitle: { fontSize: 16, fontWeight: '700', color: '#2e7d32', marginTop: 8, marginBottom: 6 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgb(144, 238, 144)', borderRadius: 12, padding: 12, marginBottom: 10 },
  productName: { fontWeight: '700', marginBottom: 8, color: '#1b5e20' },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  label: { fontSize: 12, color: '#4f4f4f', marginBottom: 6 },
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepperBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgb(144, 238, 144)', alignItems: 'center', justifyContent: 'center' },
  stepperText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  input: { flex: 1, marginHorizontal: 8, borderWidth: 1, borderColor: '#c8e6c9', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#f9fff9', color: '#1b5e20', textAlign: 'center' },
  saveBtn: { backgroundColor: '#2e7d32', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontWeight: '700' },
  savedHint: { textAlign: 'center', color: '#2e7d32', marginTop: 8 },
  pauseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  pauseLabel: { color: '#1b5e20', fontWeight: '700' },
  pauseBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: '#c8e6c9' },
  pauseBtnActive: { backgroundColor: '#ffb300', borderColor: '#ffb300' },
  pauseText: { color: '#1b5e20', fontWeight: '700' },
  pauseTextActive: { color: '#fff' },
  skipBox: { backgroundColor: '#e8f5e9', borderColor: '#c8e6c9', borderWidth: 1, borderRadius: 10, padding: 10 },
  skipHint: { color: '#1b5e20' },
});
