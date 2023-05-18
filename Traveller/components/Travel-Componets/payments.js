import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableWithoutFeedback } from "react-native";
import { ComponentStyles } from "./componentStyle";
import { font } from "../../global/globalVariable";
import { getData } from "../../shared/data/localdata";
import { Badge } from '@react-native-material/core';

export default function PaymentComponent({ navigation, item, home, travel }) {
    let [info, setInfo] = React.useState([]);

    useEffect(() => {
        const test = async () => {
            let aus = await getData("user")

            for (let i of item.destinator) {
                if (i.userid == aus._id) {
                    setInfo(i);
                    console.log(i);
                }
            }
        }
        test();

    }, []);

    return (
        (info != []) ?
            <TouchableWithoutFeedback onPress={
                () => {
                    navigation.navigate("PaymentInfo", { item: item })
                }
            } >
                <View style={ComponentStyles.card}>
                    {(item.pinned && !home) ?
                        <View style={ComponentStyles.pinned}>
                            <Image source={require("../../assets/image/pin.png")} style={{ width: 20, height: 20, marginRight: 5, tintColor: "lightgray" }} />
                            <Text style={ComponentStyles.pinnedText}>Fissato in alto</Text>
                        </View>
                        : null
                    }

                    {(home) ?
                        <Badge label={travel} style={ComponentStyles.Badge} labelStyle={ComponentStyles.BadgeText} />
                        : null
                    }

                    {(info.payed) ?
                        <View style={[styles.status, { backgroundColor: "green" }]}>
                            <Text style={styles.statusText}>Pagato</Text>
                        </View>
                        :
                        <View style={styles.status}>
                            <Text style={styles.statusText}>Non pagato</Text>
                        </View>}
                    <View style={ComponentStyles.headerContainer}>
                        <View style={ComponentStyles.nameContainer}>
                            <Text style={ComponentStyles.nameText}>@{item.creator}</Text>
                        </View>
                        <Text style={ComponentStyles.datetimeText}>{item.dateTime}</Text>
                    </View>
                    <View>
                        <Text style={ComponentStyles.contentText}>Ti ha inviato una richiesta di:</Text>
                        <Text style={[ComponentStyles.contentText, { fontSize: 25, fontFamily: font.montserratBold }]}>{item.amount}€</Text>
                        <Text style={[ComponentStyles.contentText, { fontSize: 12, marginTop: 10, color: "gray" }]} >Clicca per maggiori informazioni</Text>
                    </View>
                </View>
            </TouchableWithoutFeedback>
            : <></>
    );
}

const styles = StyleSheet.create({
    status: {
        backgroundColor: "#FF0000",
        width: 100,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: 10,
        right: 0,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        elevation: 3,
    },
    statusText: {
        color: "#FFF",
        fontSize: 12,
        fontFamily: font.montserratBold,
    },
});