
import React, { createContext, useContext } from 'react';
import axios from 'axios';

const AxiosContext = createContext(axios);

const AxiosProvider: React.FC = ({ children }) => {
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:4000',
  });

  // Optional: Add interceptors to handle request/response or errors globally
  axiosInstance.interceptors.request.use(
    (config) => {
      // You can add additional headers or modify the config here
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Handle errors globally
      return Promise.reject(error);
    }
  );

  return (
    <AxiosContext.Provider value={axiosInstance}>
      {children}
    </AxiosContext.Provider>
  );
};

export const useAxios = () => {
  return useContext(AxiosContext);
};

export default AxiosProvider;
