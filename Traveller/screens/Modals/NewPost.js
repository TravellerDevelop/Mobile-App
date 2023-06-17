import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableNativeFeedback, Modal, ScrollView, TextInput, ActivityIndicator, TouchableOpacity, Image, SafeAreaView } from "react-native";
import { font, color, serverLink } from "../../global/globalVariable";
import { Button, Checkbox, SegmentedButtons } from "react-native-paper";
import { FlatList } from "react-native-gesture-handler";
import { getData } from "../../shared/data/localdata";
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { Platform } from "react-native";

let voteParams;
let textParams;
let paymentParams;
let imageParams;

// export default function NewPost({ data, refresh }) {
export default function NewPost({ navigation, route }) {
    let data = route.params.data;
    let refresh = route.params.refresh;

    let [images, setImages] = useState([]);
    let [imagesDescription, setImagesDescription] = useState("");

    const pickImages = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            base64: true,
            allowsMultipleSelection: true,
            allowsEditing: false,
            quality: 0.8,
        })


        if (!result.canceled) {
            await setImages(result.assets)
            toggleExtraImages()
        }
    }

    let [newImages, setNewImages] = useState(false)

    const toggleExtraImages = () => {
        setNewImages(!newImages)
    }

    async function addImage() {
        let links = [];

        for (let item of images) {
            let fileName = item.uri.split("/").pop();
            await axios.post(`${serverLink}api/post/addImage`, {
                img: item.base64,
                name: fileName,
            })
                .then((res) => {
                    console.log(res.data)
                    links.push(res.data)
                })
                .catch((err) => {
                    console.log(err)
                })
        }

        console.log(links)
        imageParams.source = links;
    }

    let [user, setUser] = useState({});

    let [isLoading, setIsLoading] = useState(false);

    let PostType = [
        { label: "Testo", value: "text", icon: require('../../assets/image/icona-documento.png'), checkedColor: color.primary },
        { label: "Sondaggio", value: "vote", icon: require('../../assets/image/icona-istogramma.png'), checkedColor: color.primary },
        { label: "Pagamento", value: "payments", icon: require('../../assets/image/icona-wallet.png'), checkedColor: color.primary },
        { label: "Immagini", value: "images", icon: require('../../assets/image/icona-immagine.png'), checkedColor: color.primary },
    ]

    // Payment
    let [checked, setChecked] = useState(false);
    let [paymentType, setPaymentType] = useState("normal");
    let [amount, setAmount] = useState("");
    let [paymentDescription, setPaymentDescription] = useState("");

    // Survey
    let [question, setQuestion] = React.useState("");
    let [answers, setAnswers] = useState([
        { key: 1, question: "" },
        { key: 2, question: "" },
    ])

    useEffect(() => {
        const test = async () => {
            let aus = await getData("user")

            setUser(aus);

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

            imageParams = {
                pinned: false,
                creator: aus.username,
                travel: data._id,
                source: [],
                description: "",
            }

            return aus;
        }

        test()
    }, [])

    let [ausState, setAusState] = useState(false)
    let [participants, setParticipants] = useState([]);

    useEffect(() => {
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
        // <Modal visible={true} animationType="slide" >
            <SafeAreaView
                style={{ backgroundColor: "white", paddingBottom: 100 }}
            >
                <Text style={[styles.title]} >Crea un nuovo post</Text>
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
                            checkedColor={color.primary}
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
                                    buttons={[{ label: "Tutti", value: "all", checkedColor: color.primary }, { label: "Personalizzato", value: "custom", checkedColor: color.primary }, { label: "Personale", value: "me", checkedColor: color.primary }]}
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
                                            (item.userid != user._id) && (
                                                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }} >
                                                    <Text>{item.selected}</Text>
                                                    {
                                                        Platform.OS == "ios" ?
                                                            <View
                                                                style={{
                                                                    backgroundColor: "#CCCCCC50",
                                                                    borderRadius: "50%",
                                                                    marginRight: 10,
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    status={item.selected ? 'checked' : 'unchecked'}
                                                                    onPress={() => {
                                                                        const tempArr = [...checked];
                                                                        tempArr.splice(index, 1, { ...item, selected: !item.selected });
                                                                        setChecked(tempArr);
                                                                    }}
                                                                    color="#4900FF"
                                                                />
                                                            </View>
                                                            :
                                                            <Checkbox
                                                                status={item.selected ? 'checked' : 'unchecked'}
                                                                onPress={() => {
                                                                    const tempArr = [...checked];
                                                                    tempArr.splice(index, 1, { ...item, selected: !item.selected });
                                                                    setChecked(tempArr);
                                                                }}
                                                                color="#4900FF"
                                                            />
                                                    }
                                                    <Text style={styles.subtitle}>{item.username}</Text>
                                                </View>
                                            )
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

                            {/* <Text style={[styles.subtitle, { textAlign: "left", marginTop: 20, marginBottom: 10 }]}>Tipologia di pagamento:</Text> */}
                            {/* 
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
                        } */}
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

                    {type == "images" && (
                        <View>
                            <TouchableNativeFeedback onPress={() => pickImages()} >
                                <View style={styles.button} >
                                    <Text style={styles.buttonText} >+ Aggiungi immagini</Text>
                                </View>
                            </TouchableNativeFeedback>
                            <TextInput style={styles.input} placeholder="Descrizone immagini" onChangeText={(text) => setImagesDescription(text)} />
                            <View>
                                {
                                    (images.length > 0) && (
                                        <Text
                                            style={[styles.subtitle, { textAlign: "left", marginTop: 20, marginBottom: 10 }]}
                                        >Preview delle immagini:</Text>
                                    )
                                }

                                <FlatList
                                    data={images}
                                    extraData={newImages}
                                    horizontal={true}
                                    scrollEnabled={true}
                                    renderItem={({ item }) => (
                                        <>
                                            {
                                                (item.uri != undefined) && (
                                                    <Image source={{ uri: item.uri }} style={{ width: (item.width / item.height) * 200, height: 200, marginRight: 10 }} />
                                                )
                                            }
                                        </>
                                    )}
                                />
                            </View>
                        </View>
                    )}


                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }} >
                        {
                            Platform.OS == "ios" ?
                                <View
                                    style={{
                                        backgroundColor: "#CCCCCC50",
                                        borderRadius: "50%",
                                        marginRight: 10,
                                    }}
                                >
                                    <Checkbox
                                        status={pinned ? "checked" : "unchecked"}
                                        onPress={() => { setPinned(!pinned) }}
                                        style={{ borderColor: "#CCC", borderWidth: 1 }}
                                        uncheckedColor="#CCC"
                                        color="#4900FF"
                                    />
                                </View>
                                :
                                <Checkbox
                                    status={pinned ? "checked" : "unchecked"}
                                    onPress={() => { setPinned(!pinned) }}
                                    style={{ borderColor: "#CCC", borderWidth: 1 }}
                                    uncheckedColor="#CCC"
                                    color="#4900FF"
                                />
                        }
                        <Text style={styles.subtitle}>Post fissato in alto</Text>
                    </View>

                    <TouchableNativeFeedback onPress={async () => {
                        setIsLoading(true);
                        let param = []
                        if (type == "vote") {
                            voteParams.pinned = pinned;
                            voteParams.question = question;
                            param = voteParams;
                        }
                        else if (type == "text") {
                            textParams.pinned = pinned;
                            param = textParams
                        }
                        else if (type == "payments") {
                            paymentParams.pinned = pinned;

                            if (paymentDestinator == "custom") {
                                paymentParams.destinator = []
                                checked.forEach(element => {
                                    if (element.selected) {
                                        paymentParams.destinator.push({ userid: element.userid, payed: false })
                                    }
                                });
                            }
                            else if (paymentDestinator == "all") {
                                paymentParams.destinator = []
                                participants.forEach(element => {
                                    if (element.userid != user._id) {
                                        paymentParams.destinator.push({ userid: element.userid, payed: false })
                                    }
                                });
                            }
                            else if (paymentDestinator == "me") {
                                paymentParams.destinator = []
                                paymentParams.destinator.push({ userid: user._id, payed: false, personal: true })
                            }

                            paymentParams.paymentType = paymentType;
                            paymentParams.amount = amount;
                            paymentParams.description = paymentDescription;

                            param = paymentParams
                        }
                        else if (type == "images") {
                            await addImage()
                            imageParams.pinned = pinned;
                            imageParams.description = imagesDescription;
                            param = imageParams
                        }

                        param.type = type;

                        if (param != []) {
                            axios.post(serverLink + "api/post/create", { param: param }).then((response) => {
                                setIsLoading(false)
                                refresh(param)
                                navigation.goBack()
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
            </SafeAreaView>
        // </Modal>
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