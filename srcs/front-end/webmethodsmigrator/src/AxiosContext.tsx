// src/AxiosContext.tsx

import React, { createContext, useContext, ReactNode } from 'react';
import axios, { AxiosInstance } from 'axios';

const AxiosContext = createContext<AxiosInstance | undefined>(undefined);

interface AxiosProviderProps {
  children: ReactNode;
}

export const AxiosProvider: React.FC<AxiosProviderProps> = ({ children }) => {
  // Determine the base URL based on the environment
  // Assuming the front-end and back-end are in the same Docker network
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000'; // 

  // Create the Axios instance with baseURL
  const axiosInstance = axios.create({
    baseURL: baseURL,
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

export const useAxios = (): AxiosInstance => {
  const context = useContext(AxiosContext);
  if (!context) {
    throw new Error('useAxios must be used within an AxiosProvider');
  }
  return context;
};
