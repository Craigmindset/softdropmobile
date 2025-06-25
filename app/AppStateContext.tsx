import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

// Define the shape of your global app state
const initialState = {
  isSenderLoggedIn: false,
  isCarrierLoggedIn: false,
  homeState: null,
  carrierHomeState: null,
  findCarrierState: null,
};

const AppStateContext = createContext({
  state: initialState,
  setState: (_: any) => {},
});

export const useAppStateContext = () => useContext(AppStateContext);

export const AppStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState(initialState);
  const appState = useRef(AppState.currentState);

  // Restore state on mount
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("globalAppState");
      if (saved) setState(JSON.parse(saved));
    })();
  }, []);

  // Persist state on background
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (appState.current.match(/active/) && nextAppState === "background") {
          await AsyncStorage.setItem("globalAppState", JSON.stringify(state));
        }
        appState.current = nextAppState;
      }
    );
    return () => subscription.remove();
  }, [state]);

  return (
    <AppStateContext.Provider value={{ state, setState }}>
      {children}
    </AppStateContext.Provider>
  );
};
