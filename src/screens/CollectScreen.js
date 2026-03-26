import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { TextInput, Button, Text, Menu, Divider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { subscribeToCustomers } from '../firebase/customers';
import { addOrUpdateCollection } from '../firebase/collections';

const BRAND = '#1565C0';

export default function CollectScreen() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCustomers(setCustomers);
    return unsub;
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.uniqueId?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedCustomer) { Alert.alert('Error', 'Please select a customer'); return; }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount'); return;
    }

    setLoading(true);
    try {
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      await addOrUpdateCollection({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerUniqueId: selectedCustomer.uniqueId,
        customerStreet: selectedCustomer.street,
        amount: parseFloat(amount),
        paymentMethod,
        paidDate: formattedDate,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      });
      Alert.alert('Success', `Payment of ₹${amount} recorded for ${selectedCustomer.name}!`);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setAmount('');
      setPaymentMethod('Cash');
      setDate(new Date());
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>

        {/* Customer Picker */}
        <Text style={styles.label}>Customer *</Text>
        <TextInput
          mode="outlined"
          placeholder="Search by name or ID..."
          value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.uniqueId})` : customerSearch}
          onChangeText={(t) => { setCustomerSearch(t); setSelectedCustomer(null); setMenuVisible(true); }}
          onFocus={() => setMenuVisible(true)}
          style={styles.input}
          outlineColor="#CFD8DC"
          activeOutlineColor={BRAND}
          right={selectedCustomer ? <TextInput.Icon icon="close" onPress={() => { setSelectedCustomer(null); setCustomerSearch(''); }} /> : null}
        />
        {menuVisible && customerSearch.length > 0 && !selectedCustomer && (
          <View style={styles.dropdown}>
            {filteredCustomers.slice(0, 6).map((c) => (
              <TouchableOpacity key={c.id} style={styles.dropdownItem} onPress={() => { setSelectedCustomer(c); setCustomerSearch(''); setMenuVisible(false); }}>
                <Text style={styles.dropdownName}>{c.name}</Text>
                <Text style={styles.dropdownSub}>{c.uniqueId} • {c.street}</Text>
              </TouchableOpacity>
            ))}
            {filteredCustomers.length === 0 && (
              <Text style={styles.dropdownEmpty}>No customer found</Text>
            )}
          </View>
        )}

        {/* Amount */}
        <Text style={styles.label}>Amount (₹) *</Text>
        <TextInput
          mode="outlined"
          placeholder="e.g. 350"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
          outlineColor="#CFD8DC"
          activeOutlineColor={BRAND}
          left={<TextInput.Affix text="₹" />}
        />

        {/* Payment Method */}
        <Text style={styles.label}>Payment Method *</Text>
        <View style={styles.toggle}>
          {['Cash', 'UPI'].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, paymentMethod === m && styles.toggleActive]}
              onPress={() => setPaymentMethod(m)}
            >
              <Text style={[styles.toggleText, paymentMethod === m && styles.toggleTextActive]}>
                {m === 'Cash' ? '💵 Cash' : '📱 UPI'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date */}
        <Text style={styles.label}>Date *</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>📅 {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }}
          />
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitBtn}
          buttonColor={BRAND}
          icon="check"
        >
          Record Payment
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#37474F', marginBottom: 4, marginTop: 16 },
  input: { backgroundColor: '#fff', marginBottom: 2 },
  dropdown: { backgroundColor: '#fff', borderRadius: 8, elevation: 4, marginTop: 2, borderWidth: 1, borderColor: '#E0E0E0' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  dropdownName: { fontSize: 14, fontWeight: '600', color: '#263238' },
  dropdownSub: { fontSize: 12, color: '#90A4AE' },
  dropdownEmpty: { padding: 12, color: '#90A4AE', textAlign: 'center' },
  toggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#CFD8DC', marginTop: 4 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  toggleActive: { backgroundColor: '#1565C0' },
  toggleText: { fontWeight: '600', color: '#607D8B', fontSize: 15 },
  toggleTextActive: { color: '#fff' },
  dateBtn: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#CFD8DC', padding: 14, marginTop: 4 },
  dateText: { fontSize: 15, color: '#37474F' },
  submitBtn: { marginTop: 32, borderRadius: 8, paddingVertical: 4 },
});
