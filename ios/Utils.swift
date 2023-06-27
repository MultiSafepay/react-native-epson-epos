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
}

func printDebugLog(_ message: String) {
  #if DEBUG
  print(message)
  #endif
}
