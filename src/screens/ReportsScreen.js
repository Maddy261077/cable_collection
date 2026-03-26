import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Chip, ActivityIndicator, Surface, IconButton } from 'react-native-paper';
import { subscribeToCollectionsByMonth } from '../firebase/collections';
import { subscribeToCustomers } from '../firebase/customers';
import { exportCSV } from '../utils/exportCSV';
import { exportPDF } from '../utils/exportPDF';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRIMARY = '#004AAD';
const SUCCESS = '#00C853';
const BG = '#F8F9FA';

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
    return subscribeToCustomers(setCustomers);
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
    if (collections.length === 0) { Alert.alert('No Data', 'There are no records to export for this month.'); return; }
    setExporting(true);
    try {
      await exportCSV(collections, MONTHS[month - 1], year);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (collections.length === 0) { Alert.alert('No Data', 'There are no records to export for this month.'); return; }
    setExporting(true);
    try {
      await exportPDF(collections, customers, MONTHS[month - 1], year);
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="chevron-left" iconColor={PRIMARY} size={28} onPress={() => changeMonth(-1)} />
        <View style={styles.monthDisplay}>
          <Text style={styles.monthName}>{MONTHS[month - 1]}</Text>
          <Text style={styles.yearName}>{year}</Text>
        </View>
        <IconButton icon="chevron-right" iconColor={PRIMARY} size={28} onPress={() => changeMonth(1)} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryGrid}>
          <ReportStat label="Total Volume" value={`₹${totalCollected}`} icon="cash-multiple" color={SUCCESS} />
          <ReportStat label="Cash Payments" value={cashCount} icon="hand-coin-outline" color="#8D6E63" />
          <ReportStat label="UPI Payments" value={upiCount} icon="cellphone-arrow-down" color={PRIMARY} />
          <ReportStat label="Total Paid" value={collections.length} icon="check-decagram-outline" color="#7E57C2" />
        </View>

        <View style={styles.exportSection}>
          <Text style={styles.sectionTitle}>Export Reports</Text>
          <View style={styles.exportRow}>
            <Surface style={styles.exportCard} elevation={1}>
              <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV} disabled={exporting}>
                <MaterialCommunityIcons name="file-excel-outline" size={24} color="#2E7D32" />
                <Text style={styles.exportBtnText}>Excel CSV</Text>
              </TouchableOpacity>
            </Surface>
            <Surface style={styles.exportCard} elevation={1}>
              <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF} disabled={exporting}>
                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#C62828" />
                <Text style={styles.exportBtnText}>Modern PDF</Text>
              </TouchableOpacity>
            </Surface>
          </View>
        </View>

        <View style={styles.recordsSection}>
          <View style={styles.recordsHeader}>
            <Text style={styles.sectionTitle}>Collections History</Text>
            {exporting && <ActivityIndicator size="small" color={PRIMARY} />}
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={PRIMARY} />
          ) : (
            <FlatList
              data={collections}
              keyExtractor={(i) => i.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Card style={styles.card}>
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                      <View style={[styles.avatar, { backgroundColor: item.paymentMethod === 'UPI' ? '#E3F2FD' : '#F9FBE7' }]}>
                        <MaterialCommunityIcons 
                          name={item.paymentMethod === 'UPI' ? 'cellphone-check' : 'cash'} 
                          size={18} 
                          color={item.paymentMethod === 'UPI' ? '#1565C0' : '#827717'} 
                        />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.name}>{item.customerName}</Text>
                        <Text style={styles.sub}>ID: {item.customerUniqueId} • {item.paidDate}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.amount}>₹{item.amount}</Text>
                      <Text style={styles.methodLabel}>{item.paymentMethod}</Text>
                    </View>
                  </Card.Content>
                </Card>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <MaterialCommunityIcons name="calendar-blank" size={50} color="#CFD8DC" />
                  <Text style={styles.emptyText}>No collections recorded for this month</Text>
                </View>
              }
            />
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ReportStat({ label, value, icon, color }) {
  return (
    <Surface style={styles.reportStat} elevation={1}>
      <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4 },
  monthDisplay: { alignItems: 'center' },
  monthName: { fontSize: 20, fontWeight: 'bold', color: '#263238' },
  yearName: { fontSize: 13, color: PRIMARY, fontWeight: '700', marginTop: -2 },
  scrollContent: { padding: 16 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
  reportStat: { width: '48.5%', backgroundColor: '#fff', padding: 15, borderRadius: 20, alignItems: 'center' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#90A4AE', marginTop: 2 },
  exportSection: { marginBottom: 25 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#263238', marginBottom: 15, marginLeft: 4 },
  exportRow: { flexDirection: 'row', gap: 12 },
  exportCard: { flex: 1, borderRadius: 16, backgroundColor: '#fff', overflow: 'hidden' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  exportBtnText: { fontWeight: 'bold', color: '#455A64', fontSize: 14 },
  recordsSection: { flex: 1 },
  recordsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { backgroundColor: '#fff', marginBottom: 10, borderRadius: 16, elevation: 1 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: 'bold', color: '#263238' },
  sub: { fontSize: 11, color: '#90A4AE', marginTop: 1 },
  amount: { fontSize: 15, fontWeight: 'bold', color: '#263238' },
  methodLabel: { fontSize: 9, color: '#90A4AE', textTransform: 'uppercase', fontWeight: 'bold', marginTop: 2 },
  empty: { marginTop: 40, alignItems: 'center' },
  emptyText: { color: '#B0BEC5', marginTop: 10, fontSize: 14, fontStyle: 'italic' },
});

