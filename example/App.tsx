import { StyleSheet, Text, View } from 'react-native';

import * as ReactNativeEpsonEpos from 'react-native-epson-epos';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>{ReactNativeEpsonEpos.hello()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
