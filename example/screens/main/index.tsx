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

interface ConnectPrinterRequest {
  attempts: number;
}
const connectPrinter = async ({ attempts }: ConnectPrinterRequest) => {
  try {
    await EpsonSDK.connect();
  } catch (e) {
    if (attempts > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await connectPrinter({ attempts: attempts - 1 });
    } else {
      throw e;
    }
    // throw e;
  }
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
    EpsonSDK.disconnect()
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
    if (selectedPrinter) {
      try {
        if (!EpsonSDK.printerIsSetup()) {
          throw new Error("Printer is not setup");
        }
        if (__DEV__) {
          console.log("🖨️ Printer is ready");
        }

        // Before printing, clear the buffer
        if (__DEV__) {
          console.log("🖨️ Will clear the buffer");
        }
        await EpsonSDK.clearBuffer();
        if (__DEV__) {
          console.log("🖨️ Buffer is cleared");
        }

        if (!EpsonSDK.printerIsConnected()) {
          if (__DEV__) {
            console.log("🖨️ Printer not connected, attempting to connect");
          }
          await connectPrinter({ attempts: 3 });
          if (__DEV__) {
            console.log("🖨️ Printer connected");
          }
        } else {
          if (__DEV__) {
            console.log("🖨️ Printer already connected");
          }
        }

        await EpsonSDK.addTextAlign("center");
        await EpsonSDK.addImage({
          base64: Image.base64,
          width: Image.width,
          height: Image.height,
        });
        await EpsonSDK.addCut();
        await EpsonSDK.sendData();

        if (__DEV__) {
          console.log("🖨️ Data sent");
        }
      } catch (e) {
        if (__DEV__) {
          console.error(e);
        }
        showError(e as Error);

        // await EpsonSDK.clearBuffer();
        // await EpsonSDK.disconnect();

        const message = (e as Error | undefined)?.message;
        switch (message) {
          case "ERR_IN_USE":
            // Printer is in use
            // Re-setup the printer
            if (__DEV__) {
              console.log("🖨️ Printer is in use, re-setting up");
            }
            setSelectedPrinter(selectedPrinter);
            break;
          default:
            break;
        }
      }
    }
  }, [selectedPrinter]);

  useEffect(() => {
    navigation.setOptions({
      title: "Epson ePOS SDK",
    });
  }, [discovering]);

  useEffect(() => {
    if (selectedPrinter && selectedPrinter.target && selectedPrinter.name) {
      // Re-setup the SDK to ensure it's ready to print
      const name = selectedPrinter.name as EpsonSDK.PrinterSeriesName;
      const seriesName = EpsonSDK.getPrinterSeriesByName(name);

      EpsonSDK.setTimeout(5000);
      EpsonSDK.setupPrinter({
        target: selectedPrinter.target,
        seriesName,
        language: "LANG_EN",
      })
        .then(() => {
          if (__DEV__) {
            console.log("🖨️ Printer setup");
          }
        })
        .catch((e) => {
          if (__DEV__) {
            console.error(e);
          }
          showError(e as Error);
        });
    }
  }, [selectedPrinter]);

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={styles.container}>
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
      <View style={{ width: "100%", paddingBottom: 5 }}>
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
