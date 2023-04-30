import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableNativeFeedback, Modal, ScrollView, TextInput } from "react-native";
import { font, color } from "../../global/globalVariable";
import { Dropdown } from "react-native-element-dropdown";
import { Checkbox } from "react-native-paper";
import { FlatList } from "react-native-gesture-handler";
import { getData } from "../../shared/data/localdata";

let voteParams;

export default function NewPost({ setNewPost, data }) {
    let PostType = [
        { label: "Testo", value: "text" },
        { label: "Sondaggio", value: "vote" },
        { label: "Pagamento", value: "payments" },
    ]




    const test = async () => {
        let aus = await getData("user")
        console.log(aus);

        voteParams = {
            question: "",
            content: [
                "",
            ],
            pinned: false,
            creator: aus.username,
        }

        return aus;
    }

    test()


    let [answers, setAnswers] = useState([
        { key: 1, question: "" }
    ])

    let [ausState, setAusState] = useState(false)


    let [participants, setParticipants] = useState([]);
    let [selectedParticipants, setSelectedParticipants] = useState([]);

    useEffect(() => {
        let aus = []

        for (let i = 0; i < data.participants.length; i++) {
            aus.push({ value: data.participants[i], key: i, selected: "unchecked" })
            setSelectedParticipants([...selectedParticipants, false])
        }

        setParticipants(aus)
    }, [])


    let [type, setType] = React.useState("");
    let [pinned, setPinned] = React.useState(false);
    let [paymentDestinator, setpaymentDestinator] = React.useState(false);



    return (
        <Modal visible={true} animationType="slide" >
            <Text style={styles.title} >Crea un nuovo post</Text>
            <ScrollView style={{ width: "100%", padding: 20 }} >
                <Dropdown
                    placeholder='Tipologia del post'
                    data={PostType}
                    style={{ borderBottomColor: "#4900FF", borderBottomWidth: 2, width: "100%", marginTop: 10 }}
                    placeholderStyle={{ fontFamily: font.montserrat }}
                    selectedTextStyle={{ fontFamily: font.montserrat }}
                    inputSearchStyle={{ fontFamily: font.montserrat }}
                    fontFamily={font.montserrat}
                    onChange={(value) => { setType(value["value"]) }}
                    labelField="label"
                    valueField="value"
                />
                {type == "text" ? <TextInput style={styles.input} placeholder="Testo del post" /> : null}
                {type == "payments" ?
                    <>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <TextInput style={[styles.input, { width: "90%" }]} inputMode="numeric" placeholder="Importo del pagamento" />
                            <Text style={[styles.title, { marginLeft: 10 }]}>€</Text>
                        </View>
                        <TextInput style={styles.inputMultiline} multiline={true} placeholder="Note del pagamento" />
                        <Dropdown
                            placeholder="Destinatari"
                            data={[{ label: "Tutti", value: "all" }, { label: "Personalizzato", value: "custom" }]}
                            style={{ borderBottomColor: "#4900FF", borderBottomWidth: 2, width: "100%", marginTop: 10 }}
                            placeholderStyle={{ fontFamily: font.montserrat }}
                            selectedTextStyle={{ fontFamily: font.montserrat }}
                            inputSearchStyle={{ fontFamily: font.montserrat }}
                            fontFamily={font.montserrat}
                            labelField="label"
                            valueField="value"
                            onChange={(value) => { setpaymentDestinator(value.value) }}
                        />

                        {paymentDestinator == "custom" ?
                            <FlatList
                                data={participants}
                                scrollEnabled={false}
                                renderItem={({ item }) => (
                                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }} >
                                        <Checkbox
                                            status={participants[item.key].selected}
                                            onPress={() => {
                                                let aus = participants;
                                                (aus[item.key].selected == "unchecked") ? aus[item.key].selected = "checked" : aus[item.key].selected = "unchecked";
                                                console.log(aus)
                                                setParticipants(aus)
                                                console.log(participants)
                                            }}
                                            color="#4900FF"
                                        />
                                        <Text style={styles.subtitle}>{item.value}</Text>
                                    </View>
                                )}
                            />
                            : null}

                    </>
                    : null}


                {type == "vote" ?
                    <>
                        <TextInput style={styles.input} placeholder="Domanda" onChangeText={(value) => { voteParams.question = value }} />

                        
                        <Text style={[styles.subtitle, {marginTop: 30}]}>Risposte:</Text>
                        <FlatList
                            data={answers}
                            scrollEnabled={false}
                            extraData={ausState}
                            renderItem={({ item }) => (
                                <TextInput style={styles.input} onChangeText={(value) => {
                                    voteParams.content[item.key - 1] = value
                                }} placeholder={"Risposta " + item.key} />
                            )}
                        />

                        <TouchableNativeFeedback onPress={() => {
                            let aus = answers;
                            voteParams.content.push("");
                            console.log(voteParams.content)
                            answers.push({ key: answers.length + 1, question: "" });
                            setAusState({ key: answers.length + 1, question: "" })
                            setAnswers(aus)
                        }
                        } >


                            <View style={styles.button} >
                                <Text style={styles.buttonText} >+ Aggiungi risposta</Text>
                            </View>
                        </TouchableNativeFeedback>
                    </>
                    : null
                }



                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }} >
                    <Checkbox
                        status={pinned ? "checked" : "unchecked"}
                        onPress={() => { setPinned(!pinned) }}
                        color="#4900FF"
                    />
                    <Text style={styles.subtitle}>Post fissato in alto</Text>
                </View>

                <TouchableNativeFeedback onPress={() => {
                    // (type != "") ? setNewPost(false) : null
                    if(type == "vote"){
                        voteParams.pinned = pinned;
                        console.log(voteParams)
                    }




                }} >
                    <View style={[styles.button, (type == "") ? { backgroundColor: "lightgray" } : null]} >
                        <Text style={styles.buttonText} >Crea</Text>
                    </View>
                </TouchableNativeFeedback>
            </ScrollView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    title: {
        fontSize: 20,
        color: "black",
        textAlign: "center",
        marginTop: 20,
        fontFamily: font.montserrat,
    },
    subtitle: {
        fontSize: 16,
        color: "black",
        textAlign: "center",
        fontFamily: font.montserrat,
    },
    input: {
        backgroundColor: "white",
        fontSize: 16,
        marginTop: 20,
        width: "100%",
        height: 50,
        marginBottom: 10,
        fontFamily: font.montserrat,
        borderBottomColor: color.secondary,
        borderBottomWidth: 2,
    },
    button: {
        width: "100%",
        height: 40,
        backgroundColor: color.secondary,
        borderRadius: 10,
        marginTop: 20,
        marginBottom: 20,
    },
    buttonText: {
        color: "white",
        fontFamily: font.montserrat,
        fontSize: 18,
        textAlign: "center",
        lineHeight: 40,
    },
    inputMultiline: {
        backgroundColor: "white",
        padding: 10,
        marginTop: 10,
        width: "100%",
        height: 100,
        marginBottom: 10,
        fontFamily: font.montserrat,
        borderBottomColor: color.secondary,
        borderBottomWidth: 2,
        borderTopColor: "lightgray",
        borderTopWidth: 1,
        borderLeftColor: "lightgray",
        borderLeftWidth: 1,
        borderRightColor: "lightgray",
        borderRightWidth: 1,
        borderRadius: 10,
    },
});