import axios from "axios";
import { serverLink } from "./global/globalVariable";

export function verifyOnlyConnection() {
  return new Promise((resolve, reject) => {
    axios({
      method: "get",
      url: serverLink + "api/verifyConnection",
      timeout: 15000,
    })
      .then((response) => {
        if (response.status === 200) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        resolve(false);
      });
  });
}

export function verifyAppVersion() {
    return new Promise((resolve, reject) => {
      axios({
        method: "get",
        url: serverLink + "api/takeVersion",
        timeout: 15000,
      })
        .then((response) => {
          if (response.status === 200) {
            resolve(response.data[0].AppVersion);
          } else {
            resolve(response.data);
          }
        })
        .catch((error) => {
          resolve(error.message);
        });
    });
  }
  