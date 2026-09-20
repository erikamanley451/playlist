import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

const Downloads = () => {

  return (
    <SafeAreaView style={styles.container}>
      {/* Header + Divider */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
        <Image
          source={require("@/assets/images/myicon.png")}
          style={styles.icon}
        />
          <Text style={styles.headerText}>Downloads</Text>
        </View>
        <View style={styles.divider} />
      </View>

      {/* User Profile Card */}
      <View></View>

    </SafeAreaView>
  );
};

export default Downloads;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerContainer: {
    width: '90%',
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  icon: {
    marginRight: 10,
    width:50,
    height: 50

  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#000',
    width: '100%',
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#E0E8FF',
    borderWidth: 2,
    borderColor: '#00C853',
    borderRadius: 12,
    padding: 20,
    alignSelf: 'center',
    width: '90%',
    height: 160,
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 20,
    backgroundColor: '#ccc',
  },
  profileDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontWeight: '600',
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
    width: '90%',
    marginTop: 10,
  },
  button: {
    backgroundColor:  '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    flex: 0.45,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
