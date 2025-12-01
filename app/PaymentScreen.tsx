import { getCustomerId } from '@/lib/customers';
import { getCustomerSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type InvoiceRow = {
  id: string;
  number: string;
  date: string | null;
  status: string | null;
  amount: number;
  notes?: string | null;
  pdf_url?: string | null;
};

const CUSTOMER_PAY_ENDPOINT =
  (Constants.expoConfig?.extra as any)?.customerPayUrl ||
  process.env.EXPO_PUBLIC_CUSTOMER_PAY_URL ||
  '';

export default function PaymentScreen() {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

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
    return () => {
      mounted = false;
    };
  }, []);

  const loadInvoices = useCallback(async () => {
    if (!customerId) {
      setInvoices([]);
      return;
    }
    setLoading(true);
    try {
      const nowDate = new Date();
      const year = nowDate.getFullYear();
      const month = String(nowDate.getMonth() + 1).padStart(2, '0');
      const monthStart = `${year}-${month}-01`;
      const monthEnd = `${year}-${month}-31`;

      const { data, error } = await supabase
        .from('invoices')
        .select(
          `id, invoice_number, issue_date, status, notes, pdf_url, invoice_items(line_total)`
        )
        .eq('customer_id', customerId)
        .gte('issue_date', monthStart)
        .lte('issue_date', monthEnd)
        .order('issue_date', { ascending: false });
      if (error) throw error;

      const mapped: InvoiceRow[] = (data || []).map((inv: any) => {
        const total = (inv.invoice_items || []).reduce(
          (sum: number, it: any) => sum + Number(it?.line_total || 0),
          0
        );
        return {
          id: inv.id,
          number: inv.invoice_number,
          date: inv.issue_date,
          status: inv.status,
          amount: total,
          notes: inv.notes ?? null,
          pdf_url: inv.pdf_url ?? null,
        };
      });

      const latestInvoice = mapped[0] || null;
      setInvoices(latestInvoice ? [latestInvoice] : []);
    } catch (e) {
      console.error('loadInvoices error', e);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (!customerId) {
      setInvoices([]);
      return;
    }
    loadInvoices();
  }, [customerId, loadInvoices]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = useMemo(() => new Date(), []);
  const headerDate = `${dayNames[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const totals = useMemo(() => {
    const total = invoices.reduce((s, inv) => s + inv.amount, 0);
    const paid = invoices
      .filter(inv => (inv.status || '').toLowerCase() === 'paid')
      .reduce((s, inv) => s + inv.amount, 0);
    const due = total - paid;
    return { total, paid, due };
  }, [invoices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  }, [loadInvoices]);

  const handlePayNow = useCallback(
    async (invoice: InvoiceRow) => {
      if (!CUSTOMER_PAY_ENDPOINT) {
        Alert.alert('Error', 'Payment endpoint is not configured.');
        return;
      }
      setPayingId(invoice.id);
      try {
        const resp = await fetch(CUSTOMER_PAY_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId: invoice.id,
            amount: invoice.amount,
          }),
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(json.error || 'Payment failed');
        }
        await loadInvoices();
        Alert.alert('Success', 'Payment recorded successfully.');
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Payment failed');
      } finally {
        setPayingId(null);
      }
    },
    [loadInvoices]
  );

  return (
    <View style={styles.container}>
      <View style={styles.todayCard}>
        <Text style={styles.todayDate}>{headerDate}</Text>
        <View style={styles.todayRow}>
          <View style={styles.todayBox}>
            <Text style={styles.todayLabel}>Total</Text>
            <Text style={styles.todayValue}>{'\u20B9'}{totals.total.toFixed(0)}</Text>
          </View>
          <View style={styles.todayBox}>
            <Text style={styles.todayLabel}>Paid</Text>
            <Text style={styles.todayValue}>{'\u20B9'}{totals.paid.toFixed(0)}</Text>
          </View>
          <View style={styles.todayBox}>
            <Text style={styles.todayLabel}>Due</Text>
            <Text style={[styles.todayValue, { color: totals.due > 0 ? '#e53935' : '#01559d' }]}>{'\u20B9'}{totals.due.toFixed(0)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Invoices</Text>
      <FlatList
        data={invoices}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 16 }} />
          ) : (
            <Text style={{ marginTop: 16, textAlign: 'center', color: '#4f4f4f' }}>
              No invoices found.
            </Text>
          )
        }
        renderItem={({ item }) => {
          const status = (item.status || '').toString();
          const isPaid = status.toLowerCase() === 'paid';
          const displayDate = item.date
            ? new Date(item.date).toLocaleDateString(undefined, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '-';
          const isPaying = payingId === item.id;
          return (
            <View style={styles.monthBox}>
              <Text style={styles.monthTitle}>{item.number || item.id}</Text>
              <View style={styles.monthRow}>
                <Text style={styles.monthCell}>Date</Text>
                <Text style={styles.monthCellVal}>{displayDate}</Text>
              </View>
              <View style={styles.monthRow}>
                <Text style={styles.monthCell}>Amount</Text>
                <Text style={styles.monthCellVal}>{'\u20B9'}{item.amount.toFixed(0)}</Text>
              </View>
              <View style={styles.monthRow}>
                <Text style={styles.monthCell}>Status</Text>
                <Text style={styles.monthCellVal}>{status || '—'}</Text>
              </View>
              {!!item.notes && (
                <View style={styles.monthRow}>
                  <Text style={styles.monthCell}>Period</Text>
                  <Text style={[styles.monthCellVal, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                    {item.notes}
                  </Text>
                </View>
              )}
              {!!item.pdf_url && (
                <TouchableOpacity
                  style={styles.pdfBtn}
                  onPress={() => Linking.openURL(item.pdf_url as string)}
                >
                  <Text style={{ color: '#01559d', fontWeight: '600' }}>VIEW INVOICE PDF</Text>
                </TouchableOpacity>
              )}
              {!isPaid && (
                <TouchableOpacity
                  style={styles.payBtn}
                  disabled={isPaying}
                  onPress={() => handlePayNow(item)}
                >
                  {isPaying ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={{ color: '#fff' }}>PAY NOW</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          invoices.length > 0 ? (
            <View style={styles.summary}>
              <Text style={styles.summaryText}>Total: {'\u20B9'}{totals.total.toFixed(0)}</Text>
              <Text style={styles.summaryText}>Paid: {'\u20B9'}{totals.paid.toFixed(0)}</Text>
              <Text
                style={[
                  styles.summaryText,
                  { color: totals.due > 0 ? '#e53935' : '#1b5e20' },
                ]}
              >
                Due: {'\u20B9'}{totals.due.toFixed(0)}
              </Text>
            </View>
          ) : null
        }
      />
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
  pdfBtn: { marginTop: 6, paddingVertical: 6, alignItems: 'center' },
  payBtn: { backgroundColor: '#01559d', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, marginTop: 8, alignItems: 'center' },
  summary: { marginTop: 8, backgroundColor: '#ffffff', borderColor: '#bebebe', borderWidth: 1, borderRadius: 10, padding: 10, gap: 4 },
  summaryText: { color: '#01559d', fontWeight: '700' },
  yearHeader: { flexDirection: 'row', justifyContent:'space-between', alignItems:'center', marginBottom: 6 },
  yearHeaderText: { fontWeight: '700', color: '#01559d', fontSize: 15 },
  yearHeaderTextSmall: { color: '#01559d' },
});
