import React, {useEffect} from "react";
import { StyleSheet, View } from "react-native";
import { getStringDataWithStateReverse, getData, storeStringData, getStringData } from '../shared/data/localdata';
import LoginModal from "../screens/Modals/login";


export default function WhitePage({ navigation }) {
    let [openLogin, setOpenLogin] = React.useState(false);
    let [user, setUser] = React.useState(null);

    useEffect(() => {
        // getStringDataWithStateReverse('openLogin', openLogin, setOpenLogin);
        // console.log("openlogin: " + openLogin);
        setUser(getStringData('user'));
        
        if(user != null)
            console.log("user: " + user)


        if (user != null && user.toString() != '[]' && user != false) {
            console.log(user);
            getStringDataWithStateReverse('openLogin', openLogin, setOpenLogin);

            console.log(openLogin);
            
            if(openLogin != null && !openlogin)
                navigation.navigate("Home");
        }
        else{
            storeStringData('openLogin', 'false');
            setOpenLogin(true);
        }
    }, [])

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