import React, { useState } from "react";
import { Camera, CameraType } from 'expo-camera';
import { StyleSheet, Text, TouchableOpacity, Modal, View, TouchableNativeFeedback, Image, Dimensions } from "react-native";
import { color, font } from "../../global/globalVariable.js";
import { LinearGradient } from "expo-linear-gradient";
import { Badge } from "@react-native-material/core";
import { BarCodeScanner } from 'expo-barcode-scanner';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TicketsHeader() {

    const [type, setType] = useState(CameraType.back);
    const [permission, requestPermission] = Camera.useCameraPermissions();

    const [modalVisible, setModalVisible] = useState(false);
    const [qrVisible, setQrVisible] = useState(false);

    const [scanned, setScaned] = useState(false);
    const [data, setData] = useState(null);

    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const toggleDatePicker = () => {
        setShowPicker(!showPicker);
    }

    const onChangeDate = (event, selectedDate) => {
        if(type == "set"){
            const currentDate = selectedDate;
            setDate(currentDate);
        }
        else{
            toggleDatePicker();
        }
    };

    // if (!permission.granted)
    // requestPermission();

    if (!permission)
        requestPermission();

    function toggleCameraType() {
        setType(current => (current === CameraType.back ? CameraType.front : CameraType.back));
    }

    return (
        <>
            {
                qrVisible ?
                    <Modal visible={qrVisible} animationType='slide' >
                        <View style={modalstyles.container}>
                            <Text style={modalstyles.title}>Scannerizza il Qr Code</Text>
                            {
                                scanned ?
                                    <View>
                                        <Text style={modalstyles.paragraph}>Scanned Data: {data}</Text>
                                        {
                                            showPicker ?
                                            <DateTimePicker
                                                mode="datetime"
                                                value={date}
                                                display="default" 
                                                onChange={onChangeDate}
                                                />
                                            :
                                            <TouchableNativeFeedback onPress={() => setShowPicker(true)}>
                                                <View style={modalstyles.button}>
                                                    <Text style={modalstyles.buttonText}>
                                                        Seleziona data e ora
                                                    </Text>
                                                </View>
                                            </TouchableNativeFeedback>
                                        }
                                    </View>
                                    :
                                    <Camera style={styles.camera} type={type}
                                        barCodeScannerSettings={{
                                            barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
                                        }}

                                        onBarCodeScanned={({ type, data }) => {
                                            console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
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
                <Text style={{ fontFamily: font.montserratBold, fontSize: 25, color: "white", marginLeft: 20 }}>Tickets</Text>
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
        fontFamily: font.montserrat,
        fontSize: 12,
        color: "#000",
    },
    paragraph: {
        fontFamily: font.montserrat,
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

});


const modalstyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "space-around",
    },
    title: {
        fontFamily: font.montserratBold,
        fontSize: 25,
        color: color.secondary,
    },
    subtitle: {
        fontFamily: font.montserrat,
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
        fontFamily: font.montserrat,
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
        fontFamily: font.montserrat,
        fontSize: 20,
        color: "white",
    },
});