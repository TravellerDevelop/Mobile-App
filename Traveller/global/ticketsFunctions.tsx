import axios from "axios";
import { serverLink } from "./globalVariable";
import { getUserInfo } from "../controllers/userData";
import { storeJsonData } from "../shared/data/localdata";

export default function takeInfo(personalData: any, setIsLoading : (bool: boolean) => void, setData : (data: any) => void, setAusTicket : (data: any) => void) {
    setIsLoading(true);
    personalData = getUserInfo();
    axios.get(serverLink + "api/tickets/take?userid=" + personalData._id)
        .then(res => {
            setData(res.data);
            setAusTicket(res.data);
            setIsLoading(false);
            storeJsonData("tickets", res.data);
        }).catch(err => {
            console.log(err);
            setIsLoading(false);
        })
}