import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import LottieView from "lottie-react-native";

const TahminEdiliyor = () => {
  return (
    <View  style={{alignItems:"center",justifyContent:"center" ,flex:1, }} > 
      
        <Text style={{fontWeight:"bold", fontSize:24, color:"blue"}} >TAHMİN EDİLİYOR...</Text>
      <LottieView
        source={require("../../assets/icons/r5.json")} // Lottie animasyon dosyası
        autoPlay
        loop
        speed={2}
        style={{height:300,width:300}}
      />
    </View>
  )
}

export default TahminEdiliyor

const styles = StyleSheet.create({})