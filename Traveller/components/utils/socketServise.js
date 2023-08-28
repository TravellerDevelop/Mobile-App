import {io} from "socket.io-client";

const URL = "http://localhost:3000";

// , {
    // transports: ["websocket"],
    // jsonp: false,
// }

class WSService {
    initializeSocket = async () => {
        try{
            this.socket = io(URL);

            console.log("connecting");

            this.socket.on("connect", () => {
                console.log("connected");
            });

            this.socket.on("disconnect", () => {
                console.log("disconnected");
            });

            this.socket.on("error", () => {
                console.log("socket error");
            });

        }catch(Exception){
            console.log("Error in initializeSocket: ", Exception);
        }
    }

    emit(event, data = {}){
        try{
            this.socket.emit(event, data);
        }catch(Exception){
            console.log("Error in emit: ", Exception);
        }
    }

    on(event, callback){
        try{
            this.socket.on(event, callback);
        }catch(Exception){
            console.log("Error in on: ", Exception);
        }
    }

    off(event){
        try{
            this.socket.off(event);
        }catch(Exception){
            console.log("Error in off: ", Exception);
        }
    }
}

const socketService = new WSService();
export default socketService;