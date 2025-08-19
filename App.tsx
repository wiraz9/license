

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { db } from './firebaseConfig';
import { collection, onSnapshot, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import * as Clipboard from 'expo-clipboard';

export type Activation = {
  id: string;
  activatedAt: string;
  appVersion: string;
  deviceId: string;
  deviceInfo: {
    brand?: string;
    deviceType?: number;
    modelName?: string;
    osName?: string;
    osVersion?: string;
    totalMemory?: number;
  };
  licenseDocId: string;
  licenseKey: string;
  ownerName: string;
};

export type License = {
  id: string;
  key: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  activatedAt?: string;
  currentDevices?: number;
  maxDevices?: number;
  notes?: string;
  deviceId?: string;
  deviceInfo?: {
    brand?: string;
    deviceType?: number;
    modelName?: string;
    osName?: string;
    osVersion?: string;
    totalMemory?: number;
  };
};

export default function App() {
  const [licenseList, setLicenseList] = useState<License[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen licenses
    const q = collection(db, 'licenses');
    const unsubscribeLicenses = onSnapshot(q, (snapshot) => {
      const data: License[] = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          key: d.key || '',
          type: d.type || '',
          isActive: d.isActive ?? false,
          createdAt: d.createdAt || '',
          activatedAt: d.activatedAt || '',
          currentDevices: d.currentDevices ?? 0,
          maxDevices: d.maxDevices ?? 0,
          notes: d.notes || '',
          deviceId: d.deviceId || '',
          deviceInfo: d.deviceInfo || {},
        };
      });
      setLicenseList(data);
      setLoading(false);
    }, err => {
      setLoading(false);
    });

    // Listen activations
    const qa = collection(db, 'activations');
    const unsubscribeActivations = onSnapshot(qa, (snapshot) => {
      const data: Activation[] = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          activatedAt: d.activatedAt || '',
          appVersion: d.appVersion || '',
          deviceId: d.deviceId || '',
          deviceInfo: d.deviceInfo || {},
          licenseDocId: d.licenseDocId || '',
          licenseKey: d.licenseKey || '',
          ownerName: d.ownerName || '',
        };
      });
      setActivations(data);
    });

    return () => {
      unsubscribeLicenses();
      unsubscribeActivations();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <Text style={styles.title}>Admin Panel - License Manager</Text>
      <View style={styles.dashboard}>
        <View style={styles.dashboardItem}><Text style={styles.dashboardNumber}>{licenseList.length}</Text><Text>Total</Text></View>
        <View style={styles.dashboardItem}><Text style={styles.dashboardNumber}>{licenseList.filter(l => !l.isActive).length}</Text><Text>Ready</Text></View>
        <View style={styles.dashboardItem}><Text style={styles.dashboardNumber}>{licenseList.filter(l => l.isActive).length}</Text><Text>Terpakai</Text></View>
      </View>
      <TouchableOpacity style={styles.createButton}><Text style={styles.createButtonText}>+ Buat License Baru</Text></TouchableOpacity>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton}><Text>Refresh</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ffcccc' }]}><Text>Reset App</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ccf2ff' }]}><Text>Info</Text></TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#1abc9c" style={{ marginTop: 32 }} />
      ) : (
        <ScrollView style={styles.licenseList}>
          {licenseList.map((license, idx) => {
            // Cari activation yang cocok
            const activation = activations.find(a => a.licenseDocId === license.id || a.licenseKey === license.key);
            const isActivated = !!activation;
            return (
              <View key={idx} style={styles.licenseCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.licenseId}>{license.key}</Text>
                  <Text style={[styles.status, {backgroundColor: isActivated ? '#27ae60' : '#2fa4ff'}]}>
                    {isActivated ? 'Terpakai' : 'Ready'}
                  </Text>
                </View>
                <Text>Lisensi: {license.key}</Text>
                <Text>Owner: {activation ? activation.ownerName : '-'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                  <Text>Status Lisensi: </Text>
                  <Switch
                    value={isActivated}
                    disabled
                    thumbColor={isActivated ? '#27ae60' : '#ccc'}
                  />
                </View>
                {activation && (
                  <View style={{ marginBottom: 4 }}>
                    <Text>Activated At: {activation.activatedAt}</Text>
                    <Text>Device ID: {activation.deviceId}</Text>
                    <Text>App Version: {activation.appVersion}</Text>
                    <Text>Device Info:</Text>
                    <Text>- Brand: {activation.deviceInfo.brand || '-'}</Text>
                    <Text>- Model: {activation.deviceInfo.modelName || '-'}</Text>
                    <Text>- OS: {activation.deviceInfo.osName || '-'} {activation.deviceInfo.osVersion || ''}</Text>
                    <Text>- Type: {activation.deviceInfo.deviceType || '-'}</Text>
                    <Text>- Memory: {activation.deviceInfo.totalMemory || '-'}</Text>
                  </View>
                )}
                <Text>Notes: {license.notes || '-'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => Clipboard.setString(license.key)}
                  >
                    <Text>📋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={async () => {
                      // Hapus license di Firestore
                      await deleteDoc(doc(db, 'licenses', license.id));
                    }}
                  >
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  dashboard: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  dashboardItem: { alignItems: 'center', flex: 1 },
  dashboardNumber: { fontSize: 24, fontWeight: 'bold' },
  createButton: { backgroundColor: '#1abc9c', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  createButtonText: { color: '#fff', fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  actionButton: { backgroundColor: '#e6e6e6', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center', marginHorizontal: 4 },
  licenseList: { flex: 1 },
  licenseCard: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 10, elevation: 2 },
  licenseId: { fontWeight: 'bold', fontSize: 16 },
  status: { backgroundColor: '#27ae60', color: '#fff', paddingHorizontal: 8, borderRadius: 6 },
  copyButton: { marginLeft: 12 },
  deleteButton: { marginLeft: 12 },
});
