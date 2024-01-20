import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeStringData = async (key: string, value: string) => {
    try {
        await AsyncStorage.setItem(key, value);
        return true;
    } catch (e) {
        return false;
    }
}

export const storeJsonData = async (key: string, value: any) => {
    try {
        const jsonValue = JSON.stringify(value)
        await AsyncStorage.setItem(key, jsonValue)
        return true;
    } catch (e) {
        return false;
    }
}

export const getStringData = async (key: string) => {
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

export const getData = async (key: string) => {
    try {
        const jsonValue = await AsyncStorage.getItem(key)
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        return false;
    }
}

export const getStringDataWithState = async (key: string, state: any, setState: (data: any) => void) => {
    try {
        const value = await AsyncStorage.getItem(key)
        if (value != null && value != undefined && value != '[]' && value != 'false' && !value){
            setState(value);
        }
        else{
            setState(false);
        }
    } catch (e) {
        setState(false);
    }
}

export const getStringDataWithStateReverse = async (key: string, state: any, setState: (data: any) => void) => {
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
        setState(true);
    }
}