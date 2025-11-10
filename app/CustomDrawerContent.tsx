import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Feather, AntDesign } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { getCustomerSession } from '@/lib/session';

import { DrawerContentComponentProps } from '@react-navigation/drawer';
export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const [custName, setCustName] = useState<string>('Customer');
  const [custPhone, setCustPhone] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await getCustomerSession();
      if (mounted && s) {
        setCustName(s.name || 'Customer');
        setCustPhone(s.phone || '');
      }
    })();
    return () => { mounted = false; };
  }, []);

  const initials = (custName || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || 'CU';
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{flex: 1, backgroundColor: '#fff'}}>
      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={{marginLeft: 10}}>
          <Text style={styles.userName}>{custName}</Text>
          {!!custPhone && <Text style={styles.userPhone}>{custPhone}</Text>}
          <Text style={styles.userAddress}></Text>
        </View>
      </View>
      {/* Drawer Items */}
      <View style={{flex: 1}}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Dashboard" style={[styles.menuItem]} onPress={() => navigation.navigate('Dashboard')}>
          <View style={styles.menuLeft}>
            <AntDesign name="home" color="rgb(76, 175, 80)" size={20} style={styles.menuIcon} />
            <Text style={styles.menuText}>Dashboard</Text>
          </View>
          <Feather name="chevron-right" size={20} color="rgb(76, 175, 80)" />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="My Orders" style={[styles.menuItem]} onPress={() => navigation.navigate('My Orders')}>
          <View style={styles.menuLeft}>
            <Feather name="list" color="rgb(76, 175, 80)" size={20} style={styles.menuIcon} />
            <Text style={styles.menuText}>My Orders</Text>
          </View>
          <Feather name="chevron-right" size={20} color="rgb(76, 175, 80)" />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Transactions" style={[styles.menuItem]} onPress={() => navigation.navigate('Transactions')}>
          <View style={styles.menuLeft}>
            <Feather name="credit-card" color="rgb(76, 175, 80)" size={20} style={styles.menuIcon} />
            <Text style={styles.menuText}>Transactions</Text>
          </View>
          <Feather name="chevron-right" size={20} color="rgb(76, 175, 80)" />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Payments" style={[styles.menuItem]} onPress={() => navigation.navigate('Payment')}>
          <View style={styles.menuLeft}>
            <Feather name="dollar-sign" color="rgb(76, 175, 80)" size={20} style={styles.menuIcon} />
            <Text style={styles.menuText}>Payments</Text>
          </View>
          <Feather name="chevron-right" size={20} color="rgb(76, 175, 80)" />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Rate Us" style={[styles.menuItem]} onPress={() => Linking.openURL('market://details?id=com.milkwalacustomer')}>
          <View style={styles.menuLeft}>
            <Feather name="star" color="rgb(76, 175, 80)" size={20} style={styles.menuIcon} />
            <Text style={styles.menuText}>Rate Us</Text>
          </View>
          <Feather name="chevron-right" size={20} color="rgb(76, 175, 80)" />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Settings" style={[styles.menuItem]} onPress={() => navigation.navigate('Settings')}>
          <View style={styles.menuLeft}>
            <Feather name="settings" color="rgb(76, 175, 80)" size={20} style={styles.menuIcon} />
            <Text style={styles.menuText}>Settings</Text>
          </View>
          <Feather name="chevron-right" size={20} color="rgb(76, 175, 80)" />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Logout" style={[styles.menuItem]} onPress={() => {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }}>
          <View style={styles.menuLeft}>
            <Feather name="log-out" color="rgb(76, 175, 80)" size={20} style={styles.menuIcon} />
            <Text style={styles.menuText}>Logout</Text>
          </View>
          <Feather name="chevron-right" size={20} color="rgb(76, 175, 80)" />
        </TouchableOpacity>
        
      </View>
      {/* Bottom Section */}
      <View style={[styles.bottomSection, {backgroundColor: 'transparent'}]}>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 18}}>
          {/* Black skeleton/logo icon, e.g., a simple SVG or emoji placeholder */}
          <Feather name="globe" size={26} color="#222" />
          <Text style={styles.langText}>English ▼</Text>
        </View>
        <View style={styles.socialRow}>
          <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com')} style={styles.socialBtn}><FontAwesome name="instagram" size={18} color="#fff" /></TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://youtube.com')} style={styles.socialBtn}><FontAwesome name="youtube" size={18} color="#fff" /></TouchableOpacity>
          <TouchableOpacity onPress={() => { /* TODO: Theme toggle */ }} style={styles.socialBtn}><Feather name="moon" size={18} color="#fff" /></TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://wa.me/')} style={styles.socialBtn}><FontAwesome name="whatsapp" size={18} color="#fff" /></TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.socialBtn}><Feather name="share-2" size={18} color="#fff" /></TouchableOpacity>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  userInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgb(144, 238, 144)', padding: 16, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgb(144, 238, 144)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: 'bold', fontSize: 18, color: '#fff' },
  userName: { fontWeight: 'bold', fontSize: 15, color: '#222' },
  userPhone: { color: '#222', fontSize: 13 },
  userAddress: { color: '#222', fontSize: 13 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuText: { fontSize: 15, color: '#222', fontWeight: '600' },
  bottomSection: { marginTop: 30, alignItems: 'center', backgroundColor: 'transparent' },
  langBtn: { backgroundColor: 'rgb(144, 238, 144)', borderRadius: 20, padding: 7, borderColor: '#fff', borderWidth: 1 },
  langIcon: { fontSize: 18, color: '#fff' },
  langText: { marginTop: 6, marginBottom: 14, color: '#222' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  socialBtn: { backgroundColor: 'rgb(144, 238, 144)', borderRadius: 20, padding: 10, marginHorizontal: 4 },
});
