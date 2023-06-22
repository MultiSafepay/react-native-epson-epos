import {
  NativeModulesProxy,
  EventEmitter,
  Subscription,
} from "expo-modules-core";

// Import the native module. On web, it will be resolved to ReactNativeEpsonEpos.web.ts
// and on native platforms to ReactNativeEpsonEpos.ts
import {
  ChangeEventPayload,
  ReactNativeEpsonEposViewProps,
} from "./ReactNativeEpsonEpos.types";
import ReactNativeEpsonEposModule from "./ReactNativeEpsonEposModule";
import ReactNativeEpsonEposView from "./ReactNativeEpsonEposView";

// Get the native constant value.
export const PI = ReactNativeEpsonEposModule.PI;

export function hello(): string {
  return ReactNativeEpsonEposModule.hello();
}

export function discoverPrinters(): Promise<Record<string, any>> {
  return ReactNativeEpsonEposModule.discoverPrinters();
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
