import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Text, Button, Chip, Card, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFilteredCollections } from '../firebase/collections';

const BRAND = '#1565C0';

export default function FilterScreen() {
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [uniqueId, setUniqueId] = useState('');
  const [name, setName] = useState('');
  const [filterDate, setFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const now = new Date();

  const handleFilter = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const filters = {
        paymentMethod,
      };
      let data = await getFilteredCollections(filters);

      // Client-side filters
      if (uniqueId.trim()) data = data.filter((r) => r.customerUniqueId?.toLowerCase().includes(uniqueId.toLowerCase()));
      if (name.trim()) data = data.filter((r) => r.customerName?.toLowerCase().includes(name.toLowerCase()));
      if (filterDate) {
        const formattedDate = `${filterDate.getFullYear()}-${String(filterDate.getMonth() + 1).padStart(2, '0')}-${String(filterDate.getDate()).padStart(2, '0')}`;
        data = data.filter((r) => r.paidDate === formattedDate);
      }

      setResults(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setPaymentMethod('All');
    setUniqueId('');
    setName('');
    setFilterDate(null);
    setResults([]);
    setSearched(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterBox}>
        <Text style={styles.sectionLabel}>Payment Method</Text>
        <View style={styles.chipRow}>
          {['All', 'Cash', 'UPI'].map((m) => (
            <Chip
              key={m}
              selected={paymentMethod === m}
              onPress={() => setPaymentMethod(m)}
              style={[styles.chip, paymentMethod === m && styles.chipSelected]}
              textStyle={{ color: paymentMethod === m ? '#fff' : '#607D8B' }}
            >{m}</Chip>
          ))}
        </View>

        <TextInput mode="outlined" label="Unique ID" placeholder="e.g. CB-001"
          value={uniqueId} onChangeText={setUniqueId} style={styles.input}
          outlineColor="#CFD8DC" activeOutlineColor={BRAND} />

        <TextInput mode="outlined" label="Customer Name" placeholder="e.g. Ravi Kumar"
          value={name} onChangeText={setName} style={styles.input}
          outlineColor="#CFD8DC" activeOutlineColor={BRAND} />

        <Text style={styles.sectionLabel}>Date Paid</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{filterDate ? filterDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Select date (optional)'}</Text>
        </TouchableOpacity>
        {filterDate && (
          <TouchableOpacity onPress={() => setFilterDate(null)}>
            <Text style={{ color: '#C62828', fontSize: 12, marginTop: 2 }}>✕ Clear date</Text>
          </TouchableOpacity>
        )}
        {showDatePicker && (
          <DateTimePicker value={filterDate || new Date()} mode="date" display="default"
            onChange={(_, d) => { setShowDatePicker(false); if (d) setFilterDate(d); }} />
        )}

        <View style={styles.btnRow}>
          <Button mode="contained" onPress={handleFilter} loading={loading} style={styles.searchBtn} buttonColor={BRAND} icon="magnify">Search</Button>
          <Button mode="outlined" onPress={clearFilters} style={styles.clearBtn} textColor={BRAND}>Clear</Button>
        </View>
      </View>

      {searched && (
        <FlatList
          data={results}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 12 }}
          ListHeaderComponent={<Text style={styles.resultCount}>{results.length} result(s) found</Text>}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardRow}>
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
                </View>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No records match the filters.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  filterBox: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, elevation: 2 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#37474F', marginTop: 8, marginBottom: 6 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: '#ECEFF1' },
  chipSelected: { backgroundColor: '#1565C0' },
  input: { backgroundColor: '#fff', marginBottom: 8 },
  dateBtn: { backgroundColor: '#F5F7FA', borderRadius: 8, borderWidth: 1, borderColor: '#CFD8DC', padding: 12 },
  dateText: { color: '#607D8B', fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  searchBtn: { flex: 1, borderRadius: 8 },
  clearBtn: { flex: 1, borderRadius: 8, borderColor: '#1565C0' },
  resultCount: { color: '#607D8B', fontSize: 13, marginBottom: 8 },
  card: { marginBottom: 8, borderRadius: 10, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: '#263238' },
  sub: { fontSize: 12, color: '#78909C', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  empty: { textAlign: 'center', color: '#90A4AE', marginTop: 20, fontStyle: 'italic' },
});
