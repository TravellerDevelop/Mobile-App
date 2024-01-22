import React, { useState } from "react";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { font } from "../../global/globalVariable";
import { storeStringData } from "../../shared/data/localdata";
import InitialModalContent from "./initialModalContent";

export default function InitialModal({ visibility, setVisibility }) {
    let [num, setNum] = useState(0);
    let pages = 2;

    if (num == pages) {
        setVisibility(false);
    }

    const finish = () => {
        storeStringData('initialModal', true.toString());
        setVisibility(false);
    }

    return (
        <Modal visible={visibility} animationType='slide' >
            <View style={modalstyles.container}>
                <InitialModalContent num={num} setNum={setNum} />
                <View style={{ flexDirection: "row", marginTop: 20, position: "absolute", bottom: 20, width: "100%", justifyContent: "space-between" }}>
                    <TouchableOpacity onPress={() => setNum(num - 1)} style={{ marginLeft: 40 }}>
                        <Image source={require('../../assets/image/icona-freccia-left.png')} style={[{ width: 30, height: 30 }, (num == 0) ? { display: "none" } : { display: "flex" }]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={
                            () => (!num == pages - 1)
                                ? setNum(num + 1)
                                : finish()
                        } style={{ marginRight: 40 }}>
                        {(num == pages - 1) ? <Text style={{ fontFamily: font.montserratBold, fontSize: 20, color: "white" }}>Iniziamo!</Text> : <Image source={require('../../assets/image/icona-freccia-right.png')} style={{ width: 30, height: 30 }} />}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

const modalstyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#4960FF",
        alignItems: "center",
        justifyContent: "center",
    },
});

