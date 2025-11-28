import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TransactionsScreen() {
  // Dummy data for UI only
  type MonthItem = { id: string; type: 'Cow' | 'Buffalo' | 'Goat'; liters: number; rate: number };
  type MonthTxn = { id: string; month: string; items: MonthItem[]; purchased: number; paid: number };
  const base: MonthTxn[] = [];
  const [filter, setFilter] = useState<'all' | 'paid' | 'due'>('all');
  const monthNamesFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now = new Date();
  const currentLabel = `${monthNamesFull[now.getMonth()]} ${now.getFullYear()}`;
  const monthYearMatches = (label: string) => label === currentLabel;

  // This Month (current month only)
  const currentMonthList: MonthTxn[] = useMemo(() => {
    let list = base.filter((m: MonthTxn) => monthYearMatches(m.month));
    if (filter === 'paid') list = list.filter((m: MonthTxn) => m.paid >= m.purchased);
    if (filter === 'due') list = list.filter((m: MonthTxn) => m.paid < m.purchased);
    return list;
  }, [filter]);

  // Years history (exclude current month), grouped by year
  const yearsHistory = useMemo(() => {
    const groups: Record<string, MonthTxn[]> = {};
    base.filter((m: MonthTxn) => !monthYearMatches(m.month)).forEach((m: MonthTxn) => {
      const year = m.month.split(' ')[1];
      if (!groups[year]) groups[year] = [];
      groups[year].push(m);
    });
    // apply filter inside groups
    Object.keys(groups).forEach(y => {
      let list: MonthTxn[] = groups[y];
      if (filter === 'paid') list = list.filter((m: MonthTxn) => m.paid >= m.purchased);
      if (filter === 'due') list = list.filter((m: MonthTxn) => m.paid < m.purchased);
      groups[y] = list;
    });
    return groups;
  }, [filter]);

  const totalPurchased = currentMonthList.reduce((s: number, m: MonthTxn) => s + m.purchased, 0);
  const totalPaid = currentMonthList.reduce((s: number, m: MonthTxn) => s + m.paid, 0);
  const totalDue = totalPurchased - totalPaid;

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const headerDate = `${dayNames[now.getDay()]}, ${String(now.getDate()).padStart(2,'0')} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
      <View style={styles.todayCard}>
        <Text style={styles.todayDate}>{headerDate}</Text>
        <View style={styles.todayRow}>
          <View style={styles.todayBox}>
            <Text style={styles.todayLabel}>Purchased</Text>
            <Text style={styles.todayValue}>{'\u20B9'}{totalPurchased}</Text>
          </View>
          <View style={styles.todayBox}>
            <Text style={styles.todayLabel}>Paid</Text>
            <Text style={styles.todayValue}>{'\u20B9'}{totalPaid}</Text>
          </View>
          <View style={styles.todayBox}>
            <Text style={styles.todayLabel}>Due</Text>
            <Text style={[styles.todayValue, {color: totalDue > 0 ? '#e53935' : '#4caf50'}]}>{'\u20B9'}{totalDue}</Text>
          </View>
        </View>
      </View>

      {/* This Month */}
      <Text style={styles.sectionTitle}>This Month · {currentLabel}</Text>

      <View style={styles.filterRow}>
        <TouchableOpacity onPress={() => setFilter('all')} style={[styles.filterBtn, filter==='all' && styles.filterActive]}><Text style={[styles.filterText, filter==='all' && styles.filterActiveText]}>All</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('paid')} style={[styles.filterBtn, filter==='paid' && styles.filterActive]}><Text style={[styles.filterText, filter==='paid' && styles.filterActiveText]}>Paid</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('due')} style={[styles.filterBtn, filter==='due' && styles.filterActive]}><Text style={[styles.filterText, filter==='due' && styles.filterActiveText]}>Due</Text></TouchableOpacity>
      </View>

      <FlatList
        data={currentMonthList}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.monthBox}>
            <Text style={styles.monthTitle}>{item.month}</Text>
            <View style={styles.monthRow}>
              <Text style={styles.monthCell}>Purchased</Text>
              <Text style={styles.monthCellVal}>{'\u20B9'}{item.purchased}</Text>
            </View>
            <View style={styles.monthRow}>
              <Text style={styles.monthCell}>Paid</Text>
              <Text style={styles.monthCellVal}>{'\u20B9'}{item.paid}</Text>
            </View>
            <View style={styles.monthRow}>
              <Text style={styles.monthCell}>Due</Text>
              <Text style={[styles.monthCellVal, {color: (item.purchased-item.paid) > 0 ? '#e53935' : '#4caf50'}]}>{'\u20B9'}{item.purchased - item.paid}</Text>
            </View>
          </View>
        )}
        scrollEnabled={false}
      />

      {/* Years History */}
      <Text style={[styles.sectionTitle, {marginTop: 10}]}>Years History</Text>
      {Object.keys(yearsHistory).sort((a,b)=> Number(b)-Number(a)).map((year: string) => {
        const list: MonthTxn[] = yearsHistory[year];
        if (!list || list.length === 0) return null;
        const totals = list.reduce((acc: {p:number; r:number}, m: MonthTxn) => { acc.p += m.purchased; acc.r += m.paid; return acc; }, {p:0, r:0});
        return (
          <View key={year} style={{marginBottom: 8}}>
            <View style={styles.yearHeader}><Text style={styles.yearHeaderText}>{year}</Text><Text style={styles.yearHeaderTextSmall}>Purchased ₹{totals.p.toFixed(0)} • Paid ₹{totals.r.toFixed(0)} • Due ₹{(totals.p - totals.r).toFixed(0)}</Text></View>
            {list.map((item: MonthTxn) => (
              <View key={item.id} style={styles.monthBox}>
                <Text style={styles.monthTitle}>{item.month}</Text>
                {/* Itemized per milk type */}
                {item.items.map((it) => (
                  <View key={it.id} style={styles.monthRow}>
                    <Text style={styles.monthCell}>{it.type}</Text>
                    <Text style={styles.monthCellVal}>{it.liters} L × ₹{it.rate} = ₹{(it.liters * it.rate).toFixed(0)}</Text>
                  </View>
                ))}
                <View style={styles.monthRow}><Text style={styles.monthCell}>Purchased</Text><Text style={styles.monthCellVal}>{'\u20B9'}{item.purchased.toFixed(0)}</Text></View>
                <View style={styles.monthRow}><Text style={styles.monthCell}>Paid</Text><Text style={styles.monthCellVal}>{'\u20B9'}{item.paid.toFixed(0)}</Text></View>
                <View style={styles.monthRow}><Text style={styles.monthCell}>Due</Text><Text style={[styles.monthCellVal, {color: (item.purchased-item.paid) > 0 ? '#e53935' : '#4caf50'}]}>{'\u20B9'}{(item.purchased - item.paid).toFixed(0)}</Text></View>
              </View>
            ))}
          </View>
        );
      })}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 16 },
  todayCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#bebebe' },
  todayDate: { fontSize: 16, fontWeight: '700', color: '#01559d', marginBottom: 8 },
  todayRow: { flexDirection: 'row', gap: 10 },
  todayBox: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bebebe', borderRadius: 10, padding: 10, alignItems: 'center' },
  todayLabel: { color: '#4f4f4f', fontSize: 12 },
  todayValue: { color: '#01559d', fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontWeight: '700', color: '#01559d', marginBottom: 6, fontSize: 16 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  filterBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, marginHorizontal: 4, borderWidth: 1, borderColor: '#bebebe', borderRadius: 20 },
  filterActive: { backgroundColor: '#01559d', borderColor: '#01559d' },
  filterText: { color: '#01559d', fontWeight: '600' },
  filterActiveText: { color: '#fff' },
  monthBox: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#bebebe' },
  monthTitle: { fontWeight: '700', color: '#01559d', marginBottom: 8 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  monthCell: { color: '#4f4f4f' },
  monthCellVal: { color: '#01559d', fontWeight: '700' },
  yearHeader: { flexDirection: 'row', justifyContent:'space-between', alignItems:'center', marginBottom: 6 },
  yearHeaderText: { fontWeight: '700', color: '#01559d', fontSize: 15 },
  yearHeaderTextSmall: { color: '#01559d' },
});
