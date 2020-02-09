import React from 'react';
import {createStackNavigator} from 'react-navigation-stack';
import {createMaterialBottomTabNavigator} from "react-navigation-material-bottom-tabs";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";

import {IconButton} from "react-native-paper";
import JobScreen from "../screens/JobScreen";

const LoginStack = createStackNavigator({
    Login: {
        screen: LoginScreen,
        navigationOptions: {
            headerShown: false,
        }

    }
});

const HomeStack = createStackNavigator({
    Home: {
        screen: HomeScreen,
        navigationOptions:{
            headerShown: false,
        }
    },
    Job: {
        screen: JobScreen,
        navigationOptions:{
            headerShown: false,
        }
    }
});

const MapStack = createStackNavigator({
    Map: {
        screen: MapScreen,
        navigationOptions:{
            headerShown: false,
        }
    }
})

const TabNavigator = createMaterialBottomTabNavigator({
    Home:{
        screen: HomeStack,
        navigationOptions:{
            tabBarColor: 'white',
            tabBarIcon: <IconButton
            icon={'home'}
            color={'white'}
            size={30}
            style={{paddingBottom: 25}}/>
        }
    },
    Map:{
        screen: MapStack,
        navigationOptions:{
            tabBarColor: 'white',
            tabBarIcon: <IconButton
            icon={'map-marker'}
            color={'white'}
            size={30}
            style={{paddingBottom: 25}}/>
        }
    }
},
    {
        barStyle: {backgroundColor: '#000556'}
    });

export default createStackNavigator({
    Login:{
        screen: LoginStack,
        navigationOptions:{
            headerShown: false,
        }
    },
    Tabs:{
        screen: TabNavigator,
        navigationOptions:{
            headerShown: false,
        }
    }
})