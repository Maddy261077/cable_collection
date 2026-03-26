import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { subscribeToCollectionsByMonth } from '../firebase/collections';
import { subscribeToCustomers } from '../firebase/customers';
import { exportCSV } from '../utils/exportCSV';
import { exportPDF } from '../utils/exportPDF';

const BRAND = '#1565C0';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function ReportsScreen() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [collections, setCollections] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCustomers(setCustomers);
    return unsub;
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToCollectionsByMonth(month, year, (data) => {
      setCollections(data);
      setLoading(false);
    });
    return unsub;
  }, [month, year]);

  const totalCollected = collections.reduce((s, c) => s + (c.amount || 0), 0);
  const cashCount = collections.filter((c) => c.paymentMethod === 'Cash').length;
  const upiCount = collections.filter((c) => c.paymentMethod === 'UPI').length;

  const changeMonth = (dir) => {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
  };

  const handleExportCSV = async () => {
    if (collections.length === 0) { Alert.alert('No Data', 'No records found for this month.'); return; }
    setExporting(true);
    await exportCSV(collections, MONTHS[month - 1], year);
    setExporting(false);
  };

  const handleExportPDF = async () => {
    if (collections.length === 0) { Alert.alert('No Data', 'No records found for this month.'); return; }
    setExporting(true);
    await exportPDF(collections, customers, MONTHS[month - 1], year);
    setExporting(false);
  };

  return (
    <View style={styles.container}>
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <Button icon="chevron-left" mode="text" onPress={() => changeMonth(-1)} textColor="#fff" compact />
        <Text style={styles.monthText}>{MONTHS[month - 1]} {year}</Text>
        <Button icon="chevron-right" mode="text" onPress={() => changeMonth(1)} textColor="#fff" compact />
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <SumCard label="Total Collected" value={`₹${totalCollected}`} color="#2E7D32" />
        <SumCard label="Cash" value={cashCount} color="#6D4C41" />
        <SumCard label="UPI" value={upiCount} color="#1565C0" />
        <SumCard label="Paid" value={collections.length} color="#6A1B9A" />
      </View>

      {/* Export Buttons */}
      <View style={styles.exportRow}>
        <Button mode="contained" icon="file-delimited" onPress={handleExportCSV} loading={exporting}
          style={styles.exportBtn} buttonColor="#2E7D32" compact>CSV</Button>
        <Button mode="contained" icon="file-pdf-box" onPress={handleExportPDF} loading={exporting}
          style={styles.exportBtn} buttonColor="#C62828" compact>PDF</Button>
      </View>

      {/* Records List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={BRAND} />
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.customerName}</Text>
                  <Text style={styles.sub}>🪪 {item.customerUniqueId} | 🏘 {item.customerStreet}</Text>
                  <Text style={styles.sub}>📅 {item.paidDate}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.amount}>₹{item.amount}</Text>
                  <Chip style={{ backgroundColor: item.paymentMethod === 'UPI' ? '#E3F2FD' : '#F9FBE7', marginTop: 4 }}
                    textStyle={{ fontSize: 10 }}>{item.paymentMethod}</Chip>
                </View>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No collections recorded for {MONTHS[month - 1]} {year}</Text>}
        />
      )}
    </View>
  );
}

function SumCard({ label, value, color }) {
  return (
    <View style={[styles.sumCard, { borderTopColor: color }]}>
      <Text style={[styles.sumValue, { color }]}>{value}</Text>
      <Text style={styles.sumLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: BRAND, paddingHorizontal: 8, paddingVertical: 4 },
  monthText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  summaryRow: { flexDirection: 'row', padding: 10, gap: 6 },
  sumCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, alignItems: 'center', borderTopWidth: 3, elevation: 1 },
  sumValue: { fontSize: 14, fontWeight: 'bold' },
  sumLabel: { fontSize: 10, color: '#90A4AE', marginTop: 2, textAlign: 'center' },
  exportRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 10, marginBottom: 4 },
  exportBtn: { flex: 1, borderRadius: 8 },
  card: { marginBottom: 8, borderRadius: 10, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: '#263238' },
  sub: { fontSize: 12, color: '#78909C', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  empty: { textAlign: 'center', color: '#90A4AE', marginTop: 40, fontStyle: 'italic' },
});
