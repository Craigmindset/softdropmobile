import React, { createContext, useContext, useState } from "react";

type DeliveryRequest = any;
type DeliveryRequestContextType = {
  request: DeliveryRequest | null;
  setRequest: (request: DeliveryRequest) => void;
};

const DeliveryRequestContext = createContext<DeliveryRequestContextType>({
  request: null,
  setRequest: () => {},
});

export const DeliveryRequestProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [request, setRequest] = useState<DeliveryRequest | null>(null);
  return (
    <DeliveryRequestContext.Provider value={{ request, setRequest }}>
      {children}
    </DeliveryRequestContext.Provider>
  );
};

export const useDeliveryRequest = () => useContext(DeliveryRequestContext);

export default DeliveryRequestProvider;
