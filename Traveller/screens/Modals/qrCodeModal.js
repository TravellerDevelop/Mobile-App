import React from "react";
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function QrCodeModal({ data, visibility, setVisibility }) {
    return (
        <Modal visible={visibility} animationType="slide" transparent={true}>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => setVisibility(false)} style={{position: "absolute", bottom: 20, width: "100%" }} >
                    <Text style={{ color: "#FFF", fontSize: 20, fontFamily: "montserrat-bold", width: "100%", textAlign: "center" }}>Chiudi</Text>
                </TouchableOpacity>

                <View style={styles.qrContainer} > 
                    <QRCode
                        value={data}
                        size={250}
                    />
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
    },
    qrContainer: {
        backgroundColor: "#FFF",
        padding: 20,
        borderRadius: 10,
    }
});