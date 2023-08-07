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
import { SafeAreaView } from "react-native-safe-area-context";

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

  const discover = useCallback(
    async (portType: EpsonSDK.PrinterPortType) => {
      try {
        setDiscovering(true);
        deselectPrinter();
        setPrinters([]);
        const discoveredPrinters = await EpsonSDK.discoverPrinters(portType);
        setPrinters(discoveredPrinters);
        setDiscovering(false);
      } catch (e) {
        if (__DEV__) {
          console.error(e);
        }
        showError(e as Error);
      }
    },
    [deselectPrinter]
  );

  const discoverViaBluetooth = useCallback(async () => {
    const onError = (error: Error) => {
      if (__DEV__) {
        console.error(error);
      }
      setPrinters([]);
      setDiscovering(false);
      showError(error);
    };

    try {
      setDiscovering(true);
      deselectPrinter();
      setPrinters([]);

      // const pairingResponse = await EpsonSDK.pairingBluetoothPrinter();
      // if (pairingResponse.status !== "BLUETOOTH_SUCCESS") {
      //   if (__DEV__) {
      //     console.error(
      //       `Discover bluetooth printers failed: ${pairingResponse.reason}`
      //     );
      //   }
      // }

      const discoveredPrinters = await EpsonSDK.discoverPrinters("BLUETOOTH");
      setPrinters(discoveredPrinters);
      setDiscovering(false);
    } catch (e) {
      onError(e as Error);
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

  useEffect(() => {
    navigation.setOptions({
      title: "Epson ePOS SDK",
    });
  }, [discovering]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={printers}
        renderItem={renderItem}
        keyExtractor={(printer, index) => `${index}-${printer.target}`}
        style={{ width: "100%" }}
        ListHeaderComponent={() => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              padding: 10,
              backgroundColor: "orange",
            }}
          >
            <Button
              disabled={discovering}
              title="Bluetooth"
              onPress={discoverViaBluetooth}
            />
            <View style={{ width: 5 }} />
            <Button
              disabled={discovering}
              title="Lan"
              onPress={() => {
                discover("LAN");
              }}
            />
            <View style={{ width: 5 }} />
            <Button
              disabled={discovering}
              title="USB"
              onPress={() => {
                discover("USB");
              }}
            />
          </View>
        )}
      />
      <View style={{ width: "100%" }}>
        <Button
          disabled={!selectedPrinter}
          title="Print Test Page"
          onPress={printTestPage}
        />
      </View>
    </SafeAreaView>
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
