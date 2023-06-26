import { FC, useState } from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
import * as EpsonSDK from "react-native-epson-epos";

import { base64, width, height } from "./image";

const showError = (error: Error) => {
  Alert.alert("Error", error.message);
};

const App: FC = () => {
  const [printers, setPrinters] = useState<EpsonSDK.Printer[]>([]);

  return (
    <View style={styles.container}>
      <Text>{EpsonSDK.hello()}</Text>
      <Button
        title="Discover printers"
        onPress={() => {
          EpsonSDK.discoverPrinters()
            .then((printers) => {
              console.log("🖨️ did receive printers:", printers);

              let str: string = "";
              printers.forEach((printer) => {
                str += `name:${printer.name}, target: ${printer.target}\n\n`;
              });

              Alert.alert("Discovered printers", str);

              // We select just the 1st printer for testing
              const printer = printers[0];
              if (printer && printer.target) {
                EpsonSDK.setupPrinter({
                  target: printer.target,
                })
                  .then(async () => {
                    await EpsonSDK.connectPrinter();
                    console.log("🟢 did connect to printer!");
                    await EpsonSDK.printImage({
                      base64,
                      width,
                      height,
                    });
                    console.log("🏞️ did print image");
                    await EpsonSDK.disconnectPrinter();
                    console.log("🖨 did disconnect from printer!");
                  })
                  .catch((error) => {
                    console.warn(error);
                    showError(error);
                  });
              }
            })
            .catch((error) => {
              console.warn(error);
              showError(error);
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
