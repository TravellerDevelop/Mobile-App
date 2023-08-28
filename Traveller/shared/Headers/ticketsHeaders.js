import React, { useEffect, useState } from "react";
import { Camera, CameraType } from 'expo-camera';
import { StyleSheet, Text, TouchableOpacity, Modal, View, TouchableNativeFeedback, Image, Dimensions, Pressable, TextInput, Platform } from "react-native";
import { color, font, serverLink } from "../../global/globalVariable.js";
import { LinearGradient } from "expo-linear-gradient";
import { Badge } from "@react-native-material/core";
import { BarCodeScanner } from 'expo-barcode-scanner';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from "axios";
import { getData, storeJsonData } from "../data/localdata.js";

export default function TicketsHeader({ update }) {

    const [type, setType] = useState(CameraType.back);
    const [permission, requestPermission] = Camera.useCameraPermissions();

    const [modalVisible, setModalVisible] = useState(false);
    const [qrVisible, setQrVisible] = useState(false);

    const [scanned, setScaned] = useState(false);
    const [data, setData] = useState(null);

    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    let [dateOfTicket, setDateOfTicket] = useState("");

    const [ticketTitle, setTicketTitle] = useState("");

    const [userInfo, setUserInfo] = useState({});

    const toggleDatePicker = () => {
        setShowPicker(!showPicker);
    }

    const onChangeDate = ({ type }, selectedDate) => {
        if (type == "set") {
            const currentDate = selectedDate;
            setDate(currentDate);

            if (Platform.OS == "android") {
                toggleDatePicker()
                setDateOfTicket(currentDate.toLocaleDateString("it-IT", { timeZone: "Europe/Andorra" }));
            }
        }
        else {
            toggleDatePicker();
        }
    };

    const confirmIOSDate = () => {
        setDateOfTicket(date.toLocaleDateString("it-IT", { timeZone: "Europe/Andorra" }));
        toggleDatePicker();
    }


    if (!permission)
        requestPermission();

    function toggleCameraType() {
        setType(current => (current === CameraType.back ? CameraType.front : CameraType.back));
    }

    async function getUserData(){
        let aus = await getData("user");
        setUserInfo(aus);
    }

    useEffect(() => {
        getUserData();
    }, [])

    return (
        <>
            {
                qrVisible ?
                    <Modal visible={qrVisible} animationType='slide' >
                        <View style={modalstyles.container}>
                            <Text style={modalstyles.title}>{(!scanned) ? "Scannerizza il Qr Code" : "Nuovo biglietto"}</Text>
                            {
                                scanned ?
                                    <View>
                                        {/* <Text style={modalstyles.paragraph}>Scanned Data: {data}</Text> */}
                                        {
                                            showPicker ?
                                                <DateTimePicker
                                                    mode="date"
                                                    value={date}
                                                    display="default"
                                                    onChange={onChangeDate}
                                                    minimumDate={new Date()}
                                                    style={
                                                        styles.datePicker
                                                    }
                                                />
                                                :
                                                null
                                        }


                                        {
                                            showPicker && Platform.OS == "ios" && (
                                                <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                                                    <TouchableOpacity onPress={() => { toggleDatePicker() }} >
                                                        <Text style={{ fontFamily: font.text, fontSize: 20, color: color.primary }}>Annulla</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => { confirmIOSDate() }} >
                                                        <Text style={{ fontFamily: font.text, fontSize: 20, color: color.primary }}>Conferma</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )
                                        }

                                        <TextInput style={styles.input} placeholder="Titolo biglietto" placeholderTextColor="black"
                                            onChangeText={(text) => { setTicketTitle(text) }}
                                        />

                                        <Pressable
                                            onPress={() => { toggleDatePicker() }}
                                        >
                                            <TextInput style={styles.input}
                                                placeholder="Data del biglietto"
                                                placeholderTextColor="black"
                                                value={dateOfTicket}
                                                onChangeText={setDateOfTicket}
                                                onPressIn={toggleDatePicker}
                                                editable={false}
                                            />
                                        </Pressable>

                                        <TouchableNativeFeedback
                                            onPress={async () => {
                                                verifyTicketsData(data);
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: (Dimensions.get("window").width / 100) * 40,
                                                    height: 40,
                                                    marginLeft: (Dimensions.get("window").width / 100) * 30,
                                                    backgroundColor: "#F5F5F5",
                                                    borderRadius: 10,
                                                    paddingLeft: 10,
                                                    paddingRight: 10,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: font.text,
                                                        fontSize: 20,
                                                        color: color.primary,
                                                        textAlign: "center",
                                                        lineHeight: 40,
                                                    }}

                                                >Carica biglietto</Text>
                                            </View>
                                        </TouchableNativeFeedback>
                                    </View>
                                    :
                                    <Camera style={styles.camera} type={type}
                                        barCodeScannerSettings={{
                                            barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
                                        }}

                                        onBarCodeScanned={({ type, data }) => {
                                            setData([type, data]);
                                            setScaned(true);
                                        }}
                                    >
                                    </Camera>

                            }
                            <TouchableNativeFeedback onPress={() => {
                                setScaned(false)
                                setData(null)
                                setQrVisible(false)
                            }}>
                                <View style={modalstyles.button}>
                                    <Text style={modalstyles.buttonText}>
                                        ← Torna indietro
                                    </Text>
                                </View>
                            </TouchableNativeFeedback >
                        </View>
                    </Modal>
                    : null
            }

            <LinearGradient
                style={styles.container}
                start={{ x: 0.5, y: 0.2 }}
                colors={[color.primary, color.secondary]}
            >
                <Text style={{ fontFamily: font.text_bold, fontSize: 25, color: "white", marginLeft: 20 }}>Tickets</Text>
                <Text style={styles.paragraph}>Aggiungi tutti i tuoi biglietti per averceli sempre dietro! (Anche disponibili offline!) 🎫 🎟️</Text>
                <TouchableOpacity style={[styles.add, { height: 30 }]} onPress={() => setModalVisible(true)} >
                    <Badge label={"+ Aggiungi biglietto"} color="#FFF" labelStyle={styles.label} />
                </TouchableOpacity>
                <Modal visible={modalVisible} animationType='slide' >
                    <View style={modalstyles.container}>
                        <Text style={modalstyles.title}>Nuovo biglietto</Text>

                        <TouchableNativeFeedback
                            onPress={() => {
                                setQrVisible(true);
                            }}
                        >
                            <View style={modalstyles.card}>
                                <View style={modalstyles.row}>
                                    <Image style={modalstyles.image} source={require("../../assets/image/icona-qr-code.png")} />
                                    <Text style={modalstyles.subtitle}>Scannerizza il Qr Code</Text>
                                </View>
                                <Text style={modalstyles.paragraph}>
                                    Scannerizza con il tuo dispositivo il Qr Code presente sul biglietto, oppure importalo direttamente dalla tua galleria! 📸 📸
                                </Text>
                            </View>
                        </TouchableNativeFeedback>

                        <TouchableNativeFeedback>
                            <View style={modalstyles.card}>
                                <View style={modalstyles.row}>
                                    <Image style={modalstyles.image} source={require("../../assets/image/icona-edit.png")} />
                                    <Text style={modalstyles.subtitle}>Inserisci manualmente</Text>
                                </View>
                                <Text style={modalstyles.paragraph}>
                                    Inserisci manualmente i dati del biglietto, come il numero di volo, la compagnia aerea, la data e l'ora di partenza e arrivo. 📝 📝
                                </Text>
                            </View>
                        </TouchableNativeFeedback>


                        <TouchableNativeFeedback onPress={() => setModalVisible(false)}>
                            <View style={modalstyles.button}>
                                <Text style={modalstyles.buttonText}>
                                    ← Torna indietro
                                </Text>
                            </View>
                        </TouchableNativeFeedback >
                    </View>
                </Modal>
            </LinearGradient>
        </>
    )

    function verifyTicketsData(data) {
        let splittedData = data[1].split(" ");

        splittedData = splittedData.filter(function (el) {
            return el != '';
        });

        let out = {
            name: "",
            surname: "",
            from: {},
            to: {},
            company: {},
            flightNumber: "",
            aircraft: "",
            qrdata: data[1],
            qrtype: data[0],
        }

        let aus = "";

        aus = splittedData[0].substring(2, splittedData[0].length).split("/");

        const options = {
            method: 'GET',
            url: 'https://aerodatabox.p.rapidapi.com/flights/number/' + splittedData[2].substring(6, splittedData[2].length) + splittedData[3],
            headers: {
                'X-RapidAPI-Key': '02a9adf0c7mshb0be85718ea39a3p175bc5jsnb2ceb4c0b3fd',
                'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
            }
        };

        if (splittedData[2].substring(6, splittedData[2].length) == "FR" || splittedData[2].substring(6, splittedData[2].length) == "VY" || splittedData[2].substring(6, splittedData[2].length) == "KL" || splittedData[2].substring(6, splittedData[2].length) == "AZ") {
            axios.request(options)
                .then(async function (response) {
                    let flightInfo = response.data;

                    out.surname = aus[0];
                    out.name = aus[1];
                    out.company = { name: flightInfo[0].airline.name, iata: flightInfo[0].airline.iata, icao: flightInfo[0].airline.icao }
                    out.from = { iata: flightInfo[0].departure.airport.iata, name: flightInfo[0].departure.airport.name }
                    out.to = { iata: flightInfo[0].arrival.airport.iata, name: flightInfo[0].arrival.airport.name }
                    out.flightNumber = flightInfo[0].number;
                    out.aircraft = flightInfo[0].aircraft.model

                    out.title = ticketTitle;
                    out.date = new Date(date);
                    out.creator = userInfo._id;

                    axios.post(serverLink + "api/tickets/create", { data: out })
                        .then(async function (response) {
                            update();
                            setScaned(false);
                            setData(null);
                            setQrVisible(false);
                            setModalVisible(false);
                            let aus = await getData("tickets");
                            if(aus == null) aus = [];
                            aus.push(out);
                            await storeData("tickets", aus);
                        })
                        .catch(function (error) {
                            console.error(error);
                        })

                    return out;
                }).catch(function (error) {
                    console.error(error);

                    return "Errore nella richiesta";
                });
        }
        else {
            return "Linea aerea non supportata";
        }
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: color.primary,
        width: "100%",
        height: 140,
    },
    add: {
        position: "absolute",
        left: 20,
        top: 100,
        height: 25,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    label: {
        marginLeft: 10,
        marginRight: 10,
        fontFamily: font.text,
        fontSize: 12,
        color: "#000",
    },
    paragraph: {
        fontFamily: font.text,
        fontSize: 15,
        color: "#FFF",
        marginLeft: 20,
        marginRight: 20,
        marginTop: 10,
    },
    camera: {
        aspectRatio: 1 / 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width,
    },
    input: {
        width: Dimensions.get("window").width - 22,
        fontFamily: font.text,
        height: 40,
        backgroundColor: "#F5F5F5",
        marginBottom: 20,
        borderRadius: 10,
        paddingLeft: 10,
        paddingRight: 10,
        marginLeft: 10
    },
    datePicker: {
        width: Dimensions.get("window").width - 20,
        height: 40,
        marginBottom: 20,
    }
});


const modalstyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "space-around",
    },
    title: {
        fontFamily: font.text_bold,
        fontSize: 25,
        color: color.secondary,
    },
    subtitle: {
        fontFamily: font.text,
        fontSize: 19,
        maxWidth: "80%",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        height: 50,
        paddingLeft: 20,
    },
    image: {
        height: 25,
        width: 25,
        marginRight: 10,
    },
    card: {
        width: "90%",
        backgroundColor: "white",
        padding: 10,
        borderColor: color.primary,
        borderWidth: 1,
        borderRadius: 10,
        marginTop: 20,
        elevation: 5,
    },
    paragraph: {
        fontFamily: font.text,
        fontSize: 15,
        marginLeft: 20,
        marginRight: 20,
        marginBottom: 10,
    },
    button: {
        backgroundColor: color.primary,
        width: "90%",
        height: 50,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
    },
    buttonText: {
        fontFamily: font.text,
        fontSize: 20,
        color: "white",
    },
});