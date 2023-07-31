# EPSON ePOS SDK for React Native

_An unofficial React Native library for printing on an EPSON TM printer with the <strong>Epson ePOS SDK for iOS</strong> and <strong>Epson ePOS SDK for Android</strong>_

This library supports the following Epson native drivers:

- Android: <strong>2.25.0</strong>
- iOS: <strong>2.25.0</strong>

# Installation

## Android

Add the following permissions to `android/app/src/main/AndroidManifest.xml`

### TCP

When using an application software that runs on Android 4.3.1 or lower, add permissions for the storage shown below.

```xml
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
```

### Wi-Fi

```xml
<uses-permission android:name="android.permission.INTERNET"/>
```

### Bluetooth

For API Level 28 or lower, specify "BLUETOOTH," "BLUETOOTH_ADMIN" and "ACCESS_COARSE_LOCATION."

```xml
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
```

For API Level 29 to 30, specify "BLUETOOTH," "BLUETOOTH_ADMIN" and "ACCESS_FINE_LOCATION."

```xml
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

For API Level 31 or higher, specify "BLUETOOTH_SCAN" and "BLUETOOTH_CONNECT."
If the application does not acquire the physical location information, specify neverForLocation for android:usesPermissionFlags.
When acquiring physical location information, specify "ACCESS_FINE_LOCATION."

```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
```

## iOS

You need to add the following strings to your Info.plist to prevent app crashes or avoid rejections by Apple. Please, look at the example below.

```
"NSBluetoothAlwaysUsageDescription": "Allow $(PRODUCT_NAME) to access bluetooth. Required to print the receipt",
"NSLocalNetworkUsageDescription": "Allow $(PRODUCT_NAME) to access local network. Required to print the receipt",
"NSLocationWhenInUseUsageDescription": "Allow $(PRODUCT_NAME) to access local network. Required to print the receipt",
"NSBluetoothPeripheralUsageDescription": "Allow $(PRODUCT_NAME) to access bluetooth. Required to print the receipt",
"UISupportedExternalAccessoryProtocols": ["com.epson.escpos"],
```
