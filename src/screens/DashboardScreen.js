import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Card, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { subscribeToCustomers } from '../firebase/customers';
import { subscribeToCollectionsByMonth } from '../firebase/collections';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRIMARY = '#004AAD';
const SUCCESS = '#00C853';
const DANGER = '#D50000';
const BG = '#F8F9FA';

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

  const paidIds = new Set(
    collections
      .filter((c) => c.paymentMethod !== 'Later')
      .map((c) => c.customerId)
  );

  const laterPayments = collections.filter((c) => c.paymentMethod === 'Later');
  const paid = customers.filter((c) => paidIds.has(c.id));
  const unpaid = customers.filter((c) => !paidIds.has(c.id));

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={PRIMARY} />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Day! 👋</Text>
            <Text style={styles.subGreeting}>{monthName} {year} Overview</Text>
          </View>
          <IconButton icon="bell-outline" size={24} iconColor={PRIMARY} style={styles.notification} />
        </View>

        <View style={styles.statsContainer}>
          <StatCard label="Total" value={customers.length} icon="account-group" color={PRIMARY} />
          <StatCard label="Paid" value={paid.length} icon="check-circle" color={SUCCESS} />
          <StatCard label="Later" value={laterPayments.length} icon="clock-outline" color="#F4511E" />
          <StatCard label="Unpaid" value={unpaid.length} icon="alert-circle" color={DANGER} />
        </View>

        <View style={styles.content}>
          <SectionTitle title="✅ Recent Payments" color={SUCCESS} count={paid.length} />
          <FlatList
            data={paid}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const col = collections.find((c) => c.customerId === item.id);
              return (
                <Card style={styles.card}>
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                      <View style={[styles.avatar, {
                        backgroundColor: col?.paymentMethod === 'UPI' ? '#E3F2FD' : (col?.paymentMethod === 'Later' ? '#FBE9E7' : '#E8F5E9')
                      }]}>
                        <MaterialCommunityIcons
                          name={col?.paymentMethod === 'UPI' ? 'cellphone-check' : (col?.paymentMethod === 'Later' ? 'clock-outline' : 'account')}
                          size={20}
                          color={col?.paymentMethod === 'UPI' ? '#1565C0' : (col?.paymentMethod === 'Later' ? '#D84315' : SUCCESS)}
                        />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.subText}>ID: {item.uniqueId}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.amount}>₹{col?.amount}</Text>
                      <Chip
                        compact
                        style={[styles.chip, {
                          backgroundColor: col?.paymentMethod === 'UPI' ? '#E3F2FD' : (col?.paymentMethod === 'Later' ? '#FBE9E7' : '#F9FBE7')
                        }]}
                        textStyle={styles.chipText}
                      >
                        {col?.paymentMethod}
                      </Chip>
                    </View>
                  </Card.Content>
                </Card>
              );
            }}
            ListEmptyComponent={<Text style={styles.empty}>No entries found</Text>}
          />

          <SectionTitle title="❌ Unpaid Dues" color={DANGER} count={unpaid.length} />
          <FlatList
            data={unpaid}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.avatar, { backgroundColor: '#FFEBEE' }]}>
                      <MaterialCommunityIcons name="account-alert" size={20} color={DANGER} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.subText}>ID: {item.uniqueId}</Text>
                    </View>
                  </View>
                  <IconButton icon="chevron-right" size={20} iconColor="#B0BEC5" />
                </Card.Content>
              </Card>
            )}
            ListEmptyComponent={<Text style={styles.empty}>All clear! 🎉</Text>}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconBlob, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, color, count }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      <Text style={styles.sectionCount}>{count} total</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#fff'
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#263238' },
  subGreeting: { fontSize: 13, color: '#78909C', marginTop: 2 },
  notification: { backgroundColor: '#F5F7FA', borderRadius: 12 },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statCard: {
    width: '46%',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF1'
  },
  iconBlob: { padding: 10, borderRadius: 15, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#90A4AE', fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  content: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold' },
  sectionCount: { fontSize: 12, color: '#90A4AE' },
  card: { backgroundColor: '#fff', marginBottom: 10, borderRadius: 16, elevation: 1 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: 'bold', color: '#263238' },
  subText: { fontSize: 12, color: '#90A4AE', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#263238' },
  chip: { height: 24, marginTop: 4, borderRadius: 8 },
  chipText: { fontSize: 10, fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#B0BEC5', marginTop: 10, fontStyle: 'italic' },
});

