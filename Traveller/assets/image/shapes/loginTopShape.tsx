import * as React from "react";
import { View, Dimensions, Image, StyleSheet } from "react-native";

interface LoginTopShapeProps {
  mode: 'top' | 'bottom'
}

export default function LoginTopShape({ mode }: LoginTopShapeProps) {
  return (
    <Image style={styles.image} source={mode === 'top' ? require('./topLogin.png') : require('./bottomLogin.png')} />
  )
}

const styles = StyleSheet.create({
  image:{
    width:Dimensions.get('window').width,
    height:Dimensions.get('window').width/4.5
  }
})