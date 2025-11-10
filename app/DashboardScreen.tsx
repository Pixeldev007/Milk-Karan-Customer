import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, ScrollView, TextInput } from 'react-native';
import { getProducts, getSchedule, getToday, setOverride } from '@/services/localData';
import { getCustomerSession } from '@/lib/session';
import { useFocusEffect } from '@react-navigation/native';

export default function DashboardScreen({ navigation }: { navigation: any }) {
  const defaultMonthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [selectedMonth, setSelectedMonth] = useState(defaultMonthNames[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [now, setNow] = useState(new Date());
  const [custName, setCustName] = useState<string>('Customer');
  const [custPhone, setCustPhone] = useState<string>('');

  const products = useMemo(() => getProducts(), []);
  const [rows, setRows] = useState<{ product: { id: string; name: string; pricePerLiter: number }; litersMorning: number; litersEvening: number }[]>([]);
  const [savedProductId, setSavedProductId] = useState<string | null>(null);
  const [slotAM, setSlotAM] = useState<boolean>(true);
  const [slotPM, setSlotPM] = useState<boolean>(false);
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const headerDate = `${dayNames[now.getDay()]}, ${String(now.getDate()).padStart(2,'0')} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const todayTotalLiters = rows.reduce((s, r) => s + (r.litersMorning || 0) + (r.litersEvening || 0), 0);
  const todayTotalAmount = rows.reduce((s, r) => s + ((r.litersMorning || 0) + (r.litersEvening || 0)) * (r.product.pricePerLiter || 0), 0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await getCustomerSession();
      if (mounted && s) {
        setCustName(s.name || 'Customer');
        setCustPhone(s.phone || '');
      }
    })();
    return () => { mounted = false; };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        const s = await getCustomerSession();
        if (active && s) {
          setCustName(s.name || 'Customer');
          setCustPhone(s.phone || '');
        }
      })();
      return () => { active = false; };
    }, [])
  );

  const refreshToday = () => {
    setRows(getToday(now) as any);
  };

  useEffect(() => {
    refreshToday();
  }, [now.toDateString()]);

  useEffect(() => {
    refreshToday();
  }, []);

  const setTodayRow = (productId: string, patch: Partial<{ litersMorning: number; litersEvening: number }>) => {
    setRows(prev => prev.map(r => (r.product.id === productId ? { ...r, ...patch } as any : r)));
  };

  const saveTodayRow = (productId: string) => {
    const r = rows.find(x => x.product.id === productId);
    if (!r) return;
    setOverride(now, {
      productId,
      type: 'adjust',
      litersMorning: r.litersMorning,
      litersEvening: r.litersEvening,
      date: '' as any,
    } as any);
    setSavedProductId(productId);
    refreshToday();
    setTimeout(() => setSavedProductId(null), 1000);
  };

  const skipTodayRow = (productId: string) => {
    setOverride(now, { productId, type: 'skip', date: '' } as any);
    refreshToday();
  };

  const resetTodayRow = (productId: string) => {
    const latest = getSchedule();
    const base = latest.lines.find(l => l.productId === productId);
    setOverride(now, {
      productId,
      type: 'adjust',
      litersMorning: base?.litersMorning ?? 0,
      litersEvening: base?.litersEvening ?? 0,
      date: '' as any,
    } as any);
    refreshToday();
  };

  

  const placeOrderToday = () => {
    // Save overrides for today based on selected slots
    rows.forEach(r => {
      setOverride(now, {
        productId: r.product.id,
        type: 'adjust',
        litersMorning: slotAM ? (r.litersMorning || 0) : 0,
        litersEvening: slotPM ? (r.litersEvening || 0) : 0,
        date: '' as any,
      } as any);
    });
    refreshToday();
  };

  // Dummy data for UI only
  const purchasesData: Record<string, { id: string; item: string; liter: number; price: number; total: number }[]> = {
    'January-2023': [{ id: '1', item: 'BUFFALO MILK', liter: 6, price: 60, total: 360 }],
    'February-2023': [{ id: '1', item: 'BUFFALO MILK', liter: 3, price: 60, total: 180 }],
    'March-2023': [],
  };
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const years = ['2022','2023','2024','2025'];
  const key = `${selectedMonth}-${selectedYear}`;
  const purchases = purchasesData[key] ?? [];

  const goPrevMonth = () => {
    const idx = months.indexOf(selectedMonth);
    if (idx > 0) {
      setSelectedMonth(months[idx - 1]);
    } else {
      const yIdx = years.indexOf(selectedYear);
      if (yIdx > 0) {
        setSelectedYear(years[yIdx - 1]);
        setSelectedMonth(months[11]);
      }
    }
  };

  const goNextMonth = () => {
    const idx = months.indexOf(selectedMonth);
    if (idx < months.length - 1) {
      setSelectedMonth(months[idx + 1]);
    } else {
      const yIdx = years.indexOf(selectedYear);
      if (yIdx < years.length - 1) {
        setSelectedYear(years[yIdx + 1]);
        setSelectedMonth(months[0]);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.card}>
      {/* Month/Year selectors */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.selector} onPress={() => setShowMonthPicker(true)}><Text>{selectedMonth} ▼</Text></TouchableOpacity>
        <TouchableOpacity style={styles.selector} onPress={() => setShowYearPicker(true)}><Text>{selectedYear} ▼</Text></TouchableOpacity>
      </View>
      {/* User info */}
      <View style={styles.userBox}>
        <View style={styles.avatar} />
        <View style={{flex:1}}>
          <Text style={styles.userName}>{custName}</Text>
          {!!custPhone && <Text style={styles.userLocation}>{custPhone}</Text>}
        </View>
        <TouchableOpacity style={styles.iconBtn}><Text>📋</Text></TouchableOpacity>
      </View>
      <View style={styles.todayCard}>
        <View style={styles.todayHeaderRow}>
          <Text style={styles.todayTitle}>Today's Order</Text>
          <Text style={styles.dateBadge}>{headerDate}</Text>
        </View>
        <View style={styles.slotRow}>
          <TouchableOpacity style={[styles.slotBtn, slotAM && styles.slotActive]} onPress={() => setSlotAM(s => !s)}><Text style={[styles.slotText, slotAM && styles.slotActiveText]}>Morning</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.slotBtn, slotPM && styles.slotActive]} onPress={() => setSlotPM(s => !s)}><Text style={[styles.slotText, slotPM && styles.slotActiveText]}>Evening</Text></TouchableOpacity>
        </View>
        <View style={styles.todayRows}>
          {rows.map(r => (
            <View key={r.product.id} style={styles.todayRow}>
              <Text style={[styles.todayCell, {flex: 1.4}]}>{r.product.name}</Text>
              {slotAM && (
                <View style={{flexDirection:'row', alignItems:'center', gap: 6, flex: 1}}>
                  <Text style={styles.todayCell}>AM</Text>
                  <TextInput
                    value={String(r.litersMorning ?? 0)}
                    onChangeText={(t) => setTodayRow(r.product.id, { litersMorning: Number(t) || 0 })}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              )}
              {slotPM && (
                <View style={{flexDirection:'row', alignItems:'center', gap: 6, flex: 1}}>
                  <Text style={styles.todayCell}>PM</Text>
                  <TextInput
                    value={String(r.litersEvening ?? 0)}
                    onChangeText={(t) => setTodayRow(r.product.id, { litersEvening: Number(t) || 0 })}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              )}
            </View>
          ))}
        </View>
        <View style={styles.todayFooter}>
          <Text style={styles.todayTotal}>{todayTotalLiters.toFixed(1)} L • ₹{todayTotalAmount.toFixed(0)}</Text>
          <View style={{flexDirection:'row', gap: 8}}>
            <TouchableOpacity style={styles.quickBtn} onPress={placeOrderToday} disabled={!slotAM && !slotPM}><Text style={styles.quickBtnText}>Place Order</Text></TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => rows.forEach(r => skipTodayRow(r.product.id))}><Text style={styles.quickBtnText}>Skip All</Text></TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Wallet/Amount */}
      <View style={styles.row}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Wallet Amount</Text>
          <Text style={styles.amountValue}>₹170.00</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Payment')}><Text style={styles.link}>View</Text></TouchableOpacity>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>January - 2023</Text>
          <Text style={styles.amountValue}>₹360</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}><Text style={styles.link}>View</Text></TouchableOpacity>
        </View>
      </View>
      {/* Purchases Table */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={goPrevMonth}><Text style={styles.navBtn}>◀ PREV</Text></TouchableOpacity>
        <Text style={styles.sectionTitle}>{selectedMonth} {selectedYear} Purchase</Text>
        <TouchableOpacity onPress={goNextMonth}><Text style={styles.navBtn}>NEXT ▶</Text></TouchableOpacity>
      </View>
      <FlatList
        data={purchases}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>#</Text>
            <Text style={styles.headerCell}>ITEM</Text>
            <Text style={styles.headerCell}>LITER</Text>
            <Text style={styles.headerCell}>PRICE (₹)</Text>
            <Text style={styles.headerCell}>TOTAL (₹)</Text>
          </View>
        }
        renderItem={({item}) => (
          <View style={styles.purchaseRow}>
            <Text style={styles.purchaseCell}>1</Text>
            <Text style={styles.purchaseCell}>{item.item}</Text>
            <Text style={styles.purchaseCell}>{item.liter}</Text>
            <Text style={styles.purchaseCell}>₹{item.price}</Text>
            <Text style={styles.purchaseCell}>₹{item.total}</Text>
          </View>
        )}
        ListFooterComponent={<Text style={styles.finalTotal}>FINAL TOTAL  ₹360</Text>}
      />
      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('My Orders')}><Text style={{color:'#fff'}}>My Orders</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Payment')}><Text style={{color:'#fff'}}>Do Payment</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Transactions')}><Text style={{color:'#fff'}}>Transaction</Text></TouchableOpacity>
      </View>
      {/* Settings */}
      <TouchableOpacity accessibilityRole="button" style={styles.settingsBox} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.settingsTitle}>Settings</Text>
        <Text style={styles.settingsSubtitle}>Language Change, Logout</Text>
      </TouchableOpacity>
      </View>
      </ScrollView>
      <Modal visible={showMonthPicker} transparent animationType="fade">
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.3)'}}>
          <View style={{backgroundColor:'#fff', borderRadius:10, padding:12, width:'80%', maxHeight:'60%'}}>
            <ScrollView>
              {months.map(m => (
                <TouchableOpacity key={m} style={{paddingVertical:10}} onPress={() => { setSelectedMonth(m); setShowMonthPicker(false); }}>
                  <Text style={{textAlign:'center', fontWeight: m===selectedMonth ? 'bold' : 'normal'}}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={{marginTop:8, alignSelf:'center'}} onPress={() => setShowMonthPicker(false)}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showYearPicker} transparent animationType="fade">
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.3)'}}>
          <View style={{backgroundColor:'#fff', borderRadius:10, padding:12, width:'60%'}}>
            {years.map(y => (
              <TouchableOpacity key={y} style={{paddingVertical:10}} onPress={() => { setSelectedYear(y); setShowYearPicker(false); }}>
                <Text style={{textAlign:'center', fontWeight: y===selectedYear ? 'bold' : 'normal'}}>{y}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{marginTop:8, alignSelf:'center'}} onPress={() => setShowYearPicker(false)}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  selector: { backgroundColor: '#fff', color: '#222', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 6, fontWeight: 'bold', marginRight: 8, fontSize: 15, borderWidth: 1, borderColor: 'rgb(144, 238, 144)' },
  userBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgb(144, 238, 144)' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee', marginRight: 12, borderWidth: 2, borderColor: 'rgb(144, 238, 144)' },
  iconBtn: { padding: 10 },
  userName: { fontWeight: 'bold', fontSize: 16 },
  userLocation: { color: '#888' },
  // Embedded Today & Schedule summary styles
  todayCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgb(144, 238, 144)' },
  todayHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  todayTitle: { fontWeight: 'bold', fontSize: 16, color: '#1b5e20' },
  dateBadge: { backgroundColor: '#e8f5e9', color: '#1b5e20', borderColor: '#c8e6c9', borderWidth: 1, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  todayRows: { marginTop: 6 },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  todayCell: { color: '#1b5e20' },
  todayFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  todayTotal: { fontWeight: 'bold', color: '#1b5e20' },
  quickBtn: { backgroundColor: 'rgb(144, 238, 144)', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  quickBtnText: { color: '#fff', fontWeight: 'bold' },
  slotRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  slotBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#c8e6c9' },
  slotActive: { backgroundColor: 'rgb(144, 238, 144)', borderColor: 'rgb(144, 238, 144)' },
  slotText: { color: '#1b5e20', fontWeight: '700' },
  slotActiveText: { color: '#fff' },
  input: { flex: 1, minWidth: 60, borderWidth: 1, borderColor: '#c8e6c9', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#f9fff9', color: '#1b5e20', textAlign: 'center' },
  pauseBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: '#c8e6c9' },
  pauseBtnActive: { backgroundColor: '#ffb300', borderColor: '#ffb300' },
  pauseText: { color: '#1b5e20', fontWeight: '700' },
  pauseTextActive: { color: '#fff' },
  amountBox: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: 'rgb(144, 238, 144)' },
  amountLabel: { color: '#888', fontSize: 12 },
  amountValue: { fontWeight: 'bold', fontSize: 18 },
  link: { color: 'rgb(144, 238, 144)', fontSize: 12, marginTop: 4, fontWeight: 'bold' },
  sectionTitle: { fontWeight: 'bold', fontSize: 14, marginVertical: 8 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  navBtn: { color: '#888', fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 6, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  headerCell: { flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: 12, color: '#666' },
  purchaseRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 8, padding: 8, marginBottom: 4, borderWidth: 1, borderColor: '#eef2f7' },
  purchaseCell: { flex: 1, textAlign: 'center' },
  finalTotal: { fontWeight: 'bold', textAlign: 'right', marginTop: 4, backgroundColor: '#eef2f7', padding: 8, borderRadius: 6 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  actionBtn: { flex: 1, backgroundColor: 'rgb(144, 238, 144)', borderRadius: 22, marginHorizontal: 4, padding: 12, alignItems: 'center', elevation: 2 },
  settingsBox: { marginTop: 20, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgb(144, 238, 144)' },
  settingsTitle: { fontWeight: 'bold', fontSize: 16 },
  settingsSubtitle: { color: '#888', fontSize: 12 },
});
