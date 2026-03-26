import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Text, Button, Chip, Card, TextInput, Surface, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFilteredCollections } from '../firebase/collections';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRIMARY = '#004AAD';
const SUCCESS = '#00C853';
const BG = '#F8F9FA';

export default function FilterScreen() {
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [uniqueId, setUniqueId] = useState('');
  const [name, setName] = useState('');
  const [filterDate, setFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFilter = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const filters = { paymentMethod };
      let data = await getFilteredCollections(filters);

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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Surface style={styles.filterCard} elevation={2}>
          <Text style={styles.sectionLabel}>Filter by Method</Text>
          <View style={styles.chipRow}>
            {['All', 'Cash', 'UPI'].map((m) => {
              const selected = paymentMethod === m;
              return (
                <Chip
                  key={m}
                  selected={selected}
                  onPress={() => setPaymentMethod(m)}
                  style={[styles.chip, selected && styles.chipSelected]}
                  textStyle={{ color: selected ? '#fff' : '#607D8B', fontWeight: 'bold' }}
                  showSelectedOverlay
                  selectedColor="#fff"
                >{m}</Chip>
              );
            })}
          </View>

          <View style={styles.inputRow}>
            <TextInput 
              mode="outlined" 
              label="Customer ID" 
              placeholder="e.g. CB-001"
              value={uniqueId} 
              onChangeText={setUniqueId} 
              style={[styles.input, { flex: 1 }]}
              outlineStyle={styles.outline}
              activeOutlineColor={PRIMARY} 
            />
          </View>

          <TextInput 
            mode="outlined" 
            label="Customer Name" 
            placeholder="Search by name..."
            value={name} 
            onChangeText={setName} 
            style={styles.input}
            outlineStyle={styles.outline}
            activeOutlineColor={PRIMARY} 
          />

          <Text style={styles.sectionLabel}>Payment Date</Text>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
            <MaterialCommunityIcons name="calendar-search" size={20} color={PRIMARY} />
            <Text style={styles.datePickerText}>
              {filterDate ? filterDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'All dates'}
            </Text>
            {filterDate && (
              <IconButton 
                icon="close-circle" 
                size={20} 
                iconColor="#B0BEC5" 
                onPress={(e) => { e.stopPropagation(); setFilterDate(null); }} 
              />
            )}
            {!filterDate && <MaterialCommunityIcons name="chevron-down" size={20} color="#B0BEC5" />}
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker 
              value={filterDate || new Date()} 
              mode="date" 
              display="default"
              onChange={(_, d) => { setShowDatePicker(false); if (d) setFilterDate(d); }} 
            />
          )}

          <View style={styles.btnRow}>
            <Button 
              mode="contained" 
              onPress={handleFilter} 
              loading={loading} 
              style={styles.searchBtn} 
              buttonColor={PRIMARY} 
              icon="magnify"
            >
              Search Records
            </Button>
            <Button 
              mode="outlined" 
              onPress={clearFilters} 
              style={styles.clearBtn} 
              textColor="#78909C"
              outlineColor="#ECEFF1"
            >
              Reset
            </Button>
          </View>
        </Surface>

        {searched && (
          <View style={styles.resultsWrapper}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Search Results</Text>
              <Text style={styles.resultCount}>{results.length} found</Text>
            </View>
            
            <FlatList
              data={results}
              keyExtractor={(i) => i.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Card style={styles.card}>
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                      <View style={[styles.avatar, { backgroundColor: item.paymentMethod === 'UPI' ? '#E3F2FD' : '#F9FBE7' }]}>
                        <MaterialCommunityIcons 
                          name={item.paymentMethod === 'UPI' ? 'cellphone-check' : 'cash'} 
                          size={20} 
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
                      <Text style={styles.streetLabel}>{item.customerStreet}</Text>
                    </View>
                  </Card.Content>
                </Card>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <MaterialCommunityIcons name="database-off" size={50} color="#CFD8DC" />
                  <Text style={styles.emptyText}>No matching records found</Text>
                </View>
              }
            />
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  filterCard: { backgroundColor: '#fff', margin: 20, borderRadius: 24, padding: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#455A64', marginTop: 10, marginBottom: 8, marginLeft: 4 },
  chipRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  chip: { backgroundColor: '#F5F7FA', borderRadius: 10 },
  chipSelected: { backgroundColor: PRIMARY },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { backgroundColor: '#fff', marginBottom: 12 },
  outline: { borderRadius: 14, borderColor: '#ECEFF1' },
  datePickerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F5F7FA', 
    borderRadius: 14, 
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEFF1'
  },
  datePickerText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#455A64', fontWeight: '500' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 25 },
  searchBtn: { flex: 2, borderRadius: 14 },
  clearBtn: { flex: 1, borderRadius: 14 },
  resultsWrapper: { paddingHorizontal: 20 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  resultsTitle: { fontSize: 18, fontWeight: 'bold', color: '#263238' },
  resultCount: { fontSize: 12, color: '#90A4AE', fontWeight: '600' },
  card: { backgroundColor: '#fff', marginBottom: 12, borderRadius: 16, elevation: 1 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: 'bold', color: '#263238' },
  sub: { fontSize: 11, color: '#90A4AE', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: SUCCESS },
  streetLabel: { fontSize: 10, color: '#78909C', marginTop: 2, textTransform: 'uppercase' },
  empty: { marginTop: 40, alignItems: 'center' },
  emptyText: { color: '#90A4AE', marginTop: 10, fontSize: 14, fontStyle: 'italic' },
});

