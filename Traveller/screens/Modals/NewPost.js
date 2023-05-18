import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableNativeFeedback, Modal, ScrollView, TextInput, ActivityIndicator, TouchableOpacity } from "react-native";
import { font, color, serverLink } from "../../global/globalVariable";
import { Dropdown } from "react-native-element-dropdown";
import { Checkbox, SegmentedButtons } from "react-native-paper";
import { FlatList } from "react-native-gesture-handler";
import { getData } from "../../shared/data/localdata";
import axios from "axios";

let voteParams;
let textParams;
let paymentParams;
let user;

/* 
    Struttura dei post:
    { type: "text", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ", creator: "Bosso", pinned: true, dateTime: "2020-12-12 12:12:12", travel: "_id" },
    { type: "vote", question: "Sta sera cosa si fa?", content: ["Vota 1", "Vota 2", "Vota 3", "Vota 4", "Vota 5"], "votes": [["Bosso"], ["Ciao", "Ok", "Lollo"], [], ["Miao"], []], creator: "Bosso", pinned: false, dateTime: "2020-12-12 12:12:12", travel: "_id" },
    { type: "payment", mode: "pay", to: [], creator: "Bosso", amount: "28.00€", pinned: true, dateTime: "2020-12-12 12:12:12", travel: "_id" },
*/

