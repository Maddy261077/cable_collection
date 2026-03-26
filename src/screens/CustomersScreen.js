import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, SafeAreaView, Text } from 'react-native';
import { FAB, Searchbar, Card, IconButton, Avatar } from 'react-native-paper';
import { subscribeToCustomers, deleteCustomer } from '../firebase/customers';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRIMARY = '#004AAD';
const BG = '#F8F9FA';

export default function CustomersScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    return subscribeToCustomers(setCustomers);
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
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by name, ID, street..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor={PRIMARY}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card 
            style={styles.card} 
            onPress={() => navigation.navigate('AddEditCustomer', { customer: item })}
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.left}>
                <Avatar.Text 
                  size={45} 
                  label={item.name.substring(0, 1)} 
                  style={styles.avatar}
                  labelStyle={styles.avatarLabel}
                />
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.id}>ID: {item.uniqueId}</Text>
                  <View style={styles.row}>
                    <MaterialCommunityIcons name="map-marker" size={14} color="#90A4AE" />
                    <Text style={styles.subText}>{item.street}</Text>
                    <MaterialCommunityIcons name="phone" size={14} color="#90A4AE" style={{ marginLeft: 10 }} />
                    <Text style={styles.subText}>{item.phone}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.actions}>
                <IconButton icon="pencil-outline" iconColor={PRIMARY} size={20} onPress={() => navigation.navigate('AddEditCustomer', { customer: item })} />
                <IconButton icon="trash-can-outline" iconColor="#D50000" size={20} onPress={() => handleDelete(item)} />
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-search-outline" size={60} color="#CFD8DC" />
            <Text style={styles.emptyText}>No customers found</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        label="Add Customer"
        style={styles.fab}
        color="#fff"
        onPress={() => navigation.navigate('AddEditCustomer')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  searchContainer: { padding: 16, backgroundColor: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 2 },
  searchbar: { backgroundColor: '#F5F7FA', borderRadius: 12, elevation: 0 },
  searchInput: { fontSize: 14 },
  list: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 12, borderRadius: 16, elevation: 1, backgroundColor: '#fff' },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { backgroundColor: '#E3F2FD' },
  avatarLabel: { color: PRIMARY, fontWeight: 'bold' },
  info: { marginLeft: 15, flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#263238' },
  id: { fontSize: 11, color: PRIMARY, fontWeight: '700', marginTop: 1, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  subText: { fontSize: 12, color: '#90A4AE', marginLeft: 4 },
  actions: { flexDirection: 'row' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: PRIMARY, borderRadius: 16 },
  empty: { marginTop: 100, alignItems: 'center' },
  emptyText: { marginTop: 10, color: '#90A4AE', fontSize: 16 },
});
