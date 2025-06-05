import type { EventSubscription } from "expo-modules-core";
import { Platform, PermissionsAndroid, Permission } from "react-native";

import {
  ChangeEventPayload,
  PrinterLanguage,
  PrinterSeriesName,
  PrinterPortType,
  ReactNativeEpsonEposViewProps,
} from "./ReactNativeEpsonEpos.types";
import ReactNativeEpsonEposModule from "./ReactNativeEpsonEposModule";
import ReactNativeEpsonEposView from "./ReactNativeEpsonEposView";
import { PRINTER_SERIES } from "./constants";
import { getPrinterLanguage, getPrinterSeriesByName } from "./utils";
export type { PrinterPortType, PrinterLanguage, PrinterSeriesName };
export { getPrinterSeriesByName, getPrinterLanguage };

export interface Printer {
  name?: string;
  target?: string;
  ip?: string;
  mac?: string;
  bt?: string;
  usb?: string;
  usbSerialNumber?: string;
}

export function setTimeout(timeout: number) {
  ReactNativeEpsonEposModule.setTimeout(timeout);
}

export async function discoverPrinters(
  portType: PrinterPortType
): Promise<Printer[]> {
  const promise = (await ReactNativeEpsonEposModule.discoverPrinters(
    portType
  )) as Promise<Printer[]>;
  const printers = await promise;
  // MAC address should be unique: remove duplicates
  const uniquePrinters = printers.reduce((acc: Printer[], printer: Printer) => {
    const existingPrinter = acc.find((p) => p.mac === printer.mac);
    if (existingPrinter) {
      if (printer.target && printer.target.startsWith("TCPS:")) {
        existingPrinter.target = printer.target;
      }
    } else {
      acc.push(printer);
    }
    return acc;
  }, []);
  return Promise.resolve(uniquePrinters);
}

export function printerIsConnected(): boolean {
  return ReactNativeEpsonEposModule.printerIsConnected();
}

export function printerIsSetup(): boolean {
  return ReactNativeEpsonEposModule.printerIsSetup();
}

/**
 * Sends raw data (ESC/POS or printer command bytes) to the printer.
 * @param data Array of numbers (bytes) to send to the printer
 * @returns Promise<boolean> Resolves true if sent successfully
 */
export async function sendRawData(data: number[]): Promise<boolean> {
  return ReactNativeEpsonEposModule.sendRawData(data);
}

export async function openCashDrawer(): Promise<boolean> {
  // ESC p 0 25 250
  // const command = [0x1b, 0x70, 0x00, 0x19, 0xfa] as const;
  // return sendRawData(command);
  return ReactNativeEpsonEposModule.openCashDrawer();
}

interface SetupPrinterProps {
  target: string;
  seriesName?: PrinterSeriesName;
  language?: PrinterLanguage;
}
export function setupPrinter({
  target,
  seriesName,
  language,
}: SetupPrinterProps): Promise<boolean> {
  const series = PRINTER_SERIES[seriesName ?? "SERIES_TM_T20"];
  const lang = getPrinterLanguage(language ?? "LANG_EN");
  return ReactNativeEpsonEposModule.setupPrinter(target, series, lang);
}

type BluetoothStatus =
  | "BLUETOOTH_SUCCESS"
  | "BLUETOOTH_ERROR_PARAM"
  | "BLUETOOTH_ERROR_CANCEL"
  | "BLUETOOTH_ERROR_FAILURE"
  | "BLUETOOTH_ERROR_UNSUPPORTED"
  | "BLUETOOTH_ERROR_ILLEGAL_DEVICE"
  | "BLUETOOTH_ERROR_ALREADY_CONNECT"
  | "BLUETOOTH_ERROR_UNKNOWN";

const getBluetoothMessage = (status: BluetoothStatus): string => {
  switch (status) {
    case "BLUETOOTH_ERROR_ALREADY_CONNECT":
      return "The function was executed successfully";
    case "BLUETOOTH_ERROR_CANCEL":
      return "Pairing connection was canceled.";
    case "BLUETOOTH_ERROR_FAILURE":
      return "An unknown error occurred.";
    case "BLUETOOTH_ERROR_ILLEGAL_DEVICE":
      return "An invalid device was selected.";
    case "BLUETOOTH_ERROR_PARAM":
      return "An invalid parameter was passed.";
    case "BLUETOOTH_ERROR_UNKNOWN":
      return "An unexpected error ocurred.";
    case "BLUETOOTH_SUCCESS":
      return "The function was executed successfully.";
    case "BLUETOOTH_ERROR_UNSUPPORTED":
    default:
      return "The function was executed on an unsupported OS.";
  }
};

interface BluetoothPrinterResponse {
  status: BluetoothStatus;
  reason: string;
}

interface PermissionsSettings {
  permission: Permission;
  title: string;
  message: string;
}

