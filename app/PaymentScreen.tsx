import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PaymentScreen() {
  // Dummy data for UI only
  type MonthItem = { id: string; type: 'Cow' | 'Buffalo' | 'Goat'; liters: number; rate: number };
  type MonthPay = { id: string; month: string; items: MonthItem[]; total: number; paid: number; due: number };
  const base: MonthPay[] = [];

  const monthNamesFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now = new Date();
  const currentLabel = `${monthNamesFull[now.getMonth()]} ${now.getFullYear()}`;
  const monthYearMatches = (label: string) => label === currentLabel;

  // This Month only
  const currentMonthList: MonthPay[] = useMemo(() => base.filter((p: MonthPay) => monthYearMatches(p.month)), []);

  // Yearly history excluding current month, grouped by year
  const yearsHistory = useMemo(() => {
    const groups: Record<string, MonthPay[]> = {};
    base.filter((p: MonthPay) => !monthYearMatches(p.month)).forEach((p: MonthPay) => {
      const year = p.month.split(' ')[1];
      if (!groups[year]) groups[year] = [];
      groups[year].push(p);
    });
    return groups;
  }, []);

  const totalTotal = currentMonthList.reduce((s: number, p: MonthPay) => s + p.total, 0);
  const totalPaid = currentMonthList.reduce((s: number, p: MonthPay) => s + p.paid, 0);
  const totalDue = currentMonthList.reduce((s: number, p: MonthPay) => s + p.due, 0);

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const headerDate = `${dayNames[now.getDay()]}, ${String(now.getDate()).padStart(2,'0')} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <View style={styles.container}>
      {/* Today card */}
      <View style={styles.todayCard}>
        <Text style={styles.todayDate}>{headerDate}</Text>
        <View style={styles.todayRow}>
          <View style={styles.todayBox}>
            <Text style={styles.todayLabel}>Total</Text>
            <Text style={styles.todayValue}>{'\u20B9'}{totalTotal}</Text>
          </View>
          <View style={styles.todayBox}>
            <Text style={styles.todayLabel}>Paid</Text>
            <Text style={styles.todayValue}>{'\u20B9'}{totalPaid}</Text>
          </View>
          <View style={styles.todayBox}>
            <Text style={styles.todayLabel}>Due</Text>
            <Text style={[styles.todayValue, {color: totalDue > 0 ? '#e53935' : '#01559d'}]}>{'\u20B9'}{totalDue}</Text>
          </View>
        </View>
      </View>

      {/* This Month */}
      <Text style={styles.sectionTitle}>This Month · {currentLabel}</Text>
      <FlatList
        data={currentMonthList}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.monthBox}>
            <Text style={styles.monthTitle}>{item.month}</Text>
            {item.items.map((it) => (
              <View key={it.id} style={styles.monthRow}>
                <Text style={styles.monthCell}>{it.type}</Text>
                <Text style={styles.monthCellVal}>{it.liters} L × ₹{it.rate} = ₹{(it.liters * it.rate).toFixed(0)}</Text>
              </View>
            ))}
            <View style={styles.monthRow}><Text style={styles.monthCell}>Total</Text><Text style={styles.monthCellVal}>{'\u20B9'}{item.total.toFixed(0)}</Text></View>
            <View style={styles.monthRow}><Text style={styles.monthCell}>Paid</Text><Text style={styles.monthCellVal}>{'\u20B9'}{item.paid.toFixed(0)}</Text></View>
            <View style={styles.monthRow}><Text style={styles.monthCell}>Due</Text><Text style={[styles.monthCellVal, {color: item.due > 0 ? '#e53935' : '#01559d'}]}>{'\u20B9'}{item.due.toFixed(0)}</Text></View>
            {item.due > 0 && (
              <TouchableOpacity style={[styles.payBtn, {backgroundColor: '#01559d'}]}>
                <Text style={{color:'#fff'}}>PAY DUE</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListFooterComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryText}>Total: {'\u20B9'}{totalTotal}</Text>
            <Text style={styles.summaryText}>Paid: {'\u20B9'}{totalPaid}</Text>
            <Text style={[styles.summaryText, {color: totalDue > 0 ? '#e53935' : '#1b5e20'}]}>Due: {'\u20B9'}{totalDue}</Text>
          </View>
        }
      />

      {/* Years History */}
      <Text style={[styles.sectionTitle, {marginTop: 10}]}>Years History</Text>
      {Object.keys(yearsHistory).sort((a,b)=> Number(b)-Number(a)).map((year: string) => {
        const list: MonthPay[] = yearsHistory[year];
        if (!list || list.length === 0) return null;
        const totals = list.reduce((acc: {t:number; p:number}, m: MonthPay) => { acc.t += m.total; acc.p += m.paid; return acc; }, {t:0, p:0});
        return (
          <View key={year} style={{marginBottom: 8}}>
            <View style={styles.yearHeader}><Text style={styles.yearHeaderText}>{year}</Text><Text style={styles.yearHeaderTextSmall}>Total ₹{totals.t.toFixed(0)} • Paid ₹{totals.p.toFixed(0)} • Due ₹{(totals.t - totals.p).toFixed(0)}</Text></View>
            {list.map((item: MonthPay) => (
              <View key={item.id} style={styles.monthBox}>
                <Text style={styles.monthTitle}>{item.month}</Text>
                {item.items.map((it) => (
                  <View key={it.id} style={styles.monthRow}>
                    <Text style={styles.monthCell}>{it.type}</Text>
                    <Text style={styles.monthCellVal}>{it.liters} L × ₹{it.rate} = ₹{(it.liters * it.rate).toFixed(0)}</Text>
                  </View>
                ))}
                <View style={styles.monthRow}><Text style={styles.monthCell}>Total</Text><Text style={styles.monthCellVal}>{'\u20B9'}{item.total.toFixed(0)}</Text></View>
                <View style={styles.monthRow}><Text style={styles.monthCell}>Paid</Text><Text style={styles.monthCellVal}>{'\u20B9'}{item.paid.toFixed(0)}</Text></View>
                <View style={styles.monthRow}><Text style={styles.monthCell}>Due</Text><Text style={[styles.monthCellVal, {color: item.due > 0 ? '#e53935' : '#01559d'}]}>{'\u20B9'}{item.due.toFixed(0)}</Text></View>
                {item.due > 0 && (
                  <TouchableOpacity style={[styles.payBtn, {backgroundColor: '#01559d'}]}>
                    <Text style={{color:'#fff'}}>PAY DUE</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        );
      })}
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#01559d', marginBottom: 6 },
  monthBox: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#bebebe' },
  monthTitle: { fontWeight: '700', color: '#01559d', marginBottom: 8 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  monthCell: { color: '#4f4f4f' },
  monthCellVal: { color: '#01559d', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 8, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#bebebe' },
  cell: { flex: 1, textAlign: 'center', fontSize: 15 },
  payBtn: { backgroundColor: '#01559d', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, marginLeft: 6 },
  summary: { marginTop: 8, backgroundColor: '#ffffff', borderColor: '#bebebe', borderWidth: 1, borderRadius: 10, padding: 10, gap: 4 },
  summaryText: { color: '#01559d', fontWeight: '700' },
  yearHeader: { flexDirection: 'row', justifyContent:'space-between', alignItems:'center', marginBottom: 6 },
  yearHeaderText: { fontWeight: '700', color: '#01559d', fontSize: 15 },
  yearHeaderTextSmall: { color: '#01559d' },
});
