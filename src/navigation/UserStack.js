import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/user/Home';
import Photo from '../screens/user/Photo';
import Profile from '../screens/user/Profile';

import  Icon  from 'react-native-vector-icons/FontAwesome';
import Loading from '../components/Loading';
import TahminEdiliyor from '../components/TahminEdiliyor';

const Tab = createBottomTabNavigator();

const UserStack = () => {
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
              
      <Tab.Screen name="Profile" component={Profile} options={{
        tabBarLabel: "Profil", tabBarLabelStyle:{
          fontSize:13,fontWeight:"bold"} ,tabBarIcon:({color,size})=>(
                <Icon name='user' color={"#FBF6E9"} size={30} />
              )}} />
      
    </Tab.Navigator>
  );
};

export default UserStack;


