import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, Modal, View, TouchableNativeFeedback, Image } from "react-native";
import { font, color } from "../../global/globalVariable";
import QRCode from "react-native-qrcode-svg";
import QrCodeModal from "./qrCodeModal";

export default function TicketModal({ data, visibility, setVisibility }) {
    let [qrVisibility, setQrVisibility] = useState(false);
    let qrValue = "M1BOSSOLASCO/PIETRO    IF5ESD STNTRNFR 0464 263Y016D0060 148>5181W 2263BFR 00000000000002A0000000000000 2                          N"

    return (
        <Modal visible={visibility} animationType="slide" >
            <View style={modalstyles.container}>
                <QrCodeModal
                    data={data.qrdata}
                    visibility={qrVisibility}
                    setVisibility={setQrVisibility}
                />
                <View style={modalstyles.top}>
                    <TouchableOpacity onPress={() => setVisibility(false)} >
                        <Image source={require("../../assets/image/icona-freccia-left.png")} style={{ height: 25, width: 25 }} resizeMode="contain" />
                    </TouchableOpacity>
                    <Text style={{ color: "#FFF", fontSize: 20, fontFamily: font.montserrat, marginLeft: 20 }}>{data.title}</Text>
                </View>
                <Text style={modalstyles.name}>{data.surname} {data.name}</Text>
                <Text style={modalstyles.destination} >Da{data.from.name.split(',')[1]} a{data.to.name.split(',')[1]}</Text>
                <Text style={modalstyles.position}>Modello: {data.aircraft}</Text>
                <Text style={modalstyles.position}>Nr. volo: {data.flightNumber}</Text>
                <View style={modalstyles.row}>
                    <Text style={modalstyles.position}>Data: {new Date(data.date).toLocaleDateString("it-IT", { timeZone: "Europe/Andorra" })}</Text>
                </View>
                <TouchableOpacity style={modalstyles.qrcode} onPress={() => {
                    setQrVisibility(true)
                }}  >
                    <QRCode
                        value={data.qrdata}
                        size={180}
                    />
                </TouchableOpacity>
            </View>
        </Modal>
    )
}

const modalstyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: color.primary,
    },
    name: {
        color: "#FFF",
        fontSize: 22,
        fontFamily: font.montserratBold,
        marginTop: 20,
        marginLeft: 20,
    },
    top: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        height: 50,
        paddingLeft: 20,
    },
    qrcode: {
        height: 220,
        width: 220,
        borderRadius: 20,
        backgroundColor: "#FFF",
        position: "absolute",
        bottom: 40,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
    },
    destination: {
        color: "#FFF",
        fontSize: 18,
        fontFamily: font.montserrat,
        marginTop: 25,
        marginLeft: 20,
        marginRight: 20,
    },
    position: {
        color: "#FFF",
        fontSize: 18,
        fontFamily: font.montserrat,
        marginTop: 25,
        marginLeft: 20,
        marginRight: 20,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    time: {
        color: "#FFF",
        fontSize: 18,
        fontFamily: font.montserrat,
        marginTop: 25,
        marginLeft: 20,
    }
});