import React from "react";
import { View, Text, Image, Modal, TouchableOpacity, TextInput } from "react-native";
import { color, font, serverLink } from "../../global/globalVariable";
import axios from "axios";

export default function EditTravel({ item, visible, setVisible }) {

    React.useEffect(() => {
        console.log(item);
    }, [])
    let [name, setName] = React.useState(item.name);
    let [description, setDescription] = React.useState(item.description);
    let [budget, setBudget] = React.useState(item.budget);


    return (
        <Modal animationType="slide" visible={visible}>
            <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ color: color.primary, fontSize: 24, fontFamily: font.montserrat, textAlign: "center", marginTop: 50 }}>Modifica viaggio</Text>

                <TouchableOpacity style={{ position: "absolute", top: 20, right: 20 }} onPress={() => { setVisible(false) }}>
                    <Text style={{ color: color.primary, fontSize: 18, fontFamily: font.montserrat }}>Annulla</Text>
                </TouchableOpacity>
                <TextInput placeholder="Titolo" value={name} style={{ borderBottomWidth: 1, borderBottomColor: color.primary, width: "80%", fontSize: 18, fontFamily: font.montserrat, marginBottom: 10, marginTop: 10 }} onChangeText={setName} />
                <TextInput placeholder="Descrizione" value={description} multiline style={{ borderBottomWidth: 1, borderBottomColor: color.primary, width: "80%", fontSize: 18, fontFamily: font.montserrat, marginTop: 30, marginBottom: 10 }} onChangeText={setDescription} />
                <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 }}>
                    <TextInput placeholder="Budget" value={budget.toString()} style={{ borderBottomWidth: 1, borderBottomColor: color.primary, width: "75%", fontSize: 18, fontFamily: font.montserrat, marginTop: 10, marginBottom: 10 }} keyboardType="numeric" onChangeText={(value) => setBudget(parseInt(value))} />
                    <Text style={{ color: color.primary, fontSize: 18, fontFamily: font.montserrat }}>€</Text>
                </View>
                <TouchableOpacity style={{ backgroundColor: color.primary, borderRadius: 10, padding: 10, marginTop: 20, width: "80%" }} onPress={() => {
                    axios.post(serverLink + "api/travel/update", { id: item._id, param: {name: name, description: description, budget: budget} }).then((res) => {
                        setVisible(false)
                    }).catch((err) => {
                        console.log(err);
                    })
                }}>
                    <Text style={{ color: "white", fontSize: 18, fontFamily: font.montserrat, textAlign: "center" }}>Salva</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ backgroundColor: "white", borderRadius: 10, padding: 10, marginTop: 20, width: "80%", borderColor: "red", borderWidth: 1 }} onPress={() => {
                    axios.post(serverLink + "api/travel/close", { id: item._id }).then((res) => {
                        setVisible(false)
                    }).catch((err) => {
                        console.log(err);
                    })
                }}>
                    <Text style={{ color: "red", fontSize: 18, fontFamily: font.montserrat, textAlign: "center" }}>Chiudi viaggio</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ backgroundColor: "red", borderRadius: 10, padding: 10, marginTop: 20, width: "80%" }} onPress={() => {
                    axios.post(serverLink + "api/travel/delete", { id: item._id }).then((res) => {
                        setVisible(false)
                    }).catch((err) => {
                        console.log(err);
                    })
                }}>
                    <Text style={{ color: "white", fontSize: 18, fontFamily: font.montserrat, textAlign: "center" }}>Elimina viaggio</Text>
                </TouchableOpacity>

            </View>
        </Modal>
    )

}