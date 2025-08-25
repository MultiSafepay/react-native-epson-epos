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
  TextInput,
  Text,
  TouchableOpacity,
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
  }
};

const MainScreen: FC = () => {
  const navigation = useNavigation();
  const [printers, setPrinters] = useState<EpsonSDK.Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<
    EpsonSDK.Printer | undefined
  >();
  const [discovering, setDiscovering] = useState(false);
  const [rawdataValue, setRawdataValue] = useState("");
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);

  // Phase 2: Enhanced connection state management
  const [connectionState, setConnectionState] = useState<{
    isConnected: boolean;
    isConnecting: boolean;
    lastError: string | null;
    lastConnectTime: number | null;
    operationCount: number;
    lastOperationTime: number | null;
  }>({
    isConnected: false,
    isConnecting: false,
    lastError: null,
    lastConnectTime: null,
    operationCount: 0,
    lastOperationTime: null,
  });

  // Phase 2: Enhanced connection management with state tracking
  const connectPrinterWithState = useCallback(
    async ({ attempts }: ConnectPrinterRequest) => {
      if (connectionState.isConnecting) {
        if (__DEV__) {
          console.log("🖨️ Connection already in progress, waiting...");
        }
        // Wait for existing connection attempt
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (connectionState.isConnected) return;
      }

      setConnectionState((prev) => ({
        ...prev,
        isConnecting: true,
        lastError: null,
      }));

      try {
        // Check if we're already connected and connection is recent (within 30 seconds)
        const now = Date.now();
        const isRecentConnection =
          connectionState.lastConnectTime &&
          now - connectionState.lastConnectTime < 30000;

        if (
          connectionState.isConnected &&
          isRecentConnection &&
          EpsonSDK.printerIsConnected()
        ) {
          if (__DEV__) {
            console.log("🖨️ Using existing connection");
          }
          setConnectionState((prev) => ({ ...prev, isConnecting: false }));
          return;
        }

        if (__DEV__) {
          console.log("🖨️ Establishing new connection");
        }

        await EpsonSDK.connect();

        setConnectionState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          lastError: null,
          lastConnectTime: now,
        }));

        if (__DEV__) {
          console.log("🖨️ Connection established successfully");
        }
      } catch (e) {
        const errorMessage = (e as Error).message;
        setConnectionState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          lastError: errorMessage,
          lastConnectTime: null,
        }));

        // Handle ERR_ILLEGAL specifically - don't retry, fix the issue
        if (
          errorMessage.includes("ERR_ILLEGAL") ||
          errorMessage.includes("illegal")
        ) {
          if (__DEV__) {
            console.log(
              "🖨️ ERR_ILLEGAL detected - attempting to fix state immediately"
            );
          }

          try {
            // Force complete disconnection first
            await EpsonSDK.disconnect();
            if (__DEV__) {
              console.log("🖨️ Forced disconnection completed");
            }
          } catch (disconnectError) {
            if (__DEV__) {
              console.log(
                "🖨️ Disconnect during ERR_ILLEGAL recovery failed (expected)"
              );
            }
          }

          // Wait longer to ensure clean state
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Re-setup the printer if we have a selected printer
          if (
            selectedPrinter &&
            selectedPrinter.target &&
            selectedPrinter.name
          ) {
            try {
              if (__DEV__) {
                console.log("🖨️ Re-setting up printer after ERR_ILLEGAL");
              }

              const name = selectedPrinter.name as EpsonSDK.PrinterSeriesName;
              const seriesName = EpsonSDK.getPrinterSeriesByName(name);

              await EpsonSDK.setupPrinter({
                target: selectedPrinter.target,
                seriesName,
                language: "LANG_EN",
              });

              if (__DEV__) {
                console.log(
                  "🖨️ Printer re-setup completed, attempting fresh connection"
                );
              }

              // Now try one fresh connection
              await EpsonSDK.connect();

              setConnectionState((prev) => ({
                ...prev,
                isConnected: true,
                isConnecting: false,
                lastError: null,
                lastConnectTime: Date.now(),
              }));

              if (__DEV__) {
                console.log("🖨️ ERR_ILLEGAL recovery successful");
              }
              return;
            } catch (recoveryError) {
              if (__DEV__) {
                console.error("🖨️ ERR_ILLEGAL recovery failed:", recoveryError);
              }
              setConnectionState((prev) => ({
                ...prev,
                lastError: `ERR_ILLEGAL recovery failed: ${(recoveryError as Error).message}`,
              }));
              throw new Error(
                `ERR_ILLEGAL detected and recovery failed. Please try selecting the printer again.`
              );
            }
          } else {
            throw new Error(
              "ERR_ILLEGAL detected. Please select the printer again."
            );
          }
        }

        // For other errors, use normal retry logic
        if (attempts > 0) {
          if (__DEV__) {
            console.log(
              `🖨️ Connection failed, retrying... ${attempts} attempts left`
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await connectPrinterWithState({ attempts: attempts - 1 });
        } else {
          if (__DEV__) {
            console.error("🖨️ All connection attempts failed:", errorMessage);
          }
          throw e;
        }
      }
    },
    [connectionState, selectedPrinter]
  );

  // Phase 2: Enhanced disconnect with state management
  const disconnectPrinterWithState = useCallback(async () => {
    try {
      await EpsonSDK.disconnect();
      setConnectionState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        lastError: null,
        lastConnectTime: null,
      }));
      if (__DEV__) {
        console.log("🖨️ Disconnected successfully");
      }
    } catch (error) {
      // Force state reset even if disconnect fails
      setConnectionState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        lastError: (error as Error).message,
        lastConnectTime: null,
      }));
      if (__DEV__) {
        console.warn("🖨️ Disconnect had issues, but state reset:", error);
      }
    }
  }, []);

  const sendRawCommandSafely = useCallback(
    async (
      commands: number[],
      description: string = "raw command",
      options: {
        forceNewConnection?: boolean;
        timeout?: number;
      } = {}
    ) => {
      const { forceNewConnection = false, timeout = 10000 } = options;

      try {
        if (__DEV__) {
          console.log(`🖨️ Sending ${description} - checking connection`);
        }

        // Phase 2: Track operation performance
        const operationStartTime = Date.now();
        setConnectionState((prev) => ({
          ...prev,
          operationCount: prev.operationCount + 1,
          lastOperationTime: operationStartTime,
        }));

        // Phase 2: Smart connection management
        if (forceNewConnection || !connectionState.isConnected) {
          await connectPrinterWithState({ attempts: 3 });
        } else {
          // Validate existing connection
          try {
            if (!EpsonSDK.printerIsConnected()) {
              if (__DEV__) {
                console.log("🖨️ Connection lost, reconnecting...");
              }
              await connectPrinterWithState({ attempts: 3 });
            }
          } catch (validationError) {
            if (__DEV__) {
              console.log(
                "🖨️ Connection validation failed, establishing new connection"
              );
            }
            await connectPrinterWithState({ attempts: 3 });
          }
        }

        await EpsonSDK.clearBuffer();

        if (__DEV__) {
          console.log(
            `🖨️ Buffer cleared, sending ${description} (${commands.length} bytes)`
          );
        }

        // Phase 2: Add timeout handling
        const sendPromise = EpsonSDK.sendRawData(commands);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(new Error(`${description} timed out after ${timeout}ms`)),
            timeout
          )
        );

        await Promise.race([sendPromise, timeoutPromise]);

        const operationDuration = Date.now() - operationStartTime;
        if (__DEV__) {
          console.log(
            `🖨️ ${description} sent successfully (${operationDuration}ms)`
          );
        }

        // Phase 2: Controlled disconnection - don't always disconnect for better performance
        if (forceNewConnection) {
          await disconnectPrinterWithState();
          // Small delay to ensure clean disconnection
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        if (__DEV__) {
          console.log(`🖨️ ${description} completed`);
        }
      } catch (error) {
        if (__DEV__) {
          console.error(`🖨️ Error sending ${description}`, error);
        }

        // Phase 2: Enhanced error recovery
        try {
          await disconnectPrinterWithState();
          if (__DEV__) {
            console.log("🖨️ Connection reset during error recovery");
          }
        } catch (disconnectError) {
          if (__DEV__) {
            console.warn(
              "🖨️ Could not disconnect during error recovery",
              disconnectError
            );
          }
        }

        throw error;
      }
    },
    [connectionState, connectPrinterWithState, disconnectPrinterWithState]
  );

  const deselectPrinter = useCallback(() => {
    setSelectedPrinter(undefined);
    disconnectPrinterWithState()
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
  }, [disconnectPrinterWithState]);

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
    if (selectedPrinter && !isOperationInProgress) {
      setIsOperationInProgress(true);
      setCurrentOperation("Printing Test Page");

      try {
        if (!EpsonSDK.printerIsSetup()) {
          throw new Error("Printer is not setup");
        }
        if (__DEV__) {
          console.log("🖨️ Printer is ready");
        }

        // Phase 2: Enhanced connection management for regular printing
        if (__DEV__) {
          console.log("🖨️ Checking connection state...");
        }

        // Use enhanced connection management
        await connectPrinterWithState({ attempts: 3 });

        // Before printing, clear the buffer
        if (__DEV__) {
          console.log("🖨️ Will clear the buffer");
        }
        await EpsonSDK.clearBuffer();
        if (__DEV__) {
          console.log("🖨️ Buffer is cleared");
        }

        await EpsonSDK.addTextAlign("center");
        // Print a test image
        // await EpsonSDK.addImage({
        //   base64: Image.base64,
        //   width: Image.width,
        //   height: Image.height,
        // });

        // Print a test text
        await EpsonSDK.addText("Epson ePOS SDK Test Page\n");
        await EpsonSDK.addFeedLine(1);

        await EpsonSDK.addCut();
        await EpsonSDK.sendData();

        if (__DEV__) {
          console.log("🖨️ Data sent successfully");
        }
      } catch (e) {
        if (__DEV__) {
          console.error(e);
        }
        showError(e as Error);

        // Phase 2: Enhanced error recovery
        const message = (e as Error | undefined)?.message;
        switch (message) {
          case "ERR_IN_USE":
          case "did fail to connect":
            // Printer connection issues - reset connection state and retry setup
            if (__DEV__) {
              console.log(
                "🖨️ Connection issue detected, resetting connection state"
              );
            }
            await disconnectPrinterWithState();
            setSelectedPrinter(selectedPrinter);
            break;
          default:
            // For other errors, just ensure clean disconnection
            try {
              await disconnectPrinterWithState();
            } catch (disconnectError) {
              // Ignore disconnect errors
            }
            break;
        }
      } finally {
        setIsOperationInProgress(false);
        setCurrentOperation(null);
      }
    }
  }, [
    selectedPrinter,
    isOperationInProgress,
    connectPrinterWithState,
    disconnectPrinterWithState,
  ]);

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

  // Simplified cash drawer function
  const onOpenCashDrawer = useCallback(async () => {
    // Prevent multiple concurrent operations
    if (isOperationInProgress) {
      if (__DEV__) {
        console.log("🖨️ Cash drawer operation already in progress, skipping");
      }
      return;
    }

    setIsOperationInProgress(true);
    setCurrentOperation("Opening Cash Drawer");

    try {
      // await EpsonSDK.disconnect();
      // await connectPrinterWithState({ attempts: 3 });

      if (!EpsonSDK.printerIsSetup()) {
        throw new Error("Printer is not setup");
      }
      if (__DEV__) {
        console.log("🖨️ Printer is ready");
      }

      // Phase 2: Enhanced connection management for regular printing
      if (__DEV__) {
        console.log("🖨️ Checking connection state...");
      }

      // Use enhanced connection management
      await connectPrinterWithState({ attempts: 3 });

      // Before printing, clear the buffer
      if (__DEV__) {
        console.log("🖨️ Will clear the buffer");
      }
      await EpsonSDK.clearBuffer();

      if (__DEV__) {
        console.log("🖨️ Opening cash drawer...");
      }

      // Use the new raw cash drawer method from the SDK
      await EpsonSDK.openCashDrawerRaw();

      if (__DEV__) {
        console.log("🖨️ Cash drawer opened successfully");
      }
    } catch (error) {
      if (__DEV__) {
        console.error("🖨️ Failed to open cash drawer:", error);
      }
      // Show error to user but don't re-throw to prevent unhandled promise rejection
      showError(error as Error);
      disconnectPrinterWithState();
    } finally {
      // Always re-enable the buttons regardless of success or failure
      setIsOperationInProgress(false);
      setCurrentOperation(null);
    }
  }, [isOperationInProgress, connectPrinterWithState]);

  // Phase 2: Manual connection reset utility
  const resetConnection = useCallback(async () => {
    try {
      if (__DEV__) {
        console.log("🖨️ Manually resetting connection...");
      }
      await disconnectPrinterWithState();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await connectPrinterWithState({ attempts: 3 });
      if (__DEV__) {
        console.log("🖨️ Connection reset completed");
      }
    } catch (error) {
      if (__DEV__) {
        console.error("🖨️ Connection reset failed:", error);
      }
      showError(error as Error);
    }
  }, [connectPrinterWithState, disconnectPrinterWithState]);

  const onSendRawData = useCallback(async () => {
    if (!rawdataValue || isOperationInProgress) return;

    setIsOperationInProgress(true);
    setCurrentOperation("Sending Raw Data");

    try {
      // Parse raw data input
      const notDigitValue = /[\D]/g;
      const arraychar = /[\[\s\]]/g;
      const rawParsedList = rawdataValue
        .replace(arraychar, "") // remove spaces and brackets
        .split(notDigitValue) // split by non-digit characters, comma, dots, etc.
        .map((d) => Number(d)) // convert to numbers, valid decimal and hex values
        .filter((n) => !isNaN(n)); // filter out invalid numbers

      if (rawParsedList.length === 0) {
        throw new Error("No valid numbers found in raw data input");
      }

      await sendRawCommandSafely(rawParsedList, "custom raw data");
    } catch (error) {
      if (__DEV__) {
        console.error("🖨️ Error sending raw data", error);
      }
      showError(error as Error);
    } finally {
      setIsOperationInProgress(false);
      setCurrentOperation(null);
    }
  }, [rawdataValue, isOperationInProgress, sendRawCommandSafely]);
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
              disabled={discovering || isOperationInProgress}
              title="Bluetooth"
              onPress={discoverViaBluetooth}
            />
            <View style={{ width: 5 }} />
            <Button
              disabled={discovering || isOperationInProgress}
              title="Lan"
              onPress={() => {
                discover("LAN");
              }}
            />
            <View style={{ width: 5 }} />
            <Button
              disabled={discovering || isOperationInProgress}
              title="USB"
              onPress={() => {
                discover("USB");
              }}
            />
          </View>
        )}
      />
      <View style={styles.bottomContent}>
        {/* Phase 2: Connection Status Indicator */}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Connection Status:</Text>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: isOperationInProgress
                  ? "#9C27B0" // Purple for any operation in progress
                  : connectionState.isConnected
                    ? "#4CAF50"
                    : connectionState.isConnecting
                      ? "#FF9800"
                      : "#F44336",
              },
            ]}
          >
            <Text style={styles.statusText}>
              {isOperationInProgress
                ? currentOperation || "Operation in Progress..."
                : connectionState.isConnecting
                  ? "Connecting..."
                  : connectionState.isConnected
                    ? "Connected"
                    : "Disconnected"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetConnection}
            disabled={
              !selectedPrinter ||
              connectionState.isConnecting ||
              isOperationInProgress
            }
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <TextInput
            style={[styles.bottomLeft, styles.bottomInput]}
            editable={!isOperationInProgress}
            placeholder="Raw Data"
            value={rawdataValue}
            keyboardType="numeric"
            onChangeText={setRawdataValue}
          />
          <View style={styles.bottomRight}>
            <Button
              disabled={
                !selectedPrinter || !rawdataValue || isOperationInProgress
              }
              title="send Raw Data"
              onPress={onSendRawData}
            />
          </View>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.bottomLeft}>
            <Button
              disabled={!selectedPrinter || isOperationInProgress}
              title={
                isOperationInProgress &&
                currentOperation === "Opening Cash Drawer"
                  ? "Opening..."
                  : "Open Cash Drawer"
              }
              onPress={onOpenCashDrawer}
            />
          </View>
          <View style={styles.bottomRight}>
            <Button
              disabled={!selectedPrinter || isOperationInProgress}
              title={
                isOperationInProgress &&
                currentOperation === "Printing Test Page"
                  ? "Printing..."
                  : "Print Test Page"
              }
              onPress={printTestPage}
            />
          </View>
        </View>

        {/* Phase 2: Error Display */}
        {connectionState.lastError && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>
              Last Error: {connectionState.lastError}
            </Text>
          </View>
        )}
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
  bottomContent: {
    width: "100%",
    paddingBottom: 5,
  },
  bottomInput: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "#040404",
  },
  bottomRow: {
    width: "100%",
    marginTop: 10,
    flexDirection: "row",
  },
  bottomLeft: { flex: 1, marginRight: 5 },
  bottomRight: { flex: 1, marginLeft: 5 },

  // Phase 2: Enhanced UI styles
  statusRow: {
    width: "100%",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 10,
    color: "#333",
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flex: 1,
    alignItems: "center",
  },
  statusText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#607d8b",
    borderRadius: 12,
    marginLeft: 10,
  },
  resetButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  errorRow: {
    width: "100%",
    padding: 10,
    backgroundColor: "#ffebee",
    borderRadius: 5,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    color: "#c62828",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default MainScreen;
