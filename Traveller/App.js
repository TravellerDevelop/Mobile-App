import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import BottomBar from './components/bottombar';
import Home from './screens/home';
import Font from './components/font';

export default function App() {
  let fontLoaded = Font();

  if (!fontLoaded) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    )
  }
  else{
    return (
      <View style={styles.container}>
        <Home />
        <BottomBar />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4960FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
