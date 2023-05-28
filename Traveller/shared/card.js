import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableNativeFeedback } from "react-native";
import { color, font } from "../global/globalVariable";
import { getData } from "./data/localdata";

export default function Card({ navigation, data, vertical, isLoading }) {
    let [myData, setMyData] = React.useState(false);

    let creator = "";

    let i = 0;
    while (creator == "" && i < data.participants.length) {
        if (data.participants[i].creator === true) {
            creator = data.participants[i].username;
        }
        i++;
    }

    useEffect(() => {
        getCreator();

        async function getCreator() {
            let getMyData = await getData("user");
            setMyData(getMyData);
        }
    }, [])

    return (
        <TouchableNativeFeedback onPress={() => navigation.navigate("TravelDetail", data)}>
            {(!vertical) ?
                <View style={(!isLoading) ? styles.container : {display: "none"}} >
                    <View style={{ position: 'absolute', top: 10, left: 10 }}>
                        <Text style={styles.cardTitle}>{data.name}</Text>
                        <Text style={styles.cardSubtitle}>Creato il {data.creation_date} da {(creator == myData.username) ? "te" : creator}</Text>
                    </View>
                    <View style={{ position: 'absolute', bottom: 10, right: 30 }}>
                        {/* <CardPartecipants  data={data} /> */}
                    </View>
                </View>
                :
                <View style={styles.containerVertical}>
                    <View style={{ position: 'absolute', top: 10, left: 10 }}>
                        <Text style={styles.cardTitle}>{data.name}</Text>
                        <Text style={styles.cardSubtitle}>Creato il {data.creation_date} da {(creator == myData.username) ? "te" : creator}</Text>
                    </View>
                    <View style={{ position: 'absolute', bottom: 10, right: 30 }}>
                    </View>
                </View>
            }
        </TouchableNativeFeedback>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: color.primary,
        height: 120,
        width: 270,
        borderRadius: 10,
        margin: 10,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,
    },
    containerVertical: {
        backgroundColor: color.primary,
        height: 140,
        width: "90%",
        borderRadius: 10,
        marginTop: 10,
        marginBottom: 10,
        marginTop: 10,
        marginLeft: "5%",
        marginRight: "5%",
        padding: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,
    },
    cardTitle: {
        color: "white",
        fontSize: 24,
        textAlign: "left",
        fontFamily: font.montserratBold,
        marginBottom: 10,
    },
    cardSubtitle: {
        color: "white",
        fontSize: 16,
        textAlign: "left",
        fontFamily: font.montserratLight,
    },
    avatarContainer: {
        backgroundColor: "white",
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        height: 35,
        width: 35,
        marginRight: -15,
    }
});