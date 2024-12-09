import { View, Text } from 'react-native'
import React from 'react'
import LottieView from "lottie-react-native";

const Loading = () => {
  return (
    <View  style={{alignItems:"center",justifyContent:"center" ,flex:1, }} > 
      

      <LottieView
        source={require("../../assets/icons/r3.json")} // Lottie animasyon dosyası
        autoPlay
        loop
        speed={5}
        style={{height:300,width:300}}
      />
    </View>
  )
}

export default Loading