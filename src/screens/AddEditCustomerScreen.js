import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import { TextInput, Button, Text, HelperText, Surface } from 'react-native-paper';
import { addCustomer, updateCustomer } from '../firebase/customers';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRIMARY = '#004AAD';
const BG = '#F8F9FA';

export default function AddEditCustomerScreen({ route, navigation }) {
  const existing = route.params?.customer;

  const [name, setName] = useState(existing?.name || '');
  const [uniqueId, setUniqueId] = useState(existing?.uniqueId || '');
  const [street, setStreet] = useState(existing?.street || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!uniqueId.trim()) e.uniqueId = 'Customer Unique ID is required';
    if (!street.trim()) e.street = 'Street/Area location is required';
    if (!phone.trim()) e.phone = 'Contact number is required';
    else if (!/^\d{10}$/.test(phone.trim())) e.phone = 'Please enter a valid 10-digit number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = { name: name.trim(), uniqueId: uniqueId.trim(), street: street.trim(), phone: phone.trim() };
      if (existing) {
        await updateCustomer(existing.id, data);
        Alert.alert('Success 🎉', 'Customer profile updated!');
      } else {
        await addCustomer(data);
        Alert.alert('Success 🎉', 'New customer added successfully!');
      }
      navigation.goBack();
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
          <View style={styles.header}>
            <MaterialCommunityIcons 
              name={existing ? "account-edit" : "account-plus"} 
              size={40} 
              color={PRIMARY} 
            />
            <View style={{ marginLeft: 15 }}>
              <Text style={styles.title}>{existing ? 'Edit Profile' : 'New Customer'}</Text>
              <Text style={styles.sub}>{existing ? 'Modify existing customer details' : 'Register a new customer'}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              mode="outlined"
              placeholder="e.g. John Doe"
              value={name}
              onChangeText={setName}
              error={!!errors.name}
              style={styles.input}
              outlineStyle={styles.outline}
              activeOutlineColor={PRIMARY}
              left={<TextInput.Icon icon="account-outline" color={PRIMARY} />}
            />
            {errors.name && <HelperText type="error" style={styles.helper}>{errors.name}</HelperText>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Unique ID</Text>
            <TextInput
              mode="outlined"
              placeholder="e.g. CB2026-001"
              value={uniqueId}
              onChangeText={setUniqueId}
              error={!!errors.uniqueId}
              style={styles.input}
              outlineStyle={styles.outline}
              activeOutlineColor={PRIMARY}
              autoCapitalize="characters"
              left={<TextInput.Icon icon="card-account-details-outline" color={PRIMARY} />}
            />
            {errors.uniqueId && <HelperText type="error" style={styles.helper}>{errors.uniqueId}</HelperText>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street / Area</Text>
            <TextInput
              mode="outlined"
              placeholder="e.g. Main Street, Sector 4"
              value={street}
              onChangeText={setStreet}
              error={!!errors.street}
              style={styles.input}
              outlineStyle={styles.outline}
              activeOutlineColor={PRIMARY}
              left={<TextInput.Icon icon="map-marker-outline" color={PRIMARY} />}
            />
            {errors.street && <HelperText type="error" style={styles.helper}>{errors.street}</HelperText>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              mode="outlined"
              placeholder="10-digit number"
              value={phone}
              onChangeText={setPhone}
              error={!!errors.phone}
              style={styles.input}
              outlineStyle={styles.outline}
              activeOutlineColor={PRIMARY}
              keyboardType="phone-pad"
              maxLength={10}
              left={<TextInput.Icon icon="phone-outline" color={PRIMARY} />}
            />
            {errors.phone && <HelperText type="error" style={styles.helper}>{errors.phone}</HelperText>}
          </View>

          <View style={styles.buttonRow}>
            <Button 
              mode="outlined" 
              onPress={() => navigation.goBack()} 
              style={styles.cancelBtn}
              textColor="#78909C"
              outlineColor="#ECEFF1"
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={styles.saveBtn}
              buttonColor={PRIMARY}
              contentStyle={{ paddingVertical: 4 }}
            >
              {existing ? 'Save Changes' : 'Add Customer'}
            </Button>
          </View>
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
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#263238' },
  sub: { fontSize: 13, color: '#90A4AE', marginTop: 2 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '700', color: '#455A64', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#fff' },
  outline: { borderRadius: 14, borderColor: '#ECEFF1' },
  helper: { paddingLeft: 0, marginTop: -4 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderRadius: 14 },
  saveBtn: { flex: 2, borderRadius: 14 },
});

