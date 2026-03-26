import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, FAB, Searchbar, Card, IconButton } from 'react-native-paper';
import { subscribeToCustomers, deleteCustomer } from '../firebase/customers';

const BRAND = '#1565C0';

export default function CustomersScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = subscribeToCustomers(setCustomers);
    return unsub;
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.uniqueId?.toLowerCase().includes(search.toLowerCase()) ||
      c.street?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  const handleDelete = (customer) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCustomer(customer.id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search by name, ID, street, phone..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
        inputStyle={{ fontSize: 14 }}
      />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>🪪 ID: {item.uniqueId}</Text>
                <Text style={styles.sub}>🏘 {item.street}</Text>
                <Text style={styles.sub}>📞 {item.phone}</Text>
              </View>
              <View style={styles.actions}>
                <IconButton icon="pencil" size={20} iconColor={BRAND} onPress={() => navigation.navigate('AddEditCustomer', { customer: item })} />
                <IconButton icon="trash-can" size={20} iconColor="#C62828" onPress={() => handleDelete(item)} />
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No customers found. Tap + to add one.</Text>}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        color="#fff"
        onPress={() => navigation.navigate('AddEditCustomer', {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  searchbar: { margin: 12, borderRadius: 10, elevation: 2 },
  card: { marginBottom: 8, borderRadius: 10, elevation: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#263238' },
  sub: { fontSize: 12, color: '#607D8B', marginTop: 2 },
  actions: { flexDirection: 'row' },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#1565C0' },
  empty: { textAlign: 'center', color: '#90A4AE', marginTop: 60, fontStyle: 'italic' },
});
