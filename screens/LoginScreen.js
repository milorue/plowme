import React from 'react';
import {View, Text, StyleSheet, Image, Dimensions} from 'react-native'
import {TextInput, Caption, Button,Title} from "react-native-paper";
import {AnonymousCredential, Stitch, UserPasswordCredential} from "mongodb-stitch-react-native-sdk"
import appLogo from '../assets/appLogo.png'

const height = Dimensions.get('window').height;
const width = Dimensions.get('window').width;

export default class LoginScreen extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            email: '',
            password: '',
            truckId: '',
            client: undefined,
            isLoadingComplete: false,
        }
    }

    componentDidMount(){
        if(this.client === undefined){
            this.loadClient();
        }
    }

    loadClient(){
        Stitch.initializeDefaultAppClient('plowme-exllh').then(
            client =>{
                this.setState({client: client});
                console.log('Successfully Initialized Stitch Client');
            }
        ).catch(
            err =>{
                console.log('Error Initializing Stitch Client');
                console.warn(err)
            }
        )
    }

    signIn = () =>{
        this.state.client.auth
            .loginWithCredential(new AnonymousCredential())
            .then(user => {
                console.log('Login Success Callback for: ' + user.id)
                this.props.navigation.navigate('Home')
                //pass parameters if necessary
            })
            .catch(err => {
                console.log('Login Fail Callback with error: ' + err);
                //render a login error
            })
    }

    render(){
        return(
            <View style={styles.container}>
                <Title>PlowIt</Title>

                    <Image source={appLogo} style={{width: 150, height: 150}}/>

                <Button icon={'login'} mode={'contained'}
                onPress={() => this.signIn()} color={'lightgrey'}>Sign In</Button>
            </View>
        )
    }


}

const styles = StyleSheet.create({
    container:{
        height: height,
        width: width,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white'

    },

    input:{
        marginHorizontal: 20,
    }

})