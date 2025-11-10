import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ScrollView, TextInput } from 'react-native';
import TodayBadge from '@/components/TodayBadge';
import { getProducts, getSchedule, getToday, repeatOrder, setOverride } from '@/services/localData';

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export default function MyOrdersScreen() {
  // Today & Schedule data
  const [now, setNow] = useState(new Date());
  const products = useMemo(() => getProducts(), []);
  const [rows, setRows] = useState<{ product: { id: string; name: string; pricePerLiter: number }; litersMorning: number; litersEvening: number }[]>([]);
  
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const headerDate = `${dayNames[now.getDay()]}, ${String(now.getDate()).padStart(2,'0')} ${monthShort[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const refreshToday = () => setRows(getToday(now) as any);
  useEffect(() => { refreshToday(); }, [now.toDateString()]);
  useEffect(() => { refreshToday(); }, []);

  const setTodayRow = (productId: string, patch: Partial<{ litersMorning: number; litersEvening: number }>) => {
    setRows(prev => prev.map(r => (r.product.id === productId ? { ...r, ...patch } as any : r)));
  };
  const saveTodayAll = () => {
    rows.forEach(r => setOverride(now, { productId: r.product.id, type: 'adjust', litersMorning: r.litersMorning, litersEvening: r.litersEvening, date: '' } as any));
    refreshToday();
  };
  const skipTodayAll = () => {
    rows.forEach(r => setOverride(now, { productId: r.product.id, type: 'skip', date: '' } as any));
    refreshToday();
  };
  const resetTodayAll = () => {
    const latest = getSchedule();
    latest.lines.forEach(l => setOverride(now, { productId: l.productId, type: 'adjust', litersMorning: l.litersMorning || 0, litersEvening: l.litersEvening || 0, date: '' } as any));
    refreshToday();
  };

  

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(new Date().getMonth());
  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y, y-1, y-2];
  }, []);

  const items = useMemo(() => {
    const list: { key: string; label: string; totalLiters: number; date: Date }[] = [];
    const count = daysInMonth(selectedYear, selectedMonthIndex);
    for (let d = count; d >= 1; d--) {
      const date = new Date(selectedYear, selectedMonthIndex, d);
      const rows = getToday(date) as any[];
      const total = rows.reduce((s, r) => s + (r.litersMorning || 0) + (r.litersEvening || 0), 0);
      const label = `${String(d).padStart(2,'0')} ${monthNames[selectedMonthIndex]} ${selectedYear}`;
      list.push({ key: date.toISOString().slice(0,10), label, totalLiters: total, date });
    }
    return list;
  }, [selectedYear, selectedMonthIndex]);

  const monthlyTotals = useMemo(() => {
    let liters = 0;
    let amount = 0;
    const count = daysInMonth(selectedYear, selectedMonthIndex);
    for (let d = 1; d <= count; d++) {
      const date = new Date(selectedYear, selectedMonthIndex, d);
      const rows = getToday(date) as { product: { pricePerLiter: number }; litersMorning: number; litersEvening: number }[];
      for (const r of rows) {
        const l = (r.litersMorning || 0) + (r.litersEvening || 0);
        liters += l;
        amount += l * (r.product.pricePerLiter || 0);
      }
    }
    return { liters, amount };
  }, [selectedYear, selectedMonthIndex]);

  const handleRepeatForToday = (fromDate: Date) => {
    const toDate = new Date();
    repeatOrder(fromDate, toDate);
    Alert.alert('Order repeated', 'Repeated this day\'s order for today.');
  };

  const goPrevMonth = () => {
    if (selectedMonthIndex === 0) {
      setSelectedMonthIndex(11);
      setSelectedYear(y => y - 1);
    } else setSelectedMonthIndex(i => i - 1);
  };
  const goNextMonth = () => {
    if (selectedMonthIndex === 11) {
      setSelectedMonthIndex(0);
      setSelectedYear(y => y + 1);
    } else setSelectedMonthIndex(i => i + 1);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <TodayBadge />
      {/* Today Editor */}
      <View style={styles.card}>
        <View style={styles.todayHeaderRow}>
          <Text style={styles.todayTitle}>Today's Order</Text>
          <Text style={styles.dateBadge}>{headerDate}</Text>
        </View>
        {rows.map(r => (
          <View key={r.product.id} style={styles.todayRow}>
            <Text style={[styles.todayCell, {flex: 1.4}]}>{r.product.name}</Text>
            <View style={{flexDirection:'row', alignItems:'center', gap: 6, flex: 1}}>
              <Text style={styles.todayCell}>AM</Text>
              <TextInput value={String(r.litersMorning || 0)} onChangeText={(t)=>setTodayRow(r.product.id,{litersMorning:Number(t)||0})} keyboardType="numeric" style={styles.input} />
            </View>
            <View style={{flexDirection:'row', alignItems:'center', gap: 6, flex: 1}}>
              <Text style={styles.todayCell}>PM</Text>
              <TextInput value={String(r.litersEvening || 0)} onChangeText={(t)=>setTodayRow(r.product.id,{litersEvening:Number(t)||0})} keyboardType="numeric" style={styles.input} />
            </View>
          </View>
        ))}
        <View style={styles.todayFooter}>
          <View style={{flexDirection:'row', gap: 8}}>
            <TouchableOpacity style={styles.quickBtn} onPress={saveTodayAll}><Text style={styles.quickBtnText}>Save</Text></TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={skipTodayAll}><Text style={styles.quickBtnText}>Skip Today</Text></TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={resetTodayAll}><Text style={styles.quickBtnText}>Reset</Text></TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Month/Year Filter moved below Schedule */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goPrevMonth}><Text style={styles.navBtn}>◀</Text></TouchableOpacity>
        <Text style={styles.title}>{monthNames[selectedMonthIndex]} {selectedYear}</Text>
        <TouchableOpacity onPress={goNextMonth}><Text style={styles.navBtn}>▶</Text></TouchableOpacity>
      </View>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Total: {monthlyTotals.liters.toFixed(1)} L</Text>
        <Text style={styles.summaryText}>Est. ₹{monthlyTotals.amount.toFixed(0)}</Text>
      </View>
      <View>
        {items.length === 0 ? (
          <Text style={{textAlign:'center', marginTop: 20, color:'#666'}}>No history for this month.</Text>
        ) : (
          items.map((item) => (
            <View key={item.key} style={styles.row}>
              <Text style={styles.cell}>{item.label}</Text>
              <Text style={[styles.cell, {flex: 0.8}]}>{item.totalLiters > 0 ? `${item.totalLiters.toFixed(1)} L` : 'No order'}</Text>
              <TouchableOpacity style={styles.repeatBtn} onPress={() => handleRepeatForToday(item.date)}>
                <Text style={styles.repeatText}>Repeat today</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn: { fontSize: 18, color: '#2e7d32', fontWeight: '700', paddingHorizontal: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#1b5e20' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgb(144, 238, 144)' },
  todayHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  todayTitle: { fontWeight: 'bold', fontSize: 16, color: '#1b5e20' },
  dateBadge: { backgroundColor: '#e8f5e9', color: '#1b5e20', borderColor: '#c8e6c9', borderWidth: 1, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  todayCell: { color: '#1b5e20' },
  todayFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  input: { flex: 1, minWidth: 60, borderWidth: 1, borderColor: '#c8e6c9', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#f9fff9', color: '#1b5e20', textAlign: 'center' },
  quickBtn: { backgroundColor: 'rgb(144, 238, 144)', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  quickBtnText: { color: '#fff', fontWeight: '700' },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e8f5e9', borderColor: '#c8e6c9', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 10 },
  summaryText: { color: '#1b5e20', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgb(144, 238, 144)', borderRadius: 10, padding: 10, marginBottom: 8 },
  cell: { flex: 1, color: '#1b5e20' },
  repeatBtn: { backgroundColor: 'rgb(144, 238, 144)', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  repeatText: { color: '#fff', fontWeight: '700' },
});
