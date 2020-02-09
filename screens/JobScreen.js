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

export default class JobScreen extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            startAddress: '',
            startCity: '',
            startState: 'NY',
            startZip: '',

            endAddress: '',
            endCity: '',
            endState: 'NY',
            endZip: '',

            start: {
                lat: 0,
                lng: 0,
            },
            end: {
                lat: 0,
                lng: 0,
            },

            confirmJobVisible: false,
        }
    }

        componentDidMount(){
        }

        pickerItems = () =>{
            const states = [ 'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT',
                'DE', 'DC', 'FM', 'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN',
                'IA', 'KS', 'KY', 'LA', 'ME', 'MH', 'MD', 'MA', 'MI', 'MN',
                'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC',
                'ND', 'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 'PR', 'RI', 'SC',
                'SD', 'TN', 'TX', 'UT', 'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY' ];
            return states.map((state) =>{
                return(
                    <Picker.Item key={state} label={state} value={state}/>
                )
            })

        };

    geoCodeAddresses(){
              Geocoder.init(googleKey);

        if(this.state.startAddress !== '' && this.state.startCity !== '' && this.state.startState !== '' && this.state.startZip !== ''){
            Geocoder.from(this.state.startAddress + ', ' + this.state.startCity + ' ' + this.state.startState
        + ', ' + this.state.startZip)
                .then(json =>{
                    const startLocation = json.results[0].geometry.location;
                    console.log(startLocation)
                    this.setState({start: {
                        lat: startLocation.lat,
                            lng: startLocation.lng,
                        }})
                    console.log(this.state.start)

                })
        }

        if(this.state.endAddress !== '' && this.state.endCity !== '' && this.state.endState !== '' && this.state.endZip !== ''){
            Geocoder.from(this.state.endAddress + ', ' + this.state.endCity + ' ' + this.state.endState
            + ', ' + this.state.endZip)
                .then(json =>{
                    const endLocation = json.results[0].geometry.location;
                    console.log(endLocation)
                    this.setState({end:{
                        lat: endLocation.lat,
                            lng: endLocation.lng,
                        }})
                    console.log(this.state.end)
                })
        }
    }

    createJob = () =>{

        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );

        const db = mongoClient.db('plowme');
        const jobs = db.collection('assigned_jobs');
        console.log('Instantiated MongoDB Client')
        if(this.state.endAddress !== '' && this.state.startAddress !== '' && this.state.start.lat !== 0 && this.state.end.lat !== 0){ //garbage if statement but I'm tired
            jobs.insertOne({
                userId: stitchAppClient.auth.user.id,
                title: this.state.startAddress + ' to ' + this.state.endAddress,
                assigned: true,
                active: false,
                completed: false,
                clearRating: 0,
                start: this.state.start,
                end: this.state.end,
                startMetaData:{
                    address: this.state.startAddress,
                    city: this.state.startCity,
                    state: this.state.startState,
                    zipcode: this.state.startZip,
                },
                endMetaData:{
                    address: this.state.endAddress,
                    city: this.state.endCity,
                    state: this.state.endState,
                    zipcode: this.state.endZip,
                },
                date: new Date(),

            })
                .then(() =>{
                    console.log('Job Insertion Success Callback')
                    this.props.navigation.goBack()
                })
                .catch(err => {
                    console.log('Insertion Failure Callback')
                    console.warn(err)
                })
        }



    }


    geoCoder = () =>{
        Geocoder.init(googleKey)

        Geocoder.from("1033 Danby Rd, Ithaca NY, 14850")
            .then(json => {
                let location = json.results[0].geometry.location;
                console.log(location)
            })
    };

    showConfirm(){
        this.setState({confirmJobVisible: true})
    }

    hideConfirm(){
        this.setState({confirmJobVisible: false});
        this.createJob();
    }

    cancelConfirm(){
        this.setState({confirmJobVisible: false})
    }

    render(){
        return(
            <Provider>
            <View style={styles.container}>
                <Appbar.Header style={{marginBottom: 10, flexDirection: 'row', alignContent: 'center', backgroundColor: 'white'}}>
                    <Appbar.Action icon={'menu'} onPress={() => console.log('Settings Press')}/>
                    <Appbar.Action icon={'truck'} onPress={() => console.log('Account Press')} color={'black'}/>
                    <Appbar.Content title={'Truck'} subtitle={'ID: AD4R2T78S'}/>
                </Appbar.Header>

                <Portal>
                    <Dialog visible={this.state.confirmJobVisible} onDismiss={() => {this.cancelConfirm()}}>
                        <Dialog.Title>Confirm Add Job</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>Assign Job?</Paragraph>
                            <Dialog.Actions>
                                <Button onPress={()=>{this.cancelConfirm()}}>Cancel</Button>
                                <Button onPress={()=>{this.hideConfirm()}}>Confirm</Button>
                            </Dialog.Actions>
                        </Dialog.Content>
                    </Dialog>
                </Portal>

                <View>
                    <Caption>Enter Start Address: </Caption>
                    <TextInput label={'Enter street address'}
                    value={this.state.startAddress}
                    onChangeText={startAddress => this.setState({startAddress: startAddress})}
                    type={'outlined'}
                    mode={'outlined'}
                    selectTextOnFocus={true} selectionColor={'lightgrey'} dense={true}/>

                    <View style={{flexDirection: 'row'}}>
                        <View style={{flex: .8}}>
                            <Caption>Enter Start City:</Caption>
                        <TextInput label={'Enter a city'}
                        value={this.state.startCity}
                        onChangeText={startCity => this.setState({startCity: startCity})}
                        type={'outlined'}
                        mode={'outlined'}
                        selectTextOnFocus={true} selectionColor={'lightgrey'} dense={true}/>
                        </View>
                        <View style={{flex:.8}}>
                            <View>
                                <Caption style={{marginLeft: 30}}>Enter start State:</Caption>
                                <View style={{borderColor: 'grey', borderWidth: 1, borderRadius: 3, marginTop: 8, marginHorizontal: 10}}>
                                <Picker selectedValue={this.state.startState}
                            onValueChange={(itemValue, itemIndex) =>
                            this.setState({startState: itemValue})}
                            style={{marginLeft: 30,}}
                                mode={'dropdown'}>
                                    {this.pickerItems()}


                            </Picker>
                                    </View>

                            </View>
                        </View>

                    </View>

                                <View>
                                    <Caption>Enter start ZipCode</Caption>
                                    <TextInput label={'Enter a zipcode'}
                                    value={this.state.startZip}
                        onChangeText={startZip => this.setState({startZip: startZip})}
                        type={'outlined'}
                        mode={'outlined'}
                        selectTextOnFocus={true} selectionColor={'lightgrey'} dense={true}/>
                                </View>


                    {/*End Address starts*/}

                    <View style={{height: height/20, justifyContent: 'center'}}>
                        <Divider style={{height: 2}}/>
                    </View>

                    <View>
                    <Caption>Enter End Address: </Caption>
                    <TextInput label={'Enter street address'}
                    value={this.state.endAddress}
                    onChangeText={endAddress => this.setState({endAddress: endAddress})}
                    type={'outlined'}
                    mode={'outlined'}
                    selectTextOnFocus={true} selectionColor={'lightgrey'} dense={true}/>

                    <View style={{flexDirection: 'row'}}>
                        <View style={{flex: 1}}>
                            <Caption>Enter End City:</Caption>
                        <TextInput label={'Enter a city'}
                        value={this.state.endCity}
                        onChangeText={endCity => this.setState({endCity: endCity})}
                        type={'outlined'}
                        mode={'outlined'}
                        selectTextOnFocus={true} selectionColor={'lightgrey'} dense={true}/>
                        </View>
                        <View style={{flex:1}}>
                            <View>
                                <Caption style={{marginLeft: 30}}>Enter end State:</Caption>
                                <View style={{borderColor: 'grey', borderWidth: 1, borderRadius: 3, marginTop: 8, marginHorizontal: 10}}>
                                <Picker selectedValue={this.state.endState}
                            onValueChange={(itemValue, itemIndex) =>
                            this.setState({endState: itemValue})}
                            style={{width: width/2.5, marginLeft: 30,}}
                                mode={'dropdown'}>
                                    {this.pickerItems()}


                            </Picker>
                                    </View>
                            </View>
                        </View>

                    </View>

                        <View>
                                    <Caption>Enter end ZipCode</Caption>
                                    <TextInput label={'Enter a zipcode'}
                                    value={this.state.endZip}
                        onChangeText={endZip => this.setState({endZip: endZip})}
                        type={'outlined'}
                        mode={'outlined'}
                        selectTextOnFocus={true} selectionColor={'lightgrey'} dense={true}/>
                                </View>

                    </View>

                    <Divider style={{height: 2, marginVertical: 20}}/>

                    <Button icon={'plus'} mode={'contained'} onPress={()=>{this.geoCodeAddresses(); this.showConfirm()}}
                    style={{marginHorizontal: width/4, marginVertical: height/27}} color={'#000556'}>Add Job</Button>
                </View>

            </View>
                </Provider>
        )
    }
}

const styles = StyleSheet.create({
    container:{
        flexDirection: 'column',
        backgroundColor: 'white'
    }
})