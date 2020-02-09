import React from 'react';
import {Dimensions, Image, Picker, ScrollView, StyleSheet, TouchableHighlight, View} from 'react-native';
import {
    Button,
    Caption,
    Card,
    Dialog, IconButton,
    List,
    Modal,
    Paragraph,
    Provider,
    Subheading,
    TextInput
} from "react-native-paper";
import MapView, {Marker, ProviderPropType} from "react-native-maps";
import {RemoteMongoClient, Stitch} from 'mongodb-stitch-react-native-sdk';

import fakeMarker from '../assets/fakeMarker.jpg'

const height = Dimensions.get('window').height;
const width = Dimensions.get('window').width;



export default class HazardScreen extends React.Component{

    constructor(props) {
        super(props);
        this.state = {
            markers: undefined,
            name: '',
            description: '',
            type: '',
            markerId: undefined,
            location: {
                latitude: 0,
                longitude: 0,
                latitudeDelta: 0.0101,
                longitudeDelta: 0.0101,
            },
            addedLatitude: null,
            addedLongitude: null,
            modalVisible: false,
            markersListVisible: false,
            markerImage: null,
            markerImageBlob: null,
        }
    }

    componentDidMount(){

        this.loadMarkers()

        navigator.geolocation.getCurrentPosition(position => {
            this.setState({location: {latitude: position.coords.latitude, longitude: position.coords.longitude,
                    latitudeDelta: 0.0101, longitudeDelta: 0.0101}});
        },
            (error) => alert(JSON.string(error)),
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000});
    }

    // parseBlob = (blob) =>{
    //     return URL.createObjectURL(blob);
    // }

    renderMarkers = () =>{
        if(this.state.markers !== undefined){
            return this.state.markers.map((markerInfo) =>{
                return(
                    <Marker key={markerInfo._id} onPress={e => e.showCallout} title={markerInfo.name} description={markerInfo.description} pinColor={'#5658A9'} coordinate={markerInfo.coordinates}>
                        <MapView.Callout tooltip>
                            <TouchableHighlight onPress={() => this.console(markerInfo._id + ' pressed')}>
                                    <Card style={{width: width/2}}>
                                        <Card.Title title={markerInfo.name} titleStyle={{fontSize: 10}}/>
                                        <Card.Content>
                                            <Card.Cover source={{uri: "https://picsum.photos/200/100"}} style={{height: 100}}/>
                                            <Caption style={{fontSize: 8}}>Type: {markerInfo.type}</Caption>
                                            <Paragraph style={{fontSize: 10}}>{markerInfo.description}</Paragraph>
                                        </Card.Content>
                                    </Card>
                            </TouchableHighlight>

                        </MapView.Callout>
                    </Marker>
                )
            })
        }
    };

    goBack = () =>{
        this.props.navigation.goBack();
    };

    showModal = () => {
        this.setState({modalVisible: true})
    }

    hideModal = () => {
        this.setState({modalVisible: false})
    }

    getRegionCenter = region =>{
        this.setState({
            addedLatitude: region.latitude,
            addedLongitude: region.longitude,
            location:{ latitude: region.latitude, longitude: region.longitude,
                latitudeDelta: region.latitudeDelta, longitudeDelta: region.longitudeDelta},
        });
    };

    createMarker= () =>{
        let marker = {
            coordinates:{
                latitude: this.state.addedLatitude,
                longitude: this.state.addedLongitude,
            },
            name: this.state.name,
            description: this.state.description,
            type: this.state.type,

        }

        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,'plow-me'
        );

        const db = mongoClient.db('plowme');
        const markers = db.collection('markers');
        console.log('inserting a marker')
        markers.insertOne({
            userId: stitchAppClient.auth.user.id,
            name: marker.name,
            description: marker.description,
            type: marker.type,
            image: marker.image,
            coordinates:{
                latitude: marker.coordinates.latitude,
                longitude: marker.coordinates.longitude,
            },
            date: new Date(),
            recent: true,
        }).then(()=>{

            this.setState({name: ''});
            this.setState({description: ''});
            this.setState({type: ''});
            this.setState({image: null});
            this.setState({addedLatitude: null});
            this.setState({addedLongitude: null});

            console.log('inserted marker')
            this.loadMarkers();
        })
            .catch(err => {
                console.warn(err)
            });
    };


    loadMarkers(){
        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );

        const db = mongoClient.db('plowme');
        const markers = db.collection('markers');
        markers.find({recent: true}, {sort: {date: -1}})
            .asArray()
            .then(docs =>{
                this.setState({markers: docs});
            })
            .catch(err =>{
                console.warn(err)
            })
    }


    render(){
        let {markerImage} = this.state
        return(
        <Provider>
            <View style={styles.container}>
                <MapView
                provider={this.props.provider}
                region={
                    {
                        latitude: this.state.location.latitude,
                        longitude: this.state.location.longitude,
                        latitudeDelta: this.state.location.latitudeDelta,
                        longitudeDelta: this.state.location.longitudeDelta,
                    }
                }
                onRegionChangeComplete={this.getRegionCenter}
                style={styles.map}
                showsUserLocation={true}
                followsUserLocation={true}
                showsMyLocationButton={true}
                showsCompass={true}
                showsBuildings={true}
                moveOnMarkerPress={false}>
                    {this.renderMarkers()}
                </MapView>

                <View style={styles.interactionLayer}>
                    <IconButton icon={'plus'} color={'#CA3541'} size={30} style={styles.addButton} onPress={this.showModal}/>
                </View>
                <View style={styles.fixedMarker}>
                    <Image style={styles.marker} source={fakeMarker}/>
                </View>

                <Modal visible={this.state.modalVisible} onDismiss={this.hideModal}
                style={styles.addModal}>
                    <View style={{backgroundColor: 'white', height: height/1.5, width: width/1.3, left: '12%', borderRadius: 5, alignItems: 'center'}}>
                        <ScrollView>
                        <View style={{backgroundColor: 'lightgrey', marginTop: 10, width: width/1.4, paddingHorizontal: width/10, alignItems: 'center'}}>
                        <Subheading>What type of Hazard?</Subheading>
                        <Picker
                        selectedValue={this.state.type}
                        onValueChange={(itemValue, itemIndex) =>
                        this.setState({type: itemValue})}
                        style={{width: width/2}}
                        mode={'dropdown'}>
                            <Picker.Item label={'Construction'} value={'construction'}/>
                            <Picker.Item label={'Ice'} value={'ice'}/>
                            <Picker.Item label={'Slush'} value={'slush'}/>
                            <Picker.Item label={'Accident'} value={'car_accident'}/>
                            <Picker.Item label={'Other Hazard'} value={'other'}/>
                        </Picker>
                            </View>
                        <View style={{backgroundColor: 'lightgrey', marginTop: 10, paddingHorizontal: width/10, width: width/1.4, alignItems: 'center', paddingBottom: 10}}>
                            <Subheading>Provide a name</Subheading>
                            <TextInput label={'Hazard name'}
                            value={this.state.name}
                            onChangeText={name => this.setState({name: name})}
                            type={'outlined'}
                            selectTextOnFocus={true}
                            style={{width: width/1.5, fontColor: '#4D4CB3'}}
                            dense={true}/>
                        </View>
                        <View style={{backgroundColor: 'lightgrey', marginTop: 10, paddingHorizontal: width/10, width: width/1.4, alignItems: 'center', paddingBottom: 10}}>
                            <Subheading>Provide a description</Subheading>
                            <TextInput label={'Hazard description'}
                            value={this.state.description}
                            onChangeText={description => this.setState({description: description})}
                            type={'outlined'}
                            selectTextOnFocus={true}
                            style={{width: width/1.5, fontColor: '#4D4CB3'}}
                            dense={true}
                            multiline={true}
                            numberOfLines={5}/>
                        </View>
                            <View style={{backgroundColor: 'lightgrey', marginVertical: 10, paddingHorizontal: width/10, width: width/1.4, alignItems: 'center', paddingVertical: 20}}>
                                <IconButton color={'#CA3541'} icon={'plus'} size={35} style={{backgroundColor: 'white'}} onPress={() => {this.createMarker(); this.hideModal()}}>Submit Hazard</IconButton>
                            </View>
                            </ScrollView>
                    </View>

                </Modal>
            </View>
        </Provider>
        )
    }

}

HazardScreen.propTypes = {
  provider: ProviderPropType,
};

const styles = StyleSheet.create({
    container:{
        flex: 1,
        flexDirection: 'column',
      alignItems: 'center',
    },
    map:{
        ...StyleSheet.absoluteFillObject,
    },
    fixedMarker:{
        left: '50%',
        marginLeft: -28,
        marginTop: -48,
        position: 'absolute',
        top: '50%'
    },
    marker:{
        height: 70,
        width: 70,
    },
    interactionLayer:{
        alignItems: 'center',
        top: '7%',
        flexDirection: 'row',
        position: 'absolute',
    },
    addButton:{
        marginHorizontal: 10,
        backgroundColor: 'white'
    },
    addModal:{
        top: '10%',
        width: width/1.3,
        backgroundColor: 'whitesmoke',
    }


})