export default function NewPost({ setNewPost, data, refresh }) {
    let [isLoading, setIsLoading] = useState(false);

    let PostType = [
        { label: "Testo", value: "text" },
        { label: "Sondaggio", value: "vote" },
        { label: "Pagamento", value: "payments" },
        { label: "Biglietto", value: "ticket" },
    ]
    
    // Payment
    let [checked, setChecked] = useState(false);
    let [paymentType, setPaymentType] = useState("normal");
    let [amount, setAmount] = useState("");
    let [paymentDescription, setPaymentDescription] = useState("");

    // Survey
    let [question, setQuestion] = React.useState("");
    let [answers, setAnswers] = useState([
        { key: 1, question: "" }
    ])

    useEffect(() => {
        const test = async () => {
            let aus = await getData("user")

            user = aus;

            console.log(data.participants)

            voteParams = {
                question: "",
                content: [
                    "",
                ],
                votes: [[]],
                pinned: false,
                creator: aus.username,
                travel: data._id,
            }

            textParams = {
                content: "",
                pinned: false,
                creator: aus.username,
                travel: data._id,
            }

            paymentParams = {
                pinned: false,
                creator: aus.username,
                travel: data._id,
                amount: "",
                destinator: [],
                paymentType: "",
                description: "",
            }

            return aus;
        }

        test()
    }, [])



    let [ausState, setAusState] = useState(false)


    let [participants, setParticipants] = useState([]);
    let [selectedParticipants, setSelectedParticipants] = useState([]);

    useEffect(() => {
        // let aus = []

        // for (let i = 0; i < data.participants.length; i++) {
        //     aus.push({ value: data.participants[i], key: i, selected: "unchecked" })
        //     setSelectedParticipants([...selectedParticipants, false])
        // }

        let aus = [];
        for (let item of data.participants) {
            aus.push({ userid: item.userid, username: item.username, selected: false })
        }
        setChecked(aus)

        setParticipants(data.participants)
    }, [])


    let [type, setType] = React.useState("");
    let [pinned, setPinned] = React.useState(false);
    let [paymentDestinator, setpaymentDestinator] = React.useState("all");

    return (
        <Modal visible={true} animationType="slide" >
            <TouchableOpacity style={{ position: "absolute", top: 20, right: 20 }} onPress={() => setNewPost(false)}>
                <Text style={{ color: color.primary, fontSize: 18, fontFamily: font.montserrat }}>Annulla</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { marginTop: 60 }]} >Crea un nuovo post</Text>
            <ScrollView style={{ width: "100%", padding: 20 }} >
                <Text style={[styles.subtitle, { textAlign: "left", marginBottom: 10 }]}>Tipologia del post:</Text>
                <ScrollView
                    horizontal={true}
                    style={{ paddingBottom: 10 }}
                >
                    <SegmentedButtons
                        density="small"
                        style={{ fontFamily: font.montserrat }}
                        buttons={PostType}
                        onValueChange={(value) => { setType(value) }}
                        value={type}
                    >
                    </SegmentedButtons>
                </ScrollView>
                {type == "text" ? <TextInput placeholderTextColor={"gray"} style={styles.inputMultiline} multiline placeholder="Testo del post" onChangeText={(value) => textParams.content = value} /> : null}
                {type == "payments" ?
                    <>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <TextInput placeholderTextColor={"gray"} style={[styles.input, { width: "90%" }]} inputMode="numeric" placeholder="Importo del pagamento"
                                onChangeText={(value) => {
                                    setAmount(parseFloat(value))
                                }}
                            />
                            <Text style={[styles.title, { marginLeft: 10 }]}>€</Text>
                        </View>
                        <TextInput placeholderTextColor={"gray"} style={styles.inputMultiline} multiline={true} placeholder="Note del pagamento"
                            onChangeText={(value) => {
                                setPaymentDescription(value)
                            }}
                        />

                        <Text style={[styles.subtitle, { textAlign: "left", marginTop: 20, marginBottom: 10 }]}>Destinatari del pagamento:</Text>
                        <ScrollView
                            horizontal={true}
                            style={{ paddingBottom: 10 }}
                        >
                            <SegmentedButtons
                                style={{ fontFamily: font.montserrat }}
                                buttons={[{ label: "Tutti", value: "all" }, { label: "Personalizzato", value: "custom" }, { label: "Personale", value: "me" }]}
                                onValueChange={(value) => {
                                    setpaymentDestinator(value);
                                }}
                                density="small"
                                value={paymentDestinator}
                            />
                        </ScrollView>
                        {paymentDestinator == "custom" ?
                            <>
                                <Text style={[styles.subtitle, { marginTop: 10, textAlign: "left" }]}>
                                    Seleziona i partecipanti che riceveranno la richiesta di pagamento
                                </Text>
                                <FlatList
                                    data={checked}
                                    scrollEnabled={false}
                                    renderItem={({ item, index }) => (
                                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }} >
                                            <Text>{item.selected}</Text>
                                            <Checkbox
                                                status={item.selected ? 'checked' : 'unchecked'}
                                                onPress={() => {
                                                    const tempArr = [...checked];
                                                    tempArr.splice(index, 1, { ...item, selected: !item.selected });
                                                    setChecked(tempArr);
                                                }}
                                                color="#4900FF"
                                            />
                                            <Text style={styles.subtitle}>{item.username}</Text>
                                        </View>
                                    )}
                                />
                            </>
                            :
                            paymentDestinator == "all" ?
                                <Text style={[styles.subtitle, { marginTop: 10, textAlign: "left" }]}>Tutti i partecipanti del viaggio riceveranno la richiesta di pagamento</Text>
                                : paymentDestinator == "me" ?
                                    <Text style={[styles.subtitle, { marginTop: 10, textAlign: "left" }]}>Solo tu riceverai la richiesta di pagamento.</Text>
                                    : null
                        }

                        <Text style={[styles.subtitle, { textAlign: "left", marginTop: 20, marginBottom: 10 }]}>Tipologia di pagamento:</Text>

                        <SegmentedButtons
                            style={{ fontFamily: font.montserrat }}
                            buttons={[{ label: "Normale", value: "normal" }, { label: "non contato", value: "notCounted" }]}
                            onValueChange={(value) => {
                                setPaymentType(value);
                            }}
                            density="small"
                            value={paymentType}
                        />
                        {
                            paymentType == "normal" ?
                                <>
                                    <Text style={[styles.subtitle, { marginTop: 10, textAlign: "left" }]}>Il totale pagato dagli altri verrà contato nel tuo budget e il pagamento non verrà accreditato a te</Text>
                                </>
                                : 
                                paymentType == "notCounted" ?
                                    <>
                                        <Text style={[styles.subtitle, { marginTop: 10, textAlign: "left" }]}>Il totale pagato dagli altri non verrà contato nel tuo budget</Text>
                                    </>
                                    : null
                        }
                    </>
                    : null}


                {type == "vote" ?
                    <>
                        <TextInput placeholderTextColor={"gray"} style={styles.input} placeholder="Domanda" onChangeText={(value) => { setQuestion(value) }} />


                        <Text style={[styles.subtitle, { marginTop: 30 }]}>Risposte:</Text>
                        <FlatList
                            data={answers}
                            scrollEnabled={false}
                            extraData={ausState}
                            renderItem={({ item }) => (
                                <TextInput placeholderTextColor={"gray"} style={styles.input} onChangeText={(value) => {
                                    voteParams.content[item.key - 1] = value
                                }} placeholder={"Risposta " + item.key} />
                            )}
                        />

                        <TouchableNativeFeedback onPress={() => {
                            let aus = answers;
                            voteParams.content.push("");
                            voteParams.votes.push([]);
                            console.log(voteParams.content)
                            answers.push({ key: answers.length + 1, question: "" });
                            setAusState({ key: answers.length + 1, question: "" })
                            setAnswers(aus);
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
                    let param = []
                    if (type == "vote") {
                        voteParams.pinned = pinned;
                        voteParams.question = question;
                        console.log(voteParams)
                        textParams.dateTime = new Date().toLocaleString("it-IT", { timeZone: "Europe/Andorra" })
                        param = voteParams;
                    }
                    else if (type == "text") {
                        textParams.dateTime = new Date().toLocaleString("it-IT", { timeZone: "Europe/Andorra" })
                        textParams.pinned = pinned;
                        console.log(textParams)
                        param = textParams
                    }
                    else if (type == "payments") {
                        paymentParams.dateTime = new Date().toLocaleString("it-IT", { timeZone: "Europe/Andorra" })
                        paymentParams.pinned = pinned;

                        if (paymentDestinator == "custom") {
                            paymentParams.destinator = []
                            checked.forEach(element => {
                                if (element.selected) {
                                    paymentParams.destinator.push({ userid : element.userid, payed : false})
                                }
                            });
                        }
                        else if (paymentDestinator == "all") {
                            paymentParams.destinator = []
                            participants.forEach(element => {
                                paymentParams.destinator.push({ userid : element.userid, payed : false})
                            });
                        }
                        else if (paymentDestinator == "me") {
                            paymentParams.destinator = []
                            paymentParams.destinator.push({ userid : user._id, payed : false})
                        }
                        
                        paymentParams.paymentType = paymentType;
                        paymentParams.amount = amount;
                        paymentParams.description = paymentDescription;

                        param = paymentParams
                        console.log(paymentParams)
                    }

                    param.type = type;

                    setIsLoading(true)

                    if (param != []) {
                        axios.post(serverLink + "api/post/create", { param: param }).then((response) => {
                            setIsLoading(false)
                            refresh(param)
                            setNewPost(false)
                        }).catch((error) => {
                            setIsLoading(false)
                            console.log(error)
                        })
                    }
                }} >
                    {
                        isLoading ?
                            <ActivityIndicator size="large" color="#4900FF" style={{ marginTop: 20 }} />
                            :
                            <View style={[styles.button, (type == "") ? { backgroundColor: "lightgray" } : null]} >
                                <Text style={styles.buttonText} >Crea</Text>
                            </View>
                    }
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