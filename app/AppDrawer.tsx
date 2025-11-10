import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DashboardScreen from './DashboardScreen';
import TransactionsScreen from './TransactionsScreen';
import PaymentScreen from './PaymentScreen';
import SettingsScreen from './SettingsScreen';
import CustomDrawerContent from './CustomDrawerContent';
import MyOrdersScreen from './MyOrdersScreen';

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: { backgroundColor: 'rgb(144, 238, 144)' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
      }}
      drawerContent={props => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="My Orders" component={MyOrdersScreen} />
      <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ headerTitle: '' }} />
      <Drawer.Screen name="Transactions" component={TransactionsScreen} />
      <Drawer.Screen name="Payment" component={PaymentScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}
