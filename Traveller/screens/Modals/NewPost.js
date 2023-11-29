import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableNativeFeedback, ScrollView, ActivityIndicator, Image, SafeAreaView, LogBox } from "react-native";
import { font, color, serverLink } from "../../global/globalVariable";
import { TextInput, Checkbox, SegmentedButtons } from "react-native-paper";
import { FlatList } from "react-native-gesture-handler";
import { getData } from "../../shared/data/localdata";
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { Platform } from "react-native";
import { globalStyleComponent } from "../../global/globalStyleComponent";

let voteParams;
let textParams;
let paymentParams;
let imageParams;

export default function NewPost({ navigation, route }) {
    let data = route.params.data;
    let refresh = route.params.refresh;

    let [images, setImages] = useState([]);
    let [imagesDescription, setImagesDescription] = useState("");

    let [toDoParams, setToDoParams] = useState({
        pinned: false,
        creator: "",
        description: "",
        items: [{ key: 1, label: "", checked: false }],
        travel: ""
    })

    LogBox.ignoreLogs([
        'Non-serializable values were found in the navigation state',
    ]);

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
                    links.push(res.data)
                })
                .catch((err) => {
                    console.log(err)
                })
        }

        imageParams.source = links;
    }

    let [user, setUser] = useState({});

    let [isLoading, setIsLoading] = useState(false);

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

            let ausToDoParams = toDoParams;
            ausToDoParams.creator = aus.username;
            ausToDoParams.travel = data._id;
            setToDoParams(ausToDoParams);

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


    let [type, setType] = React.useState(route.params.type);
    let [pinned, setPinned] = React.useState(false);
    let [paymentDestinator, setpaymentDestinator] = React.useState("all");

    return (
        <SafeAreaView
            style={{ backgroundColor: "white", paddingBottom: 100, flex: 1 }}
        >
            <Text style={[styles.title]} >Crea un nuovo post</Text>
            <ScrollView style={{ width: "100%", padding: 20 }} >
                {type == "text" && <TextInput placeholderTextColor={"gray"} underlineStyle={{ borderColor: "white", backgroundColor: "transparent", }} style={[globalStyleComponent.input, { height: 120 }]} multiline label="Testo del post" onChangeText={(value) => textParams.content = value} />}
                {type == "payments" &&
                    <>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <TextInput underlineStyle={{ borderColor: "white", backgroundColor: "transparent", }} style={[globalStyleComponent.input, { width: "90%" }]} inputMode="numeric" label="Importo del pagamento"
                                onChangeText={(value) => {
                                    setAmount(parseFloat(value))
                                }}
                            />
                            <Text style={[styles.title, { marginLeft: 10 }]}>€</Text>
                        </View>
                        <TextInput underlineStyle={{ borderColor: "white", backgroundColor: "transparent", }} style={[globalStyleComponent.input, { height: 150 }]} multiline label="Note del pagamento"
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
                                style={{ fontFamily: font.text }}
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
                    </>}


                {type == "vote" &&
                    <>
                        <TextInput underlineStyle={{ borderColor: "white", backgroundColor: "transparent", }} style={globalStyleComponent.input} label="Domanda" onChangeText={(value) => { setQuestion(value) }} />
                        <Text style={[styles.subtitle, { marginTop: 30 }]}>Risposte:</Text>
                        <FlatList
                            data={answers}
                            scrollEnabled={false}
                            extraData={ausState}
                            renderItem={({ item }) => (
                                <TextInput underlineStyle={{ borderColor: "white", backgroundColor: "transparent", }} style={globalStyleComponent.input} onChangeText={(value) => {
                                    voteParams.content[item.key - 1] = value
                                }} label={"Risposta " + item.key} />
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
                }

                {type == "images" && (
                    <View>
                        <TouchableNativeFeedback onPress={() => pickImages()} >
                            <View style={styles.button} >
                                <Text style={styles.buttonText} >+ Aggiungi immagini</Text>
                            </View>
                        </TouchableNativeFeedback>
                        <TextInput underlineStyle={{ borderColor: "white", backgroundColor: "transparent", }} style={globalStyleComponent.input} label="Descrizone immagini" onChangeText={(text) => setImagesDescription(text)} />
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

                {
                    type == "todo" && (
                        <>
                            <TextInput underlineStyle={{ borderColor: "white", backgroundColor: "transparent", }} style={globalStyleComponent.input} label="Descrizione" onChangeText={(value) => {
                                let aus = toDoParams;
                                aus.description = value;
                                setToDoParams(aus);
                            }} />
                            <Text style={[styles.subtitle, { textAlign: "left", marginBottom: 0, marginTop: 5 }]}>Campi della lista:</Text>
                            {
                                toDoParams.items.map(item => (
                                    <View style={styles.row} key={item.key}>
                                        <TextInput
                                            underlineStyle={{ borderColor: "white", backgroundColor: "transparent", }}
                                            style={[globalStyleComponent.input, (item.label == "") && { borderBottomColor: "red" }]}
                                            label={`Campo ${item.key}`}
                                            onChangeText={(text) => {
                                                setToDoParams(prevState => ({
                                                    ...prevState,
                                                    items: prevState.items.map(i => {
                                                        if (i.key === item.key) {
                                                            return { ...i, label: text };
                                                        }
                                                        return i;
                                                    })
                                                }));
                                            }}
                                            right={
                                                <TextInput.Icon icon="delete" color={'#FF0000'} rippleColor='#4960FF' onPress={
                                                    () => {
                                                        if (toDoParams.items.length != 1) {
                                                            setToDoParams(prevState => ({
                                                                ...prevState,
                                                                items: prevState.items.filter(i => i.key !== item.key)
                                                            }));
                                                        }
                                                    }
                                                } />
                                            }
                                        />
                                    </View>
                                ))
                            }

                            <TouchableNativeFeedback
                                onPress={
                                    () => {
                                        const newItem = { key: toDoParams.items[toDoParams.items.length - 1].key + 1, label: "", checked: false };
                                        setToDoParams(prevState => ({
                                            ...prevState,
                                            items: [...prevState.items, newItem]
                                        }));
                                    }
                                }
                            >
                                <View style={styles.add}>
                                    <Text style={styles.addText}>+ Aggiungi campo</Text>
                                </View>
                            </TouchableNativeFeedback>
                        </>
                    )
                }


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

                    switch (type) {
                        case "vote":
                            voteParams.pinned = pinned;
                            voteParams.question = question;
                            param = voteParams;
                            break;
                        case "text":
                            textParams.pinned = pinned;
                            param = textParams;
                            break;
                        case "payments":
                            paymentParams.pinned = pinned;

                            switch (paymentDestinator) {
                                case "custom":
                                    paymentParams.destinator = [];
                                    checked.forEach(element => {
                                        if (element.selected) {
                                            paymentParams.destinator.push({ userid: element.userid, payed: false });
                                        }
                                    });
                                    break;
                                case "all":
                                    paymentParams.destinator = [];
                                    participants.forEach(element => {
                                        if (element.userid != user._id) {
                                            paymentParams.destinator.push({ userid: element.userid, payed: false });
                                        }
                                    });
                                    break;
                                case "me":
                                    paymentParams.destinator = [];
                                    paymentParams.destinator.push({ userid: user._id, payed: false, personal: true });
                                    break;
                            }

                            paymentParams.paymentType = paymentType;
                            paymentParams.amount = amount;
                            paymentParams.description = paymentDescription;

                            param = paymentParams;
                            break;
                        case "images":
                            await addImage()
                            imageParams.pinned = pinned;
                            imageParams.description = imagesDescription;
                            param = imageParams
                            break;
                        case "todo":
                            let aus = toDoParams;
                            aus.pinned = pinned;
                            param = aus;
                            break;
                    }

                    param.type = type;

                    if (param != []) {
                        axios.post(serverLink + "api/post/create", { param: param }).then((response) => {
                            setIsLoading(false);
                            console.log(response)
                            refresh(param);
                            navigation.goBack();
                        }).catch((error) => {
                            setIsLoading(false);
                            console.log(error);
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
        textAlign: "left",
        marginLeft: 20,
        marginTop: 5,
        fontFamily: font.text,
    },
    subtitle: {
        fontSize: 16,
        color: "black",
        textAlign: "center",
        fontFamily: font.text,
    },
    input: {
        backgroundColor: "white",
        fontSize: 16,
        width: "100%",
        height: 50,
        marginBottom: 10,
        fontFamily: font.text,
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
        fontFamily: font.text_bold,
        fontSize: 18,
        textAlign: "center",
        lineHeight: 40,
    },
    inputMultiline: {
        backgroundColor: "white",
        padding: 10,
        marginTop: 0,
        width: "100%",
        height: 100,
        marginBottom: 10,
        fontFamily: font.text,
        borderBottomColor: color.secondary,
        borderBottomWidth: 2,
        borderTopColor: "lightgray",
        borderTopWidth: 1,
        borderLeftColor: "lightgray",
        borderLeftWidth: 1,
        borderRightColor: "lightgray",
        borderRightWidth: 1,
    },
    add: {
        borderWidth: 2,
        height: 40,
        borderColor: "#4900FF",
        borderStyle: "dashed",
        borderRadius: 5,
        justifyContent: "center",
        alignItems: "center"
    },
    addText: {
        color: "#4900FF",
        fontFamily: font.text_bold
    },
    row: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center"
    },
    delete: {
        width: 25,
        height: 25,
        marginLeft: 5,
        tintColor: "red"
    }
});