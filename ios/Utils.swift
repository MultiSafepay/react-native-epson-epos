enum Commands: String {
  case addText
  case addNewLine
  case addTextStyle
  case addTextSize
  case addAlign
  case addImageBase64
  case addImageAsset
  case addCut
  case addData
  case addImage
  case addTextSmooth
  case addBarcode
  case addQrCode
  case addPulse
}

enum PrinterError: String {
  case connectPrinter = "ERROR_CONNECT_PRINTER"
  case disconnectPrinter = "ERROR_DISCONNECT_PRINTER"
  case startDiscovery = "ERROR_START_DISCOVERY"
  case notFound = "ERROR_PRINTER_NOT_FOUND"
  case notValidImage = "ERROR_IMAGE_NOT_VALID"
  case printImage = "ERROR_PRINT_IMAGE"
  case connectBluetooth = "ERROR_CONNECT_BLUETOOTH"
  case startBluetooth = "ERROR_START_BLUETOOTH"
  case missingTarget = "ERROR_MISSING_TARGET"
  case cmdAddCut = "ERROR_COMMAND_ADD_CUT"
  case cmdAddFeedLine = "ERROR_COMMAND_ADD_FEED_LINE"
  case cmdAddImage = "ERROR_COMMAND_ADD_IMAGE"
  case cmdAddText = "ERROR_COMMAND_ADD_TEXT"
  case cmdAddTextAlign = "ERROR_COMMAND_ADD_TEXT_ALIGN"
  case cmdAddTextSize = "ERROR_COMMAND_ADD_TEXT_SIZE"
  case cmdClearBuffer = "ERROR_COMMAND_CLEAR_BUFFER"
  case cmdBeginTransaction = "ERROR_COMMAND_BEGIN_TRANSACTION"
  case cmdEndTransaction = "ERROR_COMMAND_END_TRANSACTION"
  case cmdSendData = "ERROR_COMMAND_SEND_DATA"
  case cmdConnect = "ERROR_COMMAND_CONNECT"
  case cmdDisconnect = "ERROR_COMMAND_DISCONNECT"
}

enum PrinterPortType: String {
  case all = "ALL"
  case lan = "LAN"
  case bluetooth = "BLUETOOTH"
  case usb = "USB"
}

func printDebugLog(_ message: String) {
  #if DEBUG
  print(message)
  #endif
}
