import { NavigationContainer } from "@react-navigation/native";
import { FC } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import RootNavigator from "./root";

const AppRoot: FC = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
export default AppRoot;
