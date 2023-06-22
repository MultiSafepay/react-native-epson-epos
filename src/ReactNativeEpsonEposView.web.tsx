import * as React from 'react';

import { ReactNativeEpsonEposViewProps } from './ReactNativeEpsonEpos.types';

export default function ReactNativeEpsonEposView(props: ReactNativeEpsonEposViewProps) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  );
}
