import React from "react";
import { View, Text, Image, Modal, TouchableOpacity } from "react-native";
import { color, font } from "../../global/globalVariable";

export default function EditTravel({ item, visible, setVisible }) {

    return (
        <Modal animationType="slide" visible={visible}>
            <TouchableOpacity style={{ position: "absolute", top: 20, right: 20 }} onPress={() => { setVisible(false) }}>
                <Text style={{ color: color.primary, fontSize: 18, fontFamily: font.montserrat }}>Annulla</Text>
            </TouchableOpacity>
        </Modal>
    )

}