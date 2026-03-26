import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView } from 'react-native';
import { Card, Chip, ActivityIndicator } from 'react-native-paper';
import { subscribeToCustomers } from '../firebase/customers';
import { subscribeToCollectionsByMonth } from '../firebase/collections';

const BRAND = '#1565C0';

export default function DashboardScreen() {
  const [customers, setCustomers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthName = now.toLocaleString('default', { month: 'long' });

  useEffect(() => {
    const unsub1 = subscribeToCustomers((data) => {
      setCustomers(data);
      setLoading(false);
    });
    const unsub2 = subscribeToCollectionsByMonth(month, year, setCollections);
    return () => { unsub1(); unsub2(); };
  }, []);

  const paidIds = new Set(collections.map((c) => c.customerId));
  const paid = customers.filter((c) => paidIds.has(c.id));
  const unpaid = customers.filter((c) => !paidIds.has(c.id));

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={BRAND} />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 {monthName} {year}</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Total" value={customers.length} color="#37474F" />
        <StatCard label="Paid" value={paid.length} color="#2E7D32" />
        <StatCard label="Unpaid" value={unpaid.length} color="#C62828" />
      </View>

      <SectionTitle title={`✅ Paid (${paid.length})`} color="#2E7D32" />
      <FlatList
        data={paid}
        keyExtractor={(i) => i.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const col = collections.find((c) => c.customerId === item.id);
          return (
            <Card style={[styles.card, { borderLeftColor: '#2E7D32' }]}>
              <Card.Content style={styles.cardContent}>
                <View>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.sub}>ID: {item.uniqueId} | {item.street}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.amount}>₹{col?.amount}</Text>
                  <Chip style={{ backgroundColor: col?.paymentMethod === 'UPI' ? '#E3F2FD' : '#F9FBE7', marginTop: 4 }}
                    textStyle={{ fontSize: 10 }}>{col?.paymentMethod}</Chip>
                </View>
              </Card.Content>
            </Card>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No paid customers yet</Text>}
      />

      <SectionTitle title={`❌ Unpaid (${unpaid.length})`} color="#C62828" />
      <FlatList
        data={unpaid}
        keyExtractor={(i) => i.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Card style={[styles.card, { borderLeftColor: '#C62828' }]}>
            <Card.Content style={styles.cardContent}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>ID: {item.uniqueId} | {item.street}</Text>
                <Text style={styles.sub}>📞 {item.phone}</Text>
              </View>
              <Chip style={{ backgroundColor: '#FFEBEE' }} textStyle={{ fontSize: 10, color: '#C62828' }}>Due</Chip>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>All customers paid! 🎉</Text>}
      />
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, color }) {
  return <Text style={[styles.sectionTitle, { color }]}>{title}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#1565C0', padding: 20, paddingTop: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', flex: 1, marginHorizontal: 4, borderTopWidth: 4, elevation: 2 },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#607D8B', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  card: { marginHorizontal: 16, marginVertical: 4, borderRadius: 10, borderLeftWidth: 4, elevation: 1 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: '#263238' },
  sub: { fontSize: 12, color: '#78909C', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  empty: { textAlign: 'center', color: '#90A4AE', padding: 12, fontStyle: 'italic' },
});
