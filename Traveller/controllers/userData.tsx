interface UserInfo {
    _id: string,
    email: string,
    name: string,
    surname: string,
    password: string,
    username: string,
    notifToken: string[],
}

let userInfo: UserInfo;

export const getUserInfo = () => {
    return userInfo;
}

export const setUserInfo = (data: UserInfo) => {
    userInfo = data;
}