export async function pairingBluetoothPrinter(): Promise<BluetoothPrinterResponse> {
  if (Platform.OS === "ios") {
    return new Promise((resolve, reject) => {
      ReactNativeEpsonEposModule.pairingBluetoothPrinter()
        .then((status: BluetoothStatus) => {
          resolve({ status, reason: getBluetoothMessage(status) });
        })
        .catch(reject);
    });
  } else {
    try {
      // API Level 28 or lower: BLUETOOTH, BLUETOOTH_ADMIN and ACCESS_COARSE_LOCATION
      // API Level 29 or 30: BLUETOOTH_CONNECT, BLUETOOTH_ADMIN, ACCESS_FINE_LOCATION
      // API Level 31 or higher: BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      const apiLevel = Number(Platform.Version);
      const permissionsSettings: PermissionsSettings[] = [];
      if (__DEV__) {
        console.log({ apiLevel });
      }

      if (apiLevel <= 28) {
        const title = "Bluetooth Permission";
        const message =
          "The app requires access to your Bluetooth for printing.";
        permissionsSettings.push(
          ...[
            {
              permission: PermissionsAndroid.PERMISSIONS.BLUETOOTH,
              title,
              message,
            },
            {
              permission: PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
              title,
              message,
            },
            {
              permission: PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
              title,
              message,
            },
          ]
        );
      } else if (apiLevel >= 29 && apiLevel <= 30) {
        const title = "Bluetooth Permission";
        const message =
          "The app requires access to your Bluetooth for printing.";
        permissionsSettings.push(
          ...[
            {
              permission: PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
              title,
              message,
            },
            {
              permission: PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
              title,
              message,
            },
            {
              permission: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              title,
              message,
            },
          ]
        );
      } else {
        permissionsSettings.push(
          ...[
            {
              permission: PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              title: "Bluetooth Scan Permission",
              message:
                "The app requires access to your Bluetooth for scanning.",
            },
            {
              permission: PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
              title: "Bluetooth Connect Permission",
              message:
                "The app requires access to your Bluetooth for connecting to printers.",
            },
          ]
        );
      }

      for (const permissionSettings of permissionsSettings) {
        if (permissionSettings.permission) {
          const status = await PermissionsAndroid.request(
            permissionSettings.permission,
            {
              title: permissionSettings.title,
              message: permissionSettings.message,
              buttonNegative: "Cancel",
              buttonPositive: "OK",
            }
          );
          if (status !== PermissionsAndroid.RESULTS.GRANTED) {
            throw new Error(
              `Bluetooth permission denied: please check your settings`
            );
          }
        } else {
          console.warn("Missing permission");
        }
      }

      // On Android, we always returns success if we have bluetooth permissions
      const status: BluetoothStatus = "BLUETOOTH_SUCCESS";
      return Promise.resolve({ status, reason: getBluetoothMessage(status) });
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

export async function setValueAsync(value: string) {
  return await ReactNativeEpsonEposModule.setValueAsync(value);
}

const emitter = ReactNativeEpsonEposModule;

export function addChangeListener(
  listener: (event: ChangeEventPayload) => void
): EventSubscription {
  return emitter.addListener("onChange", listener);
}

export {
  ReactNativeEpsonEposView,
  ReactNativeEpsonEposViewProps,
  ChangeEventPayload,
};

// Low level APIs
export function addCut(): Promise<void> {
  return ReactNativeEpsonEposModule.addCut();
}

export function addFeedLine(line: number): Promise<void> {
  return ReactNativeEpsonEposModule.addFeedLine(Math.floor(line));
}

interface AddImageProps {
  base64: string;
  width: number;
  height: number;
}
export function addImage({
  base64,
  width,
  height,
}: AddImageProps): Promise<void> {
  return ReactNativeEpsonEposModule.addImage(
    base64,
    Math.floor(width),
    Math.floor(height)
  );
}

export function addText(text: string): Promise<void> {
  return ReactNativeEpsonEposModule.addText(text);
}

export function addTextAlign(
  textAlign: "left" | "right" | "center"
): Promise<void> {
  const align = textAlign === "left" ? 0 : textAlign === "right" ? 2 : 1;
  return ReactNativeEpsonEposModule.addTextAlign(align);
}

export function addTextSize(width: number, height: number): Promise<void> {
  return ReactNativeEpsonEposModule.addTextSize(
    Math.floor(width),
    Math.floor(height)
  );
}

export function clearBuffer(): Promise<void> {
  return ReactNativeEpsonEposModule.clearBuffer();
}

export function beginTransaction(): Promise<void> {
  return ReactNativeEpsonEposModule.beginTransaction();
}

export function endTransaction(): Promise<void> {
  return ReactNativeEpsonEposModule.endTransaction();
}

export function sendData(): Promise<void> {
  return ReactNativeEpsonEposModule.sendData();
}

export function connect(): Promise<void> {
  return ReactNativeEpsonEposModule.connect();
}

export function disconnect(): Promise<void> {
  return ReactNativeEpsonEposModule.disconnect();
}
