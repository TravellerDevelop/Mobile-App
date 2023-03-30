import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeStringData = async (key, value) => {
    
    try {
        await AsyncStorage.setItem(key, value);
        console.log(value) 
        return true;
    } catch (e) {
        return false;
    }
}

export const storeJsonData = async (key, value) => {
    try {
        const jsonValue = JSON.stringify(value)
        await AsyncStorage.setItem(key, jsonValue)
        return true;
    } catch (e) {
        return false;
    }
}

export const getStringData = async (key) => {
    try {
        const value = await AsyncStorage.getItem(key)
        if (value != null && value != undefined){
            return value;
        }
        else{
            return false;
        }
    } catch (e) {
        return false;
    }
}

export const getData = async (key) => {
    try {
        const jsonValue = await AsyncStorage.getItem(key)
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        return false;
    }
}

export const getStringDataWithState = async (key, state, setState) => {
    try {
        const value = await AsyncStorage.getItem(key)
        if (value != null && value != undefined){
            setState(value);
        }
        else{
            setState(false);
        }
    } catch (e) {
        setState(false);
    }
}

export const getStringDataWithStateReverse = async (key, state, setState) => {
    try {
        const value = await AsyncStorage.getItem(key)
        if (value != null && value != undefined){
            let aus = !value;
            setState(aus);
        }
        else{
            setState(true);
        }
    } catch (e) {
        console.log(e)
        setState(true);
    }
}