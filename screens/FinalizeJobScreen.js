import React from 'react';
import {View, Text, StyleSheet, Dimensions, RefreshControl, ScrollView, TouchableHighlight, Picker, TouchableOpacity} from 'react-native';
import {Button, IconButton, Appbar, Portal, TextInput, Modal, Searchbar, Avatar, Menu, Provider, Card, Paragraph, Dialog, Caption, Divider, List
, Drawer} from "react-native-paper";

import MapView, {Callout, Polyline, ProviderPropType, Marker} from "react-native-maps";
import {Stitch, RemoteMongoClient} from 'mongodb-stitch-react-native-sdk';
import Geocoder from 'react-native-geocoding';
import googleKey from "../assets/apiCredentials";

const height = Dimensions.get('window').height;
const width = Dimensions.get('window').width;

export default class FinalizeJobScreen extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            clearRating: undefined
        }
    }
}