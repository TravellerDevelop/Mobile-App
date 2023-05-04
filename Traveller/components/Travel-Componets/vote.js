import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableNativeFeedback, Image } from 'react-native';
import { RadioButton, ProgressBar } from 'react-native-paper';
import { ComponentStyles } from './componentStyle';
import { color, serverLink } from '../../global/globalVariable';
import { getData } from '../../shared/data/localdata';
import axios from 'axios';

let percent = {}
let ausItem;
let totalVotes;
let username = "";


export default function Vote({ item }) {
    let [checkDisabled, setCheckDisabled] = React.useState(false);

    ausItem = item;
    
    useEffect(() => {
        const test = async () => {
            let aus = await getData("user")
            username = aus.username
            ausItem = item;

            let i = 0

            console.log(ausItem.votes);

            for (item of ausItem.votes) {
                for (aus of item) {
                    if (aus == username) {
                        setChecked(ausItem.content[i])
                        setCheckDisabled(true)
                    }
                }

                i++
            }

            return aus;
        }

        test();


    }, []);


    let [checked, setChecked] = React.useState("");

    if (percent[item.content[0]] == undefined) {
        ausItem = item;

        totalVotes = 0;

        for (let aus of ausItem.votes) {
            totalVotes += aus.length;
        }
        let i = 0

        for (let aus of ausItem.votes) {
            percent[ausItem.content[i]] = (aus.length / totalVotes)
            if (isNaN(percent[ausItem.content[i]])) {
                percent[ausItem.content[i]] = 0;
            }
            i++
        }
    }

    return (
        <View style={ComponentStyles.card}>
            {(item.pinned) ?
                <View style={ComponentStyles.pinned}>
                    <Image source={require("../../assets/image/pin.png")} style={{ width: 20, height: 20, marginRight: 5, tintColor: "lightgray" }} />
                    <Text style={ComponentStyles.pinnedText}>Fissato in alto</Text>
                </View>
                : null
            }
            <View style={ComponentStyles.headerContainer}>
                <View style={ComponentStyles.nameContainer}>
                    <Text style={ComponentStyles.nameText}>@{item.creator}</Text>
                </View>
                <Text style={ComponentStyles.datetimeText} >{item.dateTime}</Text>
            </View>
            <Text style={ComponentStyles.questionText} >{item.question}</Text>
            <FlatList
                data={item.content}
                scrollEnabled={false}
                renderItem={
                    ({ item }) => (
                        <View style={ComponentStyles.voteContent}>
                            <Text style={ComponentStyles.contentText} >{item}</Text>
                            <View style={ComponentStyles.rowVote}>
                                <RadioButton
                                    disabled={checkDisabled}
                                    value={item}
                                    color={color.secondary}
                                    status={checked === item ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        if (checked != "") {
                                            let i = 0;

                                            while (checked != ausItem.content[i]) {
                                                i++;
                                            }

                                            percent[ausItem.content[i]] = ((ausItem.votes[i].length) / (totalVotes));

                                            if (isNaN(percent[ausItem.content[i]])) {
                                                percent[ausItem.content[i]] = 0;
                                            }
                                        }
                                        setChecked(item);
                                        let i = 0;

                                        while (item != ausItem.content[i]) {
                                            i++;
                                        }

                                        percent[ausItem.content[i]] = ((ausItem.votes[i].length + 1) / (totalVotes + 1));
                                    }}
                                />
                                <ProgressBar progress={percent[item]} color={"#4900FF"} style={{ width: 280, height: 10, borderRadius: 10 }} />
                            </View>
                        </View>
                    )
                }
            />

            <TouchableNativeFeedback
                onPress={() => {
                    if (checked != "" && !checkDisabled) {
                        let aus = item.votes;

                        let i = 0;

                        while (checked != ausItem.content[i]) {
                            i++;
                        }

                        aus[i].push(username);


                        console.log(aus);

                        console.log(item._id);
                        axios.post(serverLink + "api/post/updateVote", { id: item._id, vote: aus })
                            .then((res) => {
                                console.log(res.data);
                                setCheckDisabled(true);
                            })
                            .catch((err) => {
                                console.log(err);
                            })
                    }
                }}
            >
                {
                    (checkDisabled) ?
                        <View style={[ComponentStyles.cardButton,  { backgroundColor: "green", flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
                            <Image source={require("../../assets/image/icona-check.png")} style={{ width: 20, height: 20, marginRight: 5, tintColor: "white" }} />
                            <Text style={ComponentStyles.cardButtonText} >Risposta inviata!</Text>
                        </View>
                        :
                        <View style={[ComponentStyles.cardButton, (checked != "") ? null : { backgroundColor: "lightgray" }]}>
                            <Text style={ComponentStyles.cardButtonText} >{ "Invia risposta!" }</Text>
                        </View>
                }
            </TouchableNativeFeedback>
        </View>
    )
}