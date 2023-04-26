import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { getStringDataWithStateReverse, storeStringData, getStringDataWithState, getData } from '../shared/data/localdata';
import LoginModal from "../screens/Modals/login";


export default function WhitePage({ navigation }) {
    let [openLogin, setOpenLogin] = React.useState(null);
    let [user, setUser] = React.useState(null);

    useEffect(() => {
        getStringDataWithState('user', user, setUser);
        verifyLog();
    }, [])
    
    const verifyLog = async ()  => {
        let data = await getData("user");

        if (data != null && JSON.stringify(data) != '{"_h":0,"_i":0,"_j":null,"_k":null}' && data != false && data != '') {
            navigation.navigate("Home");
        } else {
            setOpenLogin(true);
            storeStringData('openLogin', 'false');
        }
    }

    return (
        <>
            <LoginModal navigation={navigation} visibility={openLogin} setVisibility={setOpenLogin} />
            <View style={styles.container}>
            </View>
        </>
    )
}

let styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    }
})