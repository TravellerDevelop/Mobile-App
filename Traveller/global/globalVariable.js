import { useState } from "react";

export function userInfo(){
    const [user, setUser] = useState({
        name: "Pietro",
        surname: "Bossolasco",
        username: "pietrobossolasco",
        email: "",
        password: ""
    });

    return user;
}


export const color = {
    primary: '#4960FF',
    secondary: '#4900FF',
    third: '#3582DB',
}

export const font = {
    montserrat: "montserrat-regular",
    montserratLight: "montserrat-light",
    montserratBold: "montserrat-bold",
}

export const actualPage = "home";

// In produzione cambiare il valore a 15
// In sviluppo cambiare il valore a 40
export const paddingTopPage = 15;