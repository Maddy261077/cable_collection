import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import CustomersScreen from '../screens/CustomersScreen';
import AddEditCustomerScreen from '../screens/AddEditCustomerScreen';
import CollectScreen from '../screens/CollectScreen';
import FilterScreen from '../screens/FilterScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const BRAND = '#1565C0';
const INACTIVE = '#90A4AE';

function CustomersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: BRAND }, headerTintColor: '#fff' }}>
      <Stack.Screen name="CustomersList" component={CustomersScreen} options={{ title: 'Customers' }} />
      <Stack.Screen name="AddEditCustomer" component={AddEditCustomerScreen} options={({ route }) => ({ title: route.params?.customer ? 'Edit Customer' : 'Add Customer' })} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: BRAND },
        headerTintColor: '#fff',
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: { paddingBottom: 5, height: 60 },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'view-dashboard',
            Customers: 'account-group',
            Collect: 'cash-plus',
            Filter: 'filter-variant',
            Reports: 'file-chart',
          };
          return <MaterialCommunityIcons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Customers" component={CustomersStack} options={{ headerShown: false }} />
      <Tab.Screen name="Collect" component={CollectScreen} options={{ title: 'Record Payment' }} />
      <Tab.Screen name="Filter" component={FilterScreen} options={{ title: 'Filter' }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
    </Tab.Navigator>
  );
}
