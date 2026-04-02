import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { TextInput, Button, Text, IconButton, Surface } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { subscribeToCustomers } from '../firebase/customers';
import { addOrUpdateCollection } from '../firebase/collections';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRIMARY = '#004AAD';
const SUCCESS = '#00C853';
const BG = '#F8F9FA';

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
    return subscribeToCustomers(setCustomers);
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.uniqueId?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedCustomer) { Alert.alert('Selection Required', 'Please choose a customer first.'); return; }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.'); return;
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
      Alert.alert('Success 🎉', `Payment of ₹${amount} recorded for ${selectedCustomer.name}!`);
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Surface style={styles.formCard} elevation={2}>
          <Text style={styles.formTitle}>Record Payment</Text>
          <Text style={styles.formSub}>Enter payment details for the customer</Text>

          {/* Customer Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Customer</Text>
            <TextInput
              mode="outlined"
              placeholder="Search by name or ID..."
              value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.uniqueId})` : customerSearch}
              onChangeText={(t) => { setCustomerSearch(t); setSelectedCustomer(null); setMenuVisible(true); }}
              onFocus={() => setMenuVisible(true)}
              style={styles.input}
              outlineStyle={styles.outline}
              activeOutlineColor={PRIMARY}
              left={<TextInput.Icon icon="account-search-outline" color={PRIMARY} />}
              right={selectedCustomer ? <TextInput.Icon icon="close-circle" iconColor="#B0BEC5" onPress={() => { setSelectedCustomer(null); setCustomerSearch(''); }} /> : null}
            />
            {menuVisible && customerSearch.length > 0 && !selectedCustomer && (
              <Surface style={styles.dropdown} elevation={4}>
                {filteredCustomers.slice(0, 5).map((c) => (
                  <TouchableOpacity 
                    key={c.id} 
                    style={styles.dropdownItem} 
                    onPress={() => { setSelectedCustomer(c); setCustomerSearch(''); setMenuVisible(false); }}
                  >
                    <View style={styles.circle}>
                      <Text style={styles.circleText}>{c.name.substring(0, 1)}</Text>
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.dropdownName}>{c.name}</Text>
                      <Text style={styles.dropdownSub}>{c.uniqueId} • {c.street}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {filteredCustomers.length === 0 && (
                  <Text style={styles.dropdownEmpty}>No customer matches</Text>
                )}
              </Surface>
            )}
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Amount</Text>
            <TextInput
              mode="outlined"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
              outlineStyle={styles.outline}
              activeOutlineColor={PRIMARY}
              left={<TextInput.Affix text="₹" textStyle={{ color: PRIMARY, fontWeight: 'bold' }} />}
            />
          </View>

          {/* Payment Method */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.toggleRow}>
              {['Cash', 'UPI', 'Later'].map((m) => {
                const isActive = paymentMethod === m;
                let icon = 'cash';
                if (m === 'UPI') icon = 'cellphone-check';
                if (m === 'Later') icon = 'clock-outline';
                
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.toggleBtn, isActive && styles.toggleBtnActive]}
                    onPress={() => setPaymentMethod(m)}
                  >
                    <MaterialCommunityIcons 
                      name={icon} 
                      size={20} 
                      color={isActive ? '#fff' : '#78909C'} 
                    />
                    <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Date</Text>
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
              <MaterialCommunityIcons name="calendar-month-outline" size={22} color={PRIMARY} />
              <Text style={styles.datePickerText}>
                {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#B0BEC5" />
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
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitBtn}
            contentStyle={styles.submitBtnContent}
            buttonColor={PRIMARY}
          >
            Confirm & Record Payment
          </Button>
        </Surface>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 20 },
  formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20 },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: '#263238' },
  formSub: { fontSize: 13, color: '#90A4AE', marginBottom: 20, marginTop: 4 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#455A64', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#fff' },
  outline: { borderRadius: 14, borderColor: '#ECEFF1' },
  dropdown: { backgroundColor: '#fff', borderRadius: 14, marginTop: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#ECEFF1' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F7FA' },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center' },
  circleText: { fontSize: 14, fontWeight: 'bold', color: PRIMARY },
  dropdownName: { fontSize: 14, fontWeight: 'bold', color: '#263238' },
  dropdownSub: { fontSize: 11, color: '#90A4AE' },
  dropdownEmpty: { padding: 16, textAlign: 'center', color: '#B0BEC5' },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 14, 
    borderRadius: 14, 
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#ECEFF1'
  },
  toggleBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  toggleText: { marginLeft: 8, fontSize: 15, fontWeight: 'bold', color: '#78909C' },
  toggleTextActive: { color: '#fff' },
  datePickerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#ECEFF1', 
    borderRadius: 14, 
    padding: 14 
  },
  datePickerText: { flex: 1, marginLeft: 12, fontSize: 15, color: '#263238', fontWeight: '500' },
  submitBtn: { marginTop: 15, borderRadius: 16 },
  submitBtnContent: { paddingVertical: 8, fontSize: 16, fontWeight: 'bold' },
});

