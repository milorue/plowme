import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppNav from './navigation/AppNav';

export default class App extends React.Component{
  render(){
    return (
    <View style={styles.container}>
      {console.log('Hit App.js')}
      <AppNav/>
    </View>
  );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
