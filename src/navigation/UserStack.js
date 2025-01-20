import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/user/Home';
import Photo from '../screens/user/Photo';
import Tahmin from '../screens/user/Tahmin';
import Secim from '../screens/user/Secim';
import Tedavi from '../screens/user/Tedavi';
import Profile from '../screens/user/Profile';
import LoginScreen from "../screens/auth/LoginScreen"
import Acilis from '../components/Acilis';

import  Icon  from 'react-native-vector-icons/FontAwesome';
import Loading from '../components/Loading';
import TahminEdiliyor from '../components/TahminEdiliyor';
import { createNativeStackNavigator } from '@react-navigation/native-stack';




const Tab = createBottomTabNavigator();
const Stack= createNativeStackNavigator();

const UserTabs = () => {
  return (
    <Tab.Navigator screenOptions={{ 
      headerShown: false,
      tabBarStyle:{
        height:80 ,
        backgroundColor:"#118B50",
        borderTopLeftRadius:20,
        borderTopRightRadius:20},
      tabBarActiveTintColor: "#FFE893",
      tabBarInactiveTintColor: "#D9EAFD" , 
      tabBarIconStyle:{
        marginTop:10}} } >
      <Tab.Screen name="Home" component={Home} options={{
        tabBarLabel: "Ana Sayfa", 
        tabBarLabelStyle:{
          fontSize:13,fontWeight:"bold"} , tabBarIcon:({color,size})=>(
                <Icon name='home' color={"#FBF6E9"} size={30} />
              )}} />

      <Tab.Screen name="Photo" component={Photo}  options={{
        tabBarLabel: "Fotoğraf",tabBarLabelStyle:{
          fontSize:13,fontWeight:"bold"} , tabBarIcon:({color,size})=>(
                <Icon name='camera' color={"#FBF6E9"} size={30} />
              )}}  />
              
      <Tab.Screen name="Tahmin" component={Tahmin} options={{
        tabBarLabel: "Tahmin", tabBarLabelStyle:{
          fontSize:13,fontWeight:"bold"} ,tabBarIcon:({color,size})=>(
                <Icon name='question' color={"#FBF6E9"} size={30} />
              )}} />

      <Tab.Screen name="Tedavi" component={Tedavi} options={{
              tabBarLabel: "Tedavi", tabBarLabelStyle:{
                fontSize:13,fontWeight:"bold"} ,tabBarIcon:({color,size})=>(
                      <Icon name='heart' color={"#FBF6E9"} size={30} />
                    )}} />


      
    </Tab.Navigator>
  );
};

const UserStack=()=>{
    return(
      <Stack.Navigator screenOptions={{ headerShown: false, animation:"slide_from_right"}}>
        <Stack.Screen name='UserTabs' component={UserTabs} />
        <Stack.Screen  name="Secim" component={Secim} />
        <Stack.Screen  name="Tedavi" component={Tedavi} />
        <Stack.Screen  name="Profile" component={Profile} />
        
      
        
        
      </Stack.Navigator>
    )
}

export default UserStack;