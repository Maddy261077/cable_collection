import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Text, Button, Chip, Card, TextInput, Surface, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFilteredCollections } from '../firebase/collections';
import { subscribeToCustomers } from '../firebase/customers';
import { subscribeToCollectionsByMonth } from '../firebase/collections';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRIMARY = '#004AAD';
const SUCCESS = '#00C853';
const DANGER = '#D50000';
const BG = '#F8F9FA';

const MONTHS_LIST = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function FilterScreen() {
  const now = new Date();
  const [filterType, setFilterType] = useState('paid'); // 'paid' or 'unpaid'
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [uniqueId, setUniqueId] = useState('');
  const [name, setName] = useState('');
  const [filterDate, setFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Month/Year for unpaid filter
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // All customers and collections for unpaid check
  const [allCustomers, setAllCustomers] = useState([]);

  useEffect(() => {
    return subscribeToCustomers(setAllCustomers);
  }, []);

  const handleFilter = async () => {
    setLoading(true);
    setSearched(true);
    try {
      if (filterType === 'unpaid') {
        // Fetch collections for the selected month/year to find who has paid
        const collectionsData = await new Promise((resolve) => {
          const unsub = subscribeToCollectionsByMonth(selectedMonth, selectedYear, (data) => {
            unsub();
            resolve(data);
          });
        });

        // Customers who paid with Cash/UPI are truly paid
        const paidCustomerIds = new Set(
          collectionsData
            .filter((c) => c.paymentMethod !== 'Later')
            .map((c) => c.customerId)
        );

        // Customers who chose "Later" payment
        const laterCustomerIds = new Set(
          collectionsData
            .filter((c) => c.paymentMethod === 'Later')
            .map((c) => c.customerId)
        );

        // Get all customers who haven't paid (includes later + truly unpaid)
        let unpaidAndLaterCustomers = allCustomers
          .filter((c) => !paidCustomerIds.has(c.id))
          .map((c) => ({
            ...c,
            paymentStatus: laterCustomerIds.has(c.id) ? 'Later' : 'Unpaid',
          }));

        setResults(unpaidAndLaterCustomers);
      } else {
        // Paid filter - existing logic
        const filters = { paymentMethod };
        let data = await getFilteredCollections(filters);

        if (uniqueId.trim()) data = data.filter((r) => r.customerUniqueId?.toLowerCase().includes(uniqueId.toLowerCase()));
        if (name.trim()) data = data.filter((r) => r.customerName?.toLowerCase().includes(name.toLowerCase()));
        if (filterDate) {
          const formattedDate = `${filterDate.getFullYear()}-${String(filterDate.getMonth() + 1).padStart(2, '0')}-${String(filterDate.getDate()).padStart(2, '0')}`;
          data = data.filter((r) => r.paidDate === formattedDate);
        }

        setResults(data);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterType('paid');
    setPaymentMethod('All');
    setUniqueId('');
    setName('');
    setFilterDate(null);
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
    setResults([]);
    setSearched(false);
  };

  const changeYear = (dir) => {
    setSelectedYear((y) => y + dir);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Surface style={styles.filterCard} elevation={2}>
          {/* Filter Type Toggle */}
          <Text style={styles.sectionLabel}>Filter Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, filterType === 'paid' && styles.toggleBtnActive]}
              onPress={() => setFilterType('paid')}
            >
              <MaterialCommunityIcons name="check-circle" size={18} color={filterType === 'paid' ? '#fff' : '#78909C'} />
              <Text style={[styles.toggleText, filterType === 'paid' && styles.toggleTextActive]}>Paid Records</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, filterType === 'unpaid' && styles.toggleBtnUnpaid]}
              onPress={() => setFilterType('unpaid')}
            >
              <MaterialCommunityIcons name="alert-circle" size={18} color={filterType === 'unpaid' ? '#fff' : '#78909C'} />
              <Text style={[styles.toggleText, filterType === 'unpaid' && styles.toggleTextUnpaid]}>Unpaid Customers</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Method filter (only for paid) */}
          {filterType === 'paid' && (
            <>
              <Text style={styles.sectionLabel}>Filter by Method</Text>
              <View style={styles.chipRow}>
                {['All', 'Cash', 'UPI', 'Later'].map((m) => {
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
            </>
          )}

          {/* Month/Year Picker (only for unpaid) */}
          {filterType === 'unpaid' && (
            <>
              <Text style={styles.sectionLabel}>Select Month & Year</Text>
              <View style={styles.monthYearRow}>
                <IconButton icon="chevron-left" size={22} iconColor={PRIMARY} onPress={() => changeYear(-1)} />
                <Text style={styles.yearText}>{selectedYear}</Text>
                <IconButton icon="chevron-right" size={22} iconColor={PRIMARY} onPress={() => changeYear(1)} />
              </View>
              <View style={styles.monthGrid}>
                {MONTHS_LIST.map((m, idx) => {
                  const isSelected = selectedMonth === idx + 1;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.monthChip, isSelected && styles.monthChipSelected]}
                      onPress={() => setSelectedMonth(idx + 1)}
                    >
                      <Text style={[styles.monthChipText, isSelected && styles.monthChipTextSelected]}>
                        {m.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Customer ID & Name input (only for paid filter) */}
          {filterType === 'paid' && (
            <>
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
            </>
          )}

          {/* Date filter (only for paid) */}
          {filterType === 'paid' && (
            <>
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
            </>
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
              <Text style={styles.resultsTitle}>
                {filterType === 'unpaid' ? '❌ Unpaid Customers' : '✅ Search Results'}
              </Text>
              <Text style={styles.resultCount}>{results.length} found</Text>
            </View>

            <FlatList
              data={results}
              keyExtractor={(i) => i.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                if (filterType === 'unpaid') {
                  // Unpaid / Later customer card
                  const isLater = item.paymentStatus === 'Later';
                  return (
                    <Card style={styles.card}>
                      <Card.Content style={styles.cardContent}>
                        <View style={styles.cardLeft}>
                          <View style={[styles.avatar, { backgroundColor: isLater ? '#FFF3E0' : '#FFEBEE' }]}>
                            <MaterialCommunityIcons
                              name={isLater ? 'clock-outline' : 'account-alert'}
                              size={20}
                              color={isLater ? '#E65100' : DANGER}
                            />
                          </View>
                          <View style={{ marginLeft: 12 }}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.sub}>ID: {item.uniqueId}</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.statusBadge, isLater
                            ? { backgroundColor: '#FFF3E0', color: '#E65100' }
                            : { backgroundColor: '#FFEBEE', color: DANGER }
                          ]}>
                            {isLater ? 'LATER' : 'UNPAID'}
                          </Text>
                        </View>
                      </Card.Content>
                    </Card>
                  );
                }

                // Paid record card
                return (
                  <Card style={styles.card}>
                    <Card.Content style={styles.cardContent}>
                      <View style={styles.cardLeft}>
                        <View style={[styles.avatar, {
                          backgroundColor: item.paymentMethod === 'UPI' ? '#E3F2FD' : (item.paymentMethod === 'Later' ? '#FBE9E7' : '#F9FBE7')
                        }]}>
                          <MaterialCommunityIcons
                            name={item.paymentMethod === 'UPI' ? 'cellphone-check' : (item.paymentMethod === 'Later' ? 'clock-outline' : 'cash')}
                            size={20}
                            color={item.paymentMethod === 'UPI' ? '#1565C0' : (item.paymentMethod === 'Later' ? '#D84315' : '#827717')}
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
                );
              }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <MaterialCommunityIcons
                    name={filterType === 'unpaid' ? 'account-check' : 'database-off'}
                    size={50}
                    color="#CFD8DC"
                  />
                  <Text style={styles.emptyText}>
                    {filterType === 'unpaid'
                      ? 'All customers have paid for this month! 🎉'
                      : 'No matching records found'}
                  </Text>
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
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    gap: 6,
  },
  toggleBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  toggleBtnUnpaid: { backgroundColor: DANGER, borderColor: DANGER },
  toggleText: { fontSize: 13, fontWeight: 'bold', color: '#78909C' },
  toggleTextActive: { color: '#fff' },
  toggleTextUnpaid: { color: '#fff' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
  chip: { backgroundColor: '#F5F7FA', borderRadius: 10 },
  chipSelected: { backgroundColor: PRIMARY },
  inputRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  input: { backgroundColor: '#fff', marginBottom: 12 },
  outline: { borderRadius: 14, borderColor: '#ECEFF1' },
  monthYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  yearText: { fontSize: 18, fontWeight: 'bold', color: '#263238', marginHorizontal: 10 },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  monthChip: {
    width: '22%',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  monthChipSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  monthChipText: { fontSize: 13, fontWeight: '600', color: '#607D8B' },
  monthChipTextSelected: { color: '#fff' },
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
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: 'bold', color: '#263238' },
  sub: { fontSize: 11, color: '#90A4AE', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: SUCCESS },
  statusBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  methodLabel: { fontSize: 10, color: '#78909C', marginTop: 2, textTransform: 'uppercase', fontWeight: 'bold' },
  empty: { marginTop: 40, alignItems: 'center' },
  emptyText: { color: '#90A4AE', marginTop: 10, fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
});
