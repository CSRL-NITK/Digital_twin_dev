import React, { createContext, useContext, useState, useCallback } from 'react';

interface HydroStateContextType {
  isPumpOn: boolean;
  togglePump: (state?: boolean) => void;
  flowRate: number;
  flowStatus: string;
  pressure: number;
  efficiency: number;
}

const HydroStateContext = createContext<HydroStateContextType>({
  isPumpOn: true,
  togglePump: () => {},
  flowRate: 14.6,
  flowStatus: 'Normal',
  pressure: 1.8,
  efficiency: 83,
});

export const HydroStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPumpOn, setIsPumpOn] = useState<boolean>(true);

  const togglePump = useCallback((state?: boolean) => {
    setIsPumpOn((prev) => (state !== undefined ? state : !prev));
  }, []);

  const flowRate = isPumpOn ? 14.6 : 0.0;
  const flowStatus = isPumpOn ? 'Normal' : 'Offline';
  const pressure = isPumpOn ? 1.8 : 0.0;
  const efficiency = isPumpOn ? 83 : 0;

  return (
    <HydroStateContext.Provider
      value={{
        isPumpOn,
        togglePump,
        flowRate,
        flowStatus,
        pressure,
        efficiency,
      }}
    >
      {children}
    </HydroStateContext.Provider>
  );
};

export const useHydroState = () => useContext(HydroStateContext);
