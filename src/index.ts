import {
  NativeModulesProxy,
  EventEmitter,
  Subscription,
} from "expo-modules-core";

import {
  ChangeEventPayload,
  PrinterLanguage,
  PrinterSeriesName,
  ReactNativeEpsonEposViewProps,
} from "./ReactNativeEpsonEpos.types";
import ReactNativeEpsonEposModule from "./ReactNativeEpsonEposModule";
import ReactNativeEpsonEposView from "./ReactNativeEpsonEposView";
import { PRINTER_SERIES } from "./constants";
import { getPrinterLanguage, sleep } from "./utils";

export function hello(): string {
  return ReactNativeEpsonEposModule.hello();
}

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

export function discoverPrinters(): Promise<Printer[]> {
  return ReactNativeEpsonEposModule.discoverPrinters();
}

export function printerIsConnected(): boolean {
  return ReactNativeEpsonEposModule.printerIsConnected();
}

export function printerIsSetup(): boolean {
  return ReactNativeEpsonEposModule.printerIsSetup();
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
}: SetupPrinterProps): Promise<void> {
  const series = PRINTER_SERIES[seriesName ?? "SERIES_TM_T20"];
  const lang = getPrinterLanguage(language ?? "LANG_EN");
  return ReactNativeEpsonEposModule.setupPrinter(target, series, lang);
}

export function connectPrinter(): Promise<void> {
  return ReactNativeEpsonEposModule.connectPrinter();
}

export function disconnectPrinter(): Promise<void> {
  return ReactNativeEpsonEposModule.disconnectPrinter();
}

interface PrintImageProps {
  base64: string;
  width: number;
  height: number;
}
export function printImage({
  base64,
  width,
  height,
}: PrintImageProps): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      await ReactNativeEpsonEposModule.printImage(base64, width, height);
      sleep(100);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

export function cutPaper(): Promise<void> {
  return ReactNativeEpsonEposModule.cutPaper();
}

export async function setValueAsync(value: string) {
  return await ReactNativeEpsonEposModule.setValueAsync(value);
}

const emitter = new EventEmitter(
  ReactNativeEpsonEposModule ?? NativeModulesProxy.ReactNativeEpsonEpos
);

export function addChangeListener(
  listener: (event: ChangeEventPayload) => void
): Subscription {
  return emitter.addListener<ChangeEventPayload>("onChange", listener);
}

export {
  ReactNativeEpsonEposView,
  ReactNativeEpsonEposViewProps,
  ChangeEventPayload,
};
