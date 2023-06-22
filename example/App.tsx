import { FC } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import * as ReactNativeEpsonEpos from "react-native-epson-epos";

const App: FC = () => {
  return (
    <View style={styles.container}>
      <Text>{ReactNativeEpsonEpos.hello()}</Text>
      <Button
        title="Discover printers"
        onPress={() => {
          ReactNativeEpsonEpos.discoverPrinters()
            .then((printers) => {
              console.log(printers);
            })
            .catch((error) => {
              console.warn(error);
            });
        }}
      />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
