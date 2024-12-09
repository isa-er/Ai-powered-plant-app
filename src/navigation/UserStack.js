import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/user/Home';
import Photo from '../screens/user/Photo';
import Profile from '../screens/user/Profile';

import  Icon  from 'react-native-vector-icons/FontAwesome';
import Loading from '../components/Loading';

const Tab = createBottomTabNavigator();

const UserStack = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={Home} options={{tabBarLabel: "Ana Sayfa", tabBarIcon:({color,size})=>(
                <Icon name='home' color={"black"} size={30} />
              )}} />
      <Tab.Screen name="Photo" component={Photo} />
      <Tab.Screen name="Profile" component={Profile} />
      <Tab.Screen name="Loading" component={Loading} />
    </Tab.Navigator>
  );
};

export default UserStack;


