import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { addCustomer, updateCustomer } from '../firebase/customers';

const BRAND = '#1565C0';

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
    if (!name.trim()) e.name = 'Name is required';
    if (!uniqueId.trim()) e.uniqueId = 'Unique ID is required';
    if (!street.trim()) e.street = 'Street is required';
    if (!phone.trim()) e.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(phone.trim())) e.phone = 'Enter a valid 10-digit phone number';
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
        Alert.alert('Success', 'Customer updated successfully!');
      } else {
        await addCustomer(data);
        Alert.alert('Success', 'Customer added successfully!');
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          mode="outlined"
          placeholder="e.g. Ravi Kumar"
          value={name}
          onChangeText={setName}
          error={!!errors.name}
          style={styles.input}
          outlineColor="#CFD8DC"
          activeOutlineColor={BRAND}
        />
        {errors.name && <HelperText type="error">{errors.name}</HelperText>}

        <Text style={styles.label}>Unique ID *</Text>
        <TextInput
          mode="outlined"
          placeholder="e.g. CB-001"
          value={uniqueId}
          onChangeText={setUniqueId}
          error={!!errors.uniqueId}
          style={styles.input}
          outlineColor="#CFD8DC"
          activeOutlineColor={BRAND}
          autoCapitalize="characters"
        />
        {errors.uniqueId && <HelperText type="error">{errors.uniqueId}</HelperText>}

        <Text style={styles.label}>Street Name *</Text>
        <TextInput
          mode="outlined"
          placeholder="e.g. Gandhi Nagar, 2nd Street"
          value={street}
          onChangeText={setStreet}
          error={!!errors.street}
          style={styles.input}
          outlineColor="#CFD8DC"
          activeOutlineColor={BRAND}
        />
        {errors.street && <HelperText type="error">{errors.street}</HelperText>}

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          mode="outlined"
          placeholder="10-digit mobile number"
          value={phone}
          onChangeText={setPhone}
          error={!!errors.phone}
          style={styles.input}
          outlineColor="#CFD8DC"
          activeOutlineColor={BRAND}
          keyboardType="phone-pad"
          maxLength={10}
        />
        {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveBtn}
          buttonColor={BRAND}
        >
          {existing ? 'Update Customer' : 'Add Customer'}
        </Button>
        <Button mode="text" onPress={() => navigation.goBack()} style={{ marginTop: 4 }}>
          Cancel
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#37474F', marginBottom: 4, marginTop: 12 },
  input: { backgroundColor: '#fff', marginBottom: 2 },
  saveBtn: { marginTop: 28, borderRadius: 8, paddingVertical: 4 },
});
