import React from 'react';
import {View, Text, StyleSheet, Dimensions, RefreshControl, ScrollView, TouchableHighlight, Picker, TouchableOpacity} from 'react-native';
import {Button, IconButton, Appbar, Modal, Searchbar, Avatar, Menu, Provider, Card, Paragraph, Dialog, Caption, Divider, List
, Drawer} from "react-native-paper";

import MapView, {Callout, Polyline, ProviderPropType, Marker} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {Stitch, RemoteMongoClient} from 'mongodb-stitch-react-native-sdk';
import googleKey from "../assets/apiCredentials";

const height = Dimensions.get('window').height;
const width = Dimensions.get('window').width;

const apiKey = googleKey

export default class MapScreen extends React.Component{

    constructor(props) {
        super(props);
        this.state = {
            location:{
                coords:{
                    latitude: 0,
                    longitude: 0,
                },
            },
            activeJobs: null,
            completedJobs: null,
            jobsLoaded: false,

            }
    }

    componentDidMount(){

        this.getActiveJobs();
        this.loadCompletedJobs();

        navigator.geolocation.getCurrentPosition(position => {
            this.setState({location: position})
        },
            (error) => alert(JSON.stringify(error)),
                {enabledHighAccuracy: true, timeout: 20000, maximumAge: 1000});
    };

    getActiveJobs(){
        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );

        const db = mongoClient.db('plowme');
        const act_jobs = db.collection('active_jobs');
        act_jobs.find({active: true})
            .asArray()
            .then(docs =>{
                this.setState({activeJobs: docs})
                this.setState({jobsLoaded: true})
            })
            .catch(err =>{
                console.warn(err)
            })
    }

    loadCompletedJobs(){
        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );

        const db = mongoClient.db('plowme');
        const complete_jobs = db.collection('completed_jobs');
        complete_jobs.find({completed: true}, {sort: {date: -1}})
            .asArray()
            .then(docs =>{
                this.setState({completedJobs: docs})
            })
            .catch(err=>{
                console.warn(err)
            })
    }

    renderStartMarker = () =>{
        if(this.state.activeJobs !== null){
                return this.state.activeJobs.map((jobInfo) =>{
                    const latlng = {latitude: jobInfo.start.lat, longitude: jobInfo.start.lng}
                    return(
                        <Marker key={jobInfo._id + jobInfo.userId} coordinate={latlng} pinColor={this.determineRatingColor(jobInfo.clearRating)}/>
                        )

                })

        }
    };

    renderEndMarker = () =>{
        if(this.state.activeJobs !== null){
                return this.state.activeJobs.map((jobInfo) =>{
                    return(
                        <Marker key={jobInfo._id} coordinate={{latitude: jobInfo.end.lat, longitude: jobInfo.end.lng}} pinColor={this.determineRatingColor(jobInfo.clearRating)}/>
                        )

                })

        }
    };

    renderCompleteRoutes = () =>{
        if(this.state.completedJobs !== null){
            return this.state.completedJobs.map((jobInfo) =>{
                return(
                    <MapViewDirections key={jobInfo._id} apikey={ apiKey}
                        origin={{latitude: jobInfo.start.lat, longitude: jobInfo.start.lng}}
                        destination={{latitude: jobInfo.end.lat, longitude: jobInfo.end.lng}}
                    strokeWidth={1}
                    strokeColor={this.determineRatingColor(jobInfo.clearRating)}/>
                )
            })
        }
    }

    determineRatingColor = (num) =>{
        if(num === 0){
            return '#CA3541'
        }
        if(num === 1){
            return '#C1D728'
        }
        if(num === 2){
            return '#5658A9'
        }
        if(num === 3){
            return '#3FC06C'
        }
    };

    renderPaths = () =>{
        if(this.state.activeJobs !== null){
            return this.state.activeJobs.map((jobInfo) =>{
                return(
                    <MapViewDirections key={jobInfo._id} apikey={ apiKey}
                        origin={{latitude: jobInfo.start.lat, longitude: jobInfo.start.lng}}
                        destination={{latitude: jobInfo.end.lat, longitude: jobInfo.end.lng}}
                    strokeWidth={10}
                    strokeColor={this.determineRatingColor(jobInfo.clearRating)}/>
                )
            })
        }
    }



    render(){
        return(
            <Provider>

                <View style={styles.container}>

                    <MapView
                provider={this.props.provider}
                showsUserLocation={true}
                followsUserLocation={true}
                    style={styles.map}
                    region={{
                        latitude: this.state.location.coords.latitude,
                        longitude: this.state.location.coords.longitude,
                        latitudeDelta: 4.5001,
                        longitudeDelta: 4.5101
                    }}>
                        {this.renderStartMarker()}
                        {this.renderEndMarker()}
                        {this.renderPaths()}
                        {this.renderCompleteRoutes()}


                    </MapView>

                    <View style={styles.interactionLayer}>
                        <IconButton
                        icon={'reload'}
                        color={'#75888A'}
                        size={30}
                        style={{backgroundColor: 'white', marginTop: 40}}
                        onPress={() => {this.getActiveJobs(); this.loadCompletedJobs()}}/>
                        <IconButton
                        icon={'plus'}
                        color={'#CA3541'}
                        size={30}
                        style={{backgroundColor: 'white', marginTop: 40}}
                        onPress={() => {this.props.navigation.navigate('Job')}}/>
                    </View>
                </View>
            </Provider>
        )
    }
}

MapScreen.propTypes = {
  provider: ProviderPropType,
};

const styles = StyleSheet.create({
    container:{
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'column',
      alignItems: 'center',
    },
    map: {
      ...StyleSheet.absoluteFillObject,
  },
    interactionLayer:{
      flexDirection: 'row',
        backgroundColor: 'transparent',
        justifyContent: 'flex-end'
    },
});