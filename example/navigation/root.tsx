import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainScreen from "../screens/main";

export type RootStackParamList = {
  Main: undefined;
};

const RootStack = createNativeStackNavigator();
const RootNavigator = () => {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="Main"
        component={MainScreen}
        options={{ headerShown: true }}
      />
    </RootStack.Navigator>
  );
};
export default RootNavigator;
