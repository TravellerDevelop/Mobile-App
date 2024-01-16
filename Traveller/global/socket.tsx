import { io } from "socket.io-client";
import { serverLink } from "./globalVariable";
import { getUserInfo } from "../controllers/userData";

let socket: any = null;
let actualRoom: string = '';

export function startSocket() {
    socket = io(serverLink);
    socket.on("connect", () => {
        console.log("connected to socket: ", socket.id);
    });
}

export function joinTravelSocket(travelId: string) {
    if (socket) {
        if(actualRoom != ''){
            leaveTravelSocket();
        }
        
        socket.emit("joinTravel", {
            userid: (getUserInfo() as any)._id,
            travelId: travelId
        });
        actualRoom = 'travel=' + travelId;
    }
}

export function leaveTravelSocket() {
    if (actualRoom != '') {
        socket.emit("leaveTravel", {
            travel: actualRoom
        })
        actualRoom = '';
    }
}

export function takeSocket() {
    return socket;
}