import { useNavigation } from "@react-navigation/native";
import { FC, useCallback, useEffect, useState } from "react";
import * as React from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  View,
  ListRenderItem,
} from "react-native";
import * as EpsonSDK from "react-native-epson-epos";

import PrinterItem from "./components/printerItem";
import { Image } from "./image";

const showError = (error: Error) => {
  Alert.alert("Error", error.message);
};

const MainScreen: FC = () => {
  const navigation = useNavigation();
  const [printers, setPrinters] = useState<EpsonSDK.Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<
    EpsonSDK.Printer | undefined
  >();
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: "Epson ePOS SDK",
      headerRight: () => (
        <Button disabled={discovering} title="Discover" onPress={discover} />
      ),
    });
  }, [discovering]);

  const deselectPrinter = useCallback(() => {
    setSelectedPrinter(undefined);
    EpsonSDK.disconnectPrinter()
      .then(() => {
        if (__DEV__) {
          console.log("Disconnected from printer!");
        }
      })
      .catch((e) => {
        if (__DEV__) {
          console.error(e);
        }
        showError(e as Error);
      });
  }, []);

  const discover = useCallback(async () => {
    try {
      setDiscovering(true);
      deselectPrinter();
      setPrinters([]);
      const discoveredPrinters = await EpsonSDK.discoverPrinters();
      setPrinters(discoveredPrinters);
      setDiscovering(false);
    } catch (e) {
      if (__DEV__) {
        console.error(e);
      }
      showError(e as Error);
    }
  }, [deselectPrinter]);

  const renderItem: ListRenderItem<EpsonSDK.Printer> = useCallback(
    ({ item }) => {
      const selected = selectedPrinter?.target === item.target;
      return (
        <PrinterItem
          printer={item}
          selected={selected}
          onPress={() => {
            if (selected) {
              deselectPrinter();
            } else {
              setSelectedPrinter(item);
            }
          }}
        />
      );
    },
    [deselectPrinter, selectedPrinter]
  );

  const printTestPage = useCallback(async () => {
    if (selectedPrinter?.target) {
      try {
        if (!EpsonSDK.printerIsSetup()) {
          // Printer needs to be setup
          await EpsonSDK.setupPrinter({
            target: selectedPrinter.target,
          });
          if (__DEV__) {
            console.log("🖨️ Printer setup");
          }
        }

        if (!EpsonSDK.printerIsConnected()) {
          // Printer needs to be connected
          await EpsonSDK.connectPrinter();
          if (__DEV__) {
            console.log("🖨️ Printer connected");
          }
        }

        await EpsonSDK.printImage({
          base64: Image.base64,
          width: Image.width,
          height: Image.height,
        });
      } catch (e) {
        if (__DEV__) {
          console.error(e);
        }
        showError(e as Error);
      }
    }
  }, [selectedPrinter]);

  return (
    <View style={styles.container}>
      <FlatList
        data={printers}
        renderItem={renderItem}
        keyExtractor={(printer, index) => `${index}-${printer.target}`}
        style={{ width: "100%" }}
      />
      <View style={{ width: "100%" }}>
        <Button
          disabled={!selectedPrinter}
          title="Print Test Page"
          onPress={printTestPage}
        />
      </View>
      {/* <Button
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
                      base64: Image.base64,
                      width: Image.width,
                      height: Image.height,
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
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default MainScreen;
