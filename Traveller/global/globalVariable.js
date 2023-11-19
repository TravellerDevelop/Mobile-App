export const color = {
    primary: '#4960FF',
    secondary: '#4900FF',
    third: '#3582DB',
}

export const font = {
    montserrat: "montserrat-regular",
    montserratLight: "montserrat-light",
    montserratBold: "montserrat-bold",
    montserratThin: "montserrat-thin",
    text: "rubik-regular",
    text_bold: "rubik-bold",
    text_light: "rubik-light",
    text_black: "rubik-black",
}   

const myIp = "192.168.1.115";

export const appVersion = "1.0.2";
export const paddingTopPage = 15;
export const ISDEBUG = true;
export const ISBETA = true;
export const serverLink = ISDEBUG ? "http://" + myIp + ":1337/" : "https://traveller-ttze.onrender.com/";

export let statusBarColor = "#4960FF";

export function setStatusBarColor(color){
    statusBarColor = color;
}

/* ISTRUZIONI */
// Prima di buildare
// - Mettere is debug false altrementi non raggiungerà il server
// - Impostare correttamente ISBETA