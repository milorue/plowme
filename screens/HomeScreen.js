import React from 'react';
import {View, Text, StyleSheet, RefreshControl, Image, Dimensions, ScrollView} from 'react-native'
import {
    TextInput,
    Caption,
    Button,
    Appbar,
    Provider,
    Title,
    List,
    Portal,
    Modal,
    Dialog,
    Paragraph, IconButton
} from "react-native-paper";
import {AnonymousCredential, Stitch, UserPasswordCredential, RemoteMongoClient} from "mongodb-stitch-react-native-sdk"
import {ProviderPropType} from "react-native-maps";
import {SwipeListView} from "react-native-swipe-list-view";

const height = Dimensions.get('window').height;
const width = Dimensions.get('window').width;

export default class HomeScreen extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            currUser: undefined,
            assignJobColor: 'white',
            assignedVisible: true,
            activeVisible: false,
            completedVisible: false,
            mongoClient: undefined,

            assignedJobs: undefined,
            activeJobs: undefined,
            completedJobs: undefined,

            addActiveModal: false,
            selectedJob: undefined,
            selectedJobObj: undefined,
            jobRefresh: false,

            deleteDialog: false,
            deletedId: undefined,

            finalizeDialog: false,
            finalizedJob: undefined,
            clearRating: undefined,
            finalizedId: undefined,
        }
    }

    componentDidMount(){
        this.loadMongoClient();
        this.loadAssignedJobs();
        this.loadCompletedJobs();

    }

    setClearRating(rating){
        this.setState({clearRating: rating})
    }

    openFinalizeDialog = (id) =>{
        this.setState({finalizeDialog: true})
        this.setState({finalizedId: id})
        this.getFinalizedJob(id)
    }

    closeFinalizeDialog = () =>{
        this.setState({finalizeDialog: false})
    }

    modifyFinalizedJob(){
        this.deleteAssignedJob(this.state.finalizedId);
        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );
        const db = mongoClient.db('plowme')
        const ass_job = db.collection('assigned_jobs')
        const mod_job = this.state.finalizedJob
        ass_job.insertOne({
            userId: mod_job.userId,
            title: mod_job.title,
            assigned: true,
            active: false,
            completed: false,
            clearRating: this.state.clearRating,
            start: mod_job.start,
            end: mod_job.end,
            startMetaData: mod_job.startMetaData,
            endMetaData: mod_job.endMetaData,
            date: mod_job.date,
        }).then(()=>{
            this.refreshJobs();
            this.closeFinalizeDialog();
        }

        ).catch(err =>{
            console.warn(err)
            console.log('Error modifying Job')
        })

    }

    determineFill = (rating) =>{
        if(rating === this.state.clearRating){
            return 'checkbox-blank-circle'
        }
        else{
            return 'checkbox-blank-circle-outline'
        }
    }

    renderFinalizeDialog = () =>{
        return(
            <Portal>
                <Dialog visible={this.state.finalizeDialog} onDismiss={this.closeFinalizeDialog}>
                    <Dialog.Title>Finalize Job</Dialog.Title>
                    <Dialog.Content style={{alignItems: 'center'}}>
                        <Paragraph>How clear is the route now?</Paragraph>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Caption style={{marginHorizontal: width/20}}>0</Caption>
                            <Caption style={{marginHorizontal: width/20}}>1</Caption>
                            <Caption style={{marginHorizontal: width/20}}>2</Caption>
                            <Caption style={{marginHorizontal: width/20}}>3</Caption>
                        </View>
                        <View style={{flexDirection: 'row'}}>

                            <IconButton icon={this.determineFill(0)} color={'#CA3541'} style={{flex: 1}} onPress={()=>{this.setClearRating(0)}}/>

                            <IconButton icon={this.determineFill(1)} color={'#C1D728'} style={{flex: 1}} onPress={()=>{this.setClearRating(1)}}/>

                            <IconButton icon={this.determineFill(2)} color={'#5658A9'} style={{flex: 1}} onPress={()=>{this.setClearRating(2)}}/>

                            <IconButton icon={this.determineFill(3)} color={'#3FC06C'} style={{flex: 1}} onPress={()=>{this.setClearRating(3)}}/>

                        </View>
                        <Paragraph>0 is not clear, 1 is serviceable but unsafe, 2 is clear but use caution, 3 is all clear.</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={this.closeFinalizeDialog}>Cancel</Button>
                        <Button onPress={() =>{this.modifyFinalizedJob()}}>Re-Assign</Button>
                        <Button onPress={() =>{this.createCompleteJob(this.state.finalizedId); this.closeFinalizeDialog()}}>Finalize</Button>
                    </Dialog.Actions>

                </Dialog>
            </Portal>
        )
    };

    createCompleteJob(id){
        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );

        const db = mongoClient.db('plowme')
        const finalizedJob = this.state.finalizedJob
        const completeJob = db.collection('completed_jobs')
        completeJob.find({_id: id})
            .asArray()
            .then(docs =>{
                if(docs.length === 0) {
                    completeJob.insertOne({
                        userId: finalizedJob.userId,
                        title: finalizedJob.title,
                        assigned: false,
                        active: false,
                        completed: true,
                        clearRating: this.state.clearRating,
                        start: finalizedJob.start,
                        end: finalizedJob.end,
                        startMetaData: finalizedJob.startMetaData,
                        endMetaData: finalizedJob.endMetaData,
                        date: finalizedJob.date,
                    }).then(() => {
                        console.log('Completed Job');
                        this.refreshJobs()
                        this.deleteAssignedJob(id)
                    }).catch(err => {
                            console.warn(err)
                            console.log("Error completing a job")
                        }
                    )
                }
            }).catch(
                console.log('Already completed job')
        )
    }


    getFinalizedJob = (id) =>{
        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );

        const db = mongoClient.db('plowme')
        const jobs = db.collection('active_jobs')
        jobs.findOne({_id: id})
            .then(docs =>{
                this.setState({finalizedJob: docs, clearRating: docs.clearRating})
                console.log(this.state.finalizedJob)
                }
            ).then(() =>{
                console.log('grabbed finalized job')
        }).catch(err =>{
            console.warn(err)
        })
    }


    loadMongoClient(){
        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );

        this.setState({mongoClient: mongoClient})
    }

    loadAssignedJobs(){
        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );

        const db = mongoClient.db('plowme');
        const ass_jobs = db.collection('assigned_jobs');
        const act_jobs = db.collection('active_jobs');
        ass_jobs.find({assigned: true, active: false, completed: false})
            .asArray()
            .then(docs =>{
                this.setState({assignedJobs: docs})
                console.log('Assigned Jobs Loaded')
            })
            .catch(err =>{
                console.warn(err);
            })

        act_jobs.find({active: true})
            .asArray()
            .then(docs =>{
                this.setState({activeJobs: docs})
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

    renderAssignedJobs = () =>{
        if(this.state.assignedJobs !== undefined){
            return this.state.assignedJobs.map((jobInfo) =>{
                return(
                    <List.Item key={jobInfo._id}
                    title={'Job ID: ' + jobInfo._id}
                    description={jobInfo.title}
                    left={props => <List.Icon {...props} icon={'checkbox-blank-circle-outline'} color={this.determineRatingColor(jobInfo.clearRating)}/>}
                    right={props => <IconButton {...props} icon={'delete'} color={'#92262F'} onPress={() =>{this.openDeleteDialog(jobInfo._id)}}/>}
                    style={{backgroundColor: 'white', margin: 5, borderRadius: 5}}
                    titleStyle={{fontSize: 10}}
                    onPress={() =>{this.openActiveModal(jobInfo._id)}}/>
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
    }

    renderActiveJobs = () =>{
        if(this.state.activeJobs !== undefined){
            return this.state.activeJobs.map((jobInfo) =>{
                return(
                    <List.Item key={jobInfo._id}
                    title={'Job ID: ' + jobInfo._id}
                    description={jobInfo.title}
                    left={props => <List.Icon {...props} icon={'checkbox-blank-circle-outline'} color={this.determineRatingColor(jobInfo.clearRating)}/>}
                    right={ props => <IconButton {...props} icon={'delete'} color={'#92262F'} onPress={() => {this.deleteActiveJob(jobInfo._id)}}/>}
                    style={{backgroundColor: 'white', margin: 5, borderRadius: 5}}
                    titleStyle={{fontSize: 10}}
                    onPress={() => {this.openFinalizeDialog(jobInfo._id)}}/>
                )
            })
        }
    }

    showActive = () =>{
        if(!this.state.activeVisible){
            this.setState({completedVisible: false, assignedVisible: false, activeVisible: true})
        }
    };

    showAssigned = () =>{
        if(!this.state.assignedVisible){
            this.setState({completedVisible: false, assignedVisible: true, activeVisible: false})
        }
    };

    showCompleted = () =>{
        if(!this.state.completedVisible){
            this.setState({completedVisible: true, assignedVisible: false, activeVisible: false})
        }
    };

    renderActive = () =>{
        if(this.state.activeVisible){
            return(
                <View>
                <View style={styles.assignedTitle}>
                            <Title style={{fontSize: 15}}>Active Jobs</Title>
                        </View>
                        <ScrollView style={styles.activeContainer}
                        refreshControl={<RefreshControl refreshing={this.state.jobRefresh}
                        onRefresh={this.refreshJobs}/>}>
                            {this.renderActiveJobs()}
                        </ScrollView>
                </View>
            )
        }
    };

    renderCompletedJobs = () =>{
        if(this.state.completedJobs !== undefined){
            return this.state.completedJobs.map((jobInfo) =>{
                return(
                    <List.Item key={jobInfo._id}
                    title={'Job: ID: ' + jobInfo._id}
                    description={jobInfo.title}
                    left={props => <List.Icon {...props} icon={'check-circle'} color={this.determineRatingColor(jobInfo.clearRating)}/>}
                    style={{backgroundColor: 'white', margin: 5, borderRadius: 5}}
                    titleStyle={{fontSize: 10}}/>
                )
            })
        }
    }

    renderCompleted = () =>{
        if(this.state.completedVisible){
            return(
                <View>
                    <View style={styles.assignedTitle}>
                            <Title style={{fontSize: 15}}>Completed Jobs</Title>
                        </View>
                        <ScrollView style={styles.activeContainer}
                        refreshControl={<RefreshControl refreshing={this.state.jobRefresh}
                        onRefresh={this.refreshJobs}/>}>
                            {this.renderCompletedJobs()}
                        </ScrollView>
                </View>
            )
        }
    }

    renderAssigned = () =>{
        if(this.state.assignedVisible){
            return(
                    <View>
                        <View style={styles.assignedTitle}>
                                <Title style={{fontSize: 15}}>Assigned Jobs</Title>
                            </View>
                        <ScrollView style={styles.assignedContainer}
                        refreshControl={<RefreshControl refreshing={this.state.jobRefresh}
                        onRefresh={this.refreshJobs}/>}>
                            {this.renderAssignedJobs()}
                        </ScrollView>
                    </View>
                )
        }
    };

    assignNewJob = () =>{
        this.props.navigation.navigate('Job')
    };

    openActiveModal(id){
        this.setState({addActiveModal: true, selectedJob: id})
        this.getCurrentJob(id);

    };

    closeActiveModal = () =>{
        this.setState({addActiveModal: false})
    };

    openDeleteDialog = (id) =>{
        this.setState({deleteDialog: true, deletedId: id})
        this.renderDeleteDialog()
    }

    closeDeleteDialog(id){
        this.setState({deleteDialog: false})
        this.deleteAssignedJob(id)
    }

    cancelDeleteDialog = () => {
        this.setState({deleteDialog: false})
    }

    renderDeleteDialog = () =>{
            return(
                <Portal>
                    <Dialog visible={this.state.deleteDialog} onDismiss={this.cancelDeleteDialog}>
                        <Dialog.Title>Deleting Job</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>Are you sure you want to
                            delete this job it will be deleted from you assigned and active?</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={this.cancelDeleteDialog}>Cancel</Button>
                            <Button onPress={() =>{this.closeDeleteDialog(this.state.deletedId); this.cancelDeleteDialog()}}>Delete</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>

            )
    }

    getCurrentJob = (id) =>{
        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );

        const db = mongoClient.db('plowme')
        const jobs = db.collection('assigned_jobs')

        jobs.find({_id: id})
            .asArray()
            .then(docs =>{
                this.setState({selectedJobObj: docs})
                console.log('Hit Current Job')
            }).catch(err =>{
                console.warn(err)
        })
    }

    deleteActiveJob = (id) =>{
        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );
        const db = mongoClient.db('plowme')
        const act_job = db.collection('active_jobs')

        act_job.deleteOne({_id: id}).then(()=>{

        }).then(()=>{
            this.refreshJobs()
        }).catch(err =>{
            console.warn(err)
        })
    }

    deleteAssignedJob = (id) =>{
        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );
        const db = mongoClient.db('plowme')
        const ass_job = db.collection('assigned_jobs')
        const act_job = db.collection('active_jobs')
        ass_job.deleteOne({_id: id}).then(() =>{
            ass_job.find({assigned: true}, {sort: {date: -1}})
                .asArray().then(docs =>{
                    this.setState({assignedJobs: docs});
                    console.log(id + ' deleted')
            })
                .catch(err =>{
                    console.warn(err)
                })
        }).catch(err =>{
            console.warn(err)
        })

        act_job.deleteOne({_id: id}).then(()=>{

        }).then(()=>{
            this.refreshJobs()
        }).catch(err =>{
            console.warn(err)
        })

    };

    addActiveJob = (id) =>{
        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );

        const db = mongoClient.db('plowme')
        const jobs = db.collection('active_jobs')

        const job  = this.state.selectedJobObj[0];
        console.log(job)

        jobs.find({_id: id})
            .asArray()
            .then(docs =>{
                if (docs.length === 0){
                    jobs.insertOne({
            userId: job.userId,
            title: job.title,
            assigned: job.assigned,
            active: true,
            completed: false,
            clearRating: job.clearRating,
            start: job.start,
            end: job.end,
            startMetaData: job.startMetaData,
            endMetaData: job.endMetaData,
            date: job.date,
            _id: id}

        ).then(()=>{
            console.log('Updated Active Jobs');
            this.refreshJobs();
        }).catch(err =>{
            console.warn(err)
            console.log('Error updating Active Job')
        })
                }
            }).catch(
                console.log('Already active job!')
        )


    };


    renderActiveModal = () =>{
            return(
                <Portal>
                    <Dialog visible={this.state.addActiveModal} onDismiss={this.closeActiveModal}>
                        <Dialog.Title>Make Job Active</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>Assign Job to Active Status?</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={this.closeActiveModal}>Cancel</Button>
                            <Button onPress={() => {this.addActiveJob(this.state.selectedJob); this.closeActiveModal()}}>Activate Job</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            )
    };

    refreshJobs = () =>{
        this.setState({jobRefresh: true});
        const stitchAppClient = Stitch.defaultAppClient;
        const mongoClient = stitchAppClient.getServiceClient(
            RemoteMongoClient.factory,
            'plow-me'
        );

        const db = mongoClient.db('plowme')
        const ass_jobs = db.collection('assigned_jobs')
        const act_jobs = db.collection('active_jobs')
        console.log('Reloading Jobs')
        ass_jobs.find({assigned: true}, {sort: {date: -1}})
            .asArray()
            .then( docs => {
                this.setState({assignedJobs: docs})
            }).catch(
                err => {
                    console.warn(err)
                }
        )

        act_jobs.find({active: true}, {sort: {date: -1}})
            .asArray()
            .then( docs =>{
                this.setState({activeJobs: docs})
                this.loadCompletedJobs()
                this.setState({jobRefresh: false});
            }).catch(
                err => {
                    console.warn(err)
                })

    };

    // Screen Render
    render(){
        return(
            <Provider>
                <View style={styles.container}>
                    <Appbar.Header style={{ marginBottom: 10, flexDirection: 'row', alignContent: 'center', backgroundColor: 'white'}}>
                    <Appbar.Action icon={'menu'} onPress={() => console.log('Settings Press')} color={'black'}/>
                    <Appbar.Action icon={'truck'} onPress={() => console.log('Account Press')} color={'black'}/>
                    <Appbar.Content title={'Truck'} subtitle={'ID: AD4R2T78S'}/>
                    </Appbar.Header>

                    {this.renderActiveModal()}
                    <View>

                        <View style={styles.jobButtonContainer}>
                            <Button icon={'clipboard'} mode={'contained'} color={'#44BBA3'}
                                onPress={this.showActive} style={styles.jobButton} labelStyle={{fontSize: 12}}>Active</Button>

                            <Button icon={'clipboard-alert'} mode={'contained'} color={'#6744BB'}
                                onPress={this.showAssigned} style={styles.jobButton} labelStyle={{fontSize: 12}}>Assigned</Button>

                            <Button icon={'clipboard-check'} mode={'contained'} color={'#BB445C'}
                                onPress={this.showCompleted} style={styles.jobButton} labelStyle={{fontSize: 12}}>Completed</Button>
                        </View>

                        {this.renderActive()}

                        {this.renderAssigned()}

                        {this.renderCompleted()}

                        {this.renderDeleteDialog()}

                        {this.renderFinalizeDialog()}

                        <Button style={styles.jobAddButton} icon={'plus'} mode={'outlined'} color={'#44BBA3'} onPress={this.assignNewJob}>Assign New Job</Button>


                    </View>





                </View>
            </Provider>

        )
    }

}

HomeScreen.propTypes = {
  provider: ProviderPropType,
};

const styles = StyleSheet.create({
    container:{
        flexDirection: 'column',
        backgroundColor: 'white'

    },

    input:{
        marginHorizontal: 20,
    },

    assignedTitle:{
        marginTop: 5,
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: 'center',
        backgroundColor: 'whitesmoke',
    },

    assignedContainer:{
        height: height/2,
        backgroundColor: 'grey',
        marginBottom: 5,
    },

    activeContainer:{
      height: height/2,
      backgroundColor: 'grey',
      marginBottom: 5,
    },

    assignedJob:{
        backgroundColor: 'white',
        marginTop: 5,
        marginHorizontal: 5,
    },

    jobButtonContainer:{
        flexDirection: 'row',
        marginTop: 10,
    },

    jobButton:{
        flex: 1,
        marginHorizontal: 5,
    },
    jobAddButton:{
        marginHorizontal: 20,
        marginVertical: 15,
    }


})