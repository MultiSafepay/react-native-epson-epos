import { requireNativeViewManager } from "expo-modules-core";
import * as React from "react";

import { ReactNativeEpsonEposViewProps } from "./ReactNativeEpsonEpos.types";

const NativeView: React.ComponentType<ReactNativeEpsonEposViewProps> =
  requireNativeViewManager("ReactNativeEpsonEpos");

export default function ReactNativeEpsonEposView(
  props: ReactNativeEpsonEposViewProps
) {
  return <NativeView {...props} />;
}
