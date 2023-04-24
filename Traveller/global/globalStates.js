import React, { createContext, useState } from 'react';

export const UserInfo = createContext();

export const GlobalStateProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState({});

  return (
    <UserInfo.Provider value={[userInfo, setUserInfo]}>
      {children}
    </UserInfo.Provider>
  );
};
