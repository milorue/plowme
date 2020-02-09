import React from 'react';
import {createAppContainer, createSwitchNavigator} from "react-navigation";
import MainStackNav from "./MainStackNav";

export default createAppContainer(
    createSwitchNavigator({
        Main: MainStackNav,
    })
)