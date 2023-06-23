import { FC } from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
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
              console.log("🖨️ did receive printers:", printers);

              let str: string = "";
              printers.forEach((printer) => {
                str += `name:${printer.name}, target: ${printer.target}\n\n`;
              });

              Alert.alert("Discovered printers", str);
            })
            .catch((error) => {
              console.warn(error);
              Alert.alert("Error", error.message);
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
