import ExpoModulesCore

class EpsonManager: NSObject {
  
  private var timeout: Float = 5000
  private var printer: Epos2Printer? = nil
  private var isConnected: Bool = false
  private var target: String?
  private let filterOption: Epos2FilterOption = {
    let filter = Epos2FilterOption()
    filter.deviceType = EPOS2_TYPE_PRINTER.rawValue
    filter.deviceModel = EPOS2_MODEL_ALL.rawValue
    return filter
  }()
  private let disconnectInterval: Float = 500
  private var printerList: [Epos2DeviceInfo] = []
  private var bluetoothTarget: NSMutableString = NSMutableString()
  private let pairingPrinter = Epos2BluetoothConnection()
    
  func setTimeout(_ timeout: Float) {
    self.timeout = timeout
  }
  
  func constants() -> [String: Any] {
    let record = [
        // Printer series
        "SERIES_TM_M10": EPOS2_TM_M10,
        "SERIES_TM_M30": EPOS2_TM_M30,
        "SERIES_TM_M30II": EPOS2_TM_M30II,
        "SERIES_TM_M30III": EPOS2_TM_M30III,
        "SERIES_TM_P20": EPOS2_TM_P20,
        "SERIES_TM_P60": EPOS2_TM_P60,
        "SERIES_TM_P60II": EPOS2_TM_P60II,
        "SERIES_TM_P80": EPOS2_TM_P80,
        "SERIES_TM_T20": EPOS2_TM_T20,
        "SERIES_TM_T60": EPOS2_TM_T60,
        "SERIES_TM_T70": EPOS2_TM_T70,
        "SERIES_TM_T81": EPOS2_TM_T81,
        "SERIES_TM_T82": EPOS2_TM_T82,
        "SERIES_TM_T83": EPOS2_TM_T83,
        "SERIES_TM_T88": EPOS2_TM_T88,
        "SERIES_TM_T90": EPOS2_TM_T90,
        "SERIES_TM_T90KP": EPOS2_TM_T90KP,
        "SERIES_TM_U220": EPOS2_TM_U220,
        "SERIES_TM_U330": EPOS2_TM_U330,
        "SERIES_TM_L90": EPOS2_TM_L90,
        "SERIES_TM_H6000": EPOS2_TM_H6000,
        "SERIES_TM_T83III": EPOS2_TM_T83III,
        "SERIES_TM_T100": EPOS2_TM_T100,
        "SERIES_TS_100": EPOS2_TM_L100,
        "SERIES_TM_M50": EPOS2_TM_M50,
        "SERIES_TM_T88VII": EPOS2_TM_T88VII,
        "SERIES_TM_L90LFC": EPOS2_TM_L90LFC,
        "SERIES_TM_L100": EPOS2_TM_L100,
        
        // Print commands
        "COMMAND_ADD_TEXT": Commands.addText.rawValue,
        "COMMAND_ADD_NEW_LINE": Commands.addNewLine.rawValue,
        "COMMAND_ADD_TEXT_STYLE": Commands.addTextStyle.rawValue,
        "COMMAND_ADD_TEXT_SIZE": Commands.addTextSize.rawValue,
        "COMMAND_ADD_TEXT_SMOOTH": Commands.addTextSmooth.rawValue,
        "COMMAND_ADD_ALIGN": Commands.addAlign.rawValue,
        "COMMAND_ADD_IMAGE_BASE_64": Commands.addImageBase64.rawValue,
        "COMMAND_ADD_IMAGE_ASSET": Commands.addImageAsset.rawValue,
        "COMMAND_ADD_IMAGE": Commands.addImage.rawValue,
        "COMMAND_ADD_BARCODE": Commands.addBarcode.rawValue,
        "COMMAND_ADD_QRCODE": Commands.addQrCode.rawValue,
        "COMMAND_ADD_CUT": Commands.addCut.rawValue,
        "COMMAND_ADD_DATA": Commands.addData.rawValue,
        "COMMAND_ADD_PULSE": Commands.addPulse.rawValue,
        
        "ALIGN_LEFT": EPOS2_ALIGN_LEFT,
        "ALIGN_RIGHT": EPOS2_ALIGN_RIGHT,
        "ALIGN_CENTER": EPOS2_ALIGN_CENTER,
        "TRUE": EPOS2_TRUE,
        "FALSE": EPOS2_FALSE,
        
        // Print languages
        "LANG_EN": EPOS2_LANG_EN,
        "LANG_JA": EPOS2_LANG_JA,
        "LANG_ZH_CN": EPOS2_LANG_ZH_CN,
        "LANG_ZH_TW": EPOS2_LANG_ZH_TW,
        "LANG_KO": EPOS2_LANG_KO,
        "LANG_TH": EPOS2_LANG_TH,
        "LANG_VI": EPOS2_LANG_VI,
        "LANG_MULTI": EPOS2_LANG_MULTI,
        
        // Print Barcodes
        "BARCODE_UPC_A": EPOS2_BARCODE_UPC_A,
        "BARCODE_UPC_E": EPOS2_BARCODE_UPC_E,
        "BARCODE_EAN13": EPOS2_BARCODE_EAN13,
        "BARCODE_JAN13": EPOS2_BARCODE_JAN13,
        "BARCODE_EAN8": EPOS2_BARCODE_EAN8,
        "BARCODE_JAN8": EPOS2_BARCODE_JAN8,
        "BARCODE_CODE39": EPOS2_BARCODE_CODE39,
        "BARCODE_ITF": EPOS2_BARCODE_ITF,
        "BARCODE_CODABAR": EPOS2_BARCODE_CODABAR,
        "BARCODE_CODE93": EPOS2_BARCODE_CODE93,
        "BARCODE_CODE128": EPOS2_BARCODE_CODE128,
        "BARCODE_GS1_128": EPOS2_BARCODE_GS1_128,
        "BARCODE_GS1_DATABAR_OMNIDIRECTIONAL": EPOS2_BARCODE_GS1_DATABAR_OMNIDIRECTIONAL,
        "BARCODE_GS1_DATABAR_TRUNCATED": EPOS2_BARCODE_GS1_DATABAR_TRUNCATED,
        "BARCODE_GS1_DATABAR_LIMITED": EPOS2_BARCODE_GS1_DATABAR_LIMITED,
        "BARCODE_GS1_DATABAR_EXPANDED": EPOS2_BARCODE_GS1_DATABAR_EXPANDED,
        "BARCODE_CODE128_AUTO": EPOS2_BARCODE_CODE128_AUTO,
        "HRI_NONE": EPOS2_HRI_NONE,
        "HRI_ABOVE": EPOS2_HRI_ABOVE,
        "HRI_BELOW": EPOS2_HRI_BELOW,
        "HRI_BOTH": EPOS2_HRI_BOTH,
        "LEVEL_L": EPOS2_LEVEL_L,
        "LEVEL_M": EPOS2_LEVEL_M,
        "LEVEL_Q": EPOS2_LEVEL_Q,
        "LEVEL_H": EPOS2_LEVEL_H,
        "SYMBOL_QRCODE_MODEL_1": EPOS2_SYMBOL_QRCODE_MODEL_1,
        "SYMBOL_QRCODE_MODEL_2": EPOS2_SYMBOL_QRCODE_MODEL_2,
        "SYMBOL_QRCODE_MICRO": EPOS2_SYMBOL_QRCODE_MICRO,
        
        // Print image settings
        "COLOR_1": EPOS2_COLOR_1,
        "COLOR_2": EPOS2_COLOR_2,
        "COLOR_3": EPOS2_COLOR_3,
        "COLOR_4": EPOS2_COLOR_4,
        "MODE_MONO": EPOS2_MODE_MONO,
        "MODE_GRAY16": EPOS2_MODE_GRAY16,
        "MODE_MONO_HIGH_DENSITY": EPOS2_MODE_MONO_HIGH_DENSITY,
        "HALFTONE_DITHER": EPOS2_HALFTONE_DITHER,
        "HALFTONE_ERROR_DIFFUSION": EPOS2_HALFTONE_ERROR_DIFFUSION,
        "HALFTONE_THRESHOLD": EPOS2_HALFTONE_THRESHOLD,
        
        // Add pulse settings
        "DRAWER_2PIN": EPOS2_DRAWER_2PIN,
        "DRAWER_5PIN": EPOS2_DRAWER_5PIN
    ] as [String: Any]
    return record
  }
  
  func printerIsSetup() -> Bool {
    return printer != nil
  }
  
  func printerIsConnected() -> Bool {
    return isConnected
  }
  
  func discoverPrinters(portType: PrinterPortType, promise: Promise) {
    stopDiscovery()
    printerList.removeAll()
    
    switch portType {
    case .all:
      self.filterOption.portType = EPOS2_PORTTYPE_ALL.rawValue
      break
    case .bluetooth:
      self.filterOption.portType = EPOS2_PORTTYPE_BLUETOOTH.rawValue
      break
    case .lan:
      self.filterOption.portType = EPOS2_PORTTYPE_TCP.rawValue
      break
    case .usb:
      self.filterOption.portType = EPOS2_PORTTYPE_USB.rawValue
      break
    }
    
    let status = Epos2Discovery.start(self.filterOption, delegate: self)
    if (status != EPOS2_SUCCESS.rawValue) {
      printDebugLog("🛑 did fail to start discovery process")
      promise.reject(PrinterError.startDiscovery.rawValue, "Did fail to start discovery")
    } else {
      printDebugLog("🟢 did start discovery process")
      
      // Gather all the results after `timeout` and return the response
      let deadline = dispatchTime(fromMilliseconds: Int(timeout))
      DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: deadline, execute: { [weak self] in
        // Collect all the values received
        let discoveredDevices = self?.printerList ?? []
        
        let results = discoveredDevices.map { [
          "name": $0.deviceName,
          "target": $0.target,
          "ip": $0.ipAddress,
          "mac": $0.macAddress,
          "bt": $0.bdAddress,
          "usb": usbAddress(target: $0.target)
          ]
        }
        promise.resolve(results)
      })
    }
  }
  
  func setupPrinter(target: String, series: Int, lang: Int, promise: Promise) {
    if let printer = printer {
      printer.clearCommandBuffer()
      printer.setReceiveEventDelegate(nil)
    }
    self.printer = nil
    self.isConnected = false
    
    printer = Epos2Printer(printerSeries: Int32(series), lang: Int32(lang))
    self.target = target
    printer?.setReceiveEventDelegate(self)
    
    promise.resolve(true)
  }
  
  func pairingBluetoothPrinter(promise: Promise) {
    guard let pairingPrinter = pairingPrinter else {
      promise.reject(PrinterError.startBluetooth.rawValue, "did fail to start bluetooth connection")
      return
    }
    
    let result = pairingPrinter.connectDevice(self.bluetoothTarget)
    switch (result) {
    case EPOS2_BT_SUCCESS.rawValue, EPOS2_BT_ERR_ALREADY_CONNECT.rawValue:
      promise.resolve(bluetoothMessage(code: EPOS2_BT_SUCCESS.rawValue))
      break
    default:
      self.printer?.disconnect()
      pairingPrinter.disconnectDevice(bluetoothTarget as String)
      promise.resolve(bluetoothMessage(code: result))
      break
    }
  }
  
  func addCut(promise: Promise) {
    guard let printer = printer else {
      promise.reject(PrinterError.notFound.rawValue, "did fail to cut paper: no printer")
      return
    }
    let result = printer.addCut(EPOS2_CUT_FEED.rawValue)
    if (result != EPOS2_SUCCESS.rawValue) {
      promise.reject(PrinterError.cmdAddCut.rawValue, "did fail to cut paper: no printer")
    } else {
      promise.resolve(true)
    }
  }
  
  func addFeedLine(line: Int, promise: Promise) {
    guard let printer = printer else {
      promise.reject(PrinterError.notFound.rawValue, "did fail to add feed line: no printer")
      return
    }
    let result = printer.addFeedLine(line)
    if (result != EPOS2_SUCCESS.rawValue) {
      promise.reject(PrinterError.cmdAddFeedLine.rawValue, "did fail to add feed line")
    } else {
      promise.resolve(true)
    }
  }
  
  func addImage(base64: String, imageWidth: Int, imageHeight: Int, promise: Promise) {
    guard let printer = printer else {
      promise.reject(PrinterError.notFound.rawValue, "did fail to add image: no printer")
      return
    }
    
    guard let image = imageFromBase64(base64) else {
      promise.reject(PrinterError.notValidImage.rawValue, "did fail to add image: image not valid")
      return
    }
    
    let imgHeight = image.size.height
    let imgWidth = image.size.width
    
    let size = CGSize(width: CGFloat(imageWidth), height: imgHeight*CGFloat(imageWidth)/imgWidth)
    guard let scaledImage = scaleImage(image, size: size) else {
      promise.reject(PrinterError.notValidImage.rawValue, "did fail to add image: failed to resize image")
      return
    }
    
    let result = printer.add(scaledImage,
                             x: 0,
                             y: 0,
                             width: Int(size.width),
                             height: Int(size.height),
                             color: EPOS2_PARAM_DEFAULT,
                             mode: EPOS2_PARAM_DEFAULT,
                             halftone: EPOS2_PARAM_DEFAULT,
                             brightness: Double(EPOS2_PARAM_DEFAULT),
                             compress: EPOS2_PARAM_DEFAULT)
    if (result != EPOS2_SUCCESS.rawValue) {
      promise.reject(PrinterError.cmdAddImage.rawValue, "did fail to add image")
    } else {
      promise.resolve(true)
    }
  }
  
  func addText(text: String, promise: Promise) {
    guard let printer = printer else {
      promise.reject(PrinterError.notFound.rawValue, "did fail to add text: no printer")
      return
    }
    let result = printer.addText(text)
    if (result != EPOS2_SUCCESS.rawValue) {
      promise.reject(PrinterError.cmdAddText.rawValue, "did fail to add text: no printer")
    } else {
      promise.resolve(true)
    }
  }
  
  func addTextAlign(align: Int, promise: Promise) {
    guard let printer = printer else {
      promise.reject(PrinterError.notFound.rawValue, "did fail to add text align: no printer")
      return
    }
    
    // 0: left, 1: center, 2: right
    let textAlign = align == 0 ? EPOS2_ALIGN_LEFT : align == 1 ? EPOS2_ALIGN_CENTER : EPOS2_ALIGN_RIGHT
    
    let result = printer.addTextAlign(textAlign.rawValue)
    if (result != EPOS2_SUCCESS.rawValue) {
      promise.reject(PrinterError.cmdAddTextAlign.rawValue, "did fail to add text align")
    } else {
      promise.resolve(true)
    }
  }
  
  func addTextSize(width: Int, height: Int, promise: Promise) {
    guard let printer = printer else {
      promise.reject(PrinterError.notFound.rawValue, "did fail to add text size: no printer")
      return
    }
    
    let result = printer.addTextSize(width, height: height)
    if (result != EPOS2_SUCCESS.rawValue) {
      promise.reject(PrinterError.cmdAddTextSize.rawValue, "did fail to add text size")
    } else {
      promise.resolve(true)
    }
  }
  
  func clearBuffer(promise: Promise) {
    guard let printer = printer else {
      promise.reject(PrinterError.notFound.rawValue, "did fail to clear the buffer: no printer")
      return
    }
    
    let result = printer.clearCommandBuffer()
    if (result != EPOS2_SUCCESS.rawValue) {
      promise.reject(PrinterError.cmdClearBuffer.rawValue, "did fail to clear the buffer")
    } else {
      promise.resolve(true)
    }
  }
  
  func beginTransaction(promise: Promise) {
    guard let printer = printer else {
      promise.reject(PrinterError.notFound.rawValue, "did fail to begin transaction: no printer")
      return
    }
    
    let result = printer.beginTransaction()
    if (result != EPOS2_SUCCESS.rawValue) {
      promise.reject(PrinterError.cmdBeginTransaction.rawValue, "did fail to begin transaction")
    } else {
      promise.resolve(true)
    }
  }
  
  func endTransaction(promise: Promise) {
    guard let printer = printer else {
      promise.reject(PrinterError.notFound.rawValue, "did fail to end transaction: no printer")
      return
    }
    
    let result = printer.endTransaction()
    if (result != EPOS2_SUCCESS.rawValue) {
      promise.reject(PrinterError.cmdEndTransaction.rawValue, "did fail to end transaction")
    } else {
      promise.resolve(true)
    }
  }
  
  func sendData(promise: Promise) {
    guard let printer = printer else {
      promise.reject(PrinterError.notFound.rawValue, "did fail to send data: no printer")
      return
    }
    
    let result = printer.sendData(Int(EPOS2_PARAM_DEFAULT))
    if (result != EPOS2_SUCCESS.rawValue) {
      promise.reject(PrinterError.cmdSendData.rawValue, "did fail to send data")
    } else {
      promise.resolve(true)
    }
  }
  
  func connect(promise: Promise) {
    guard let printer = printer else {
      promise.reject(PrinterError.notFound.rawValue, "did fail connect: no printer")
      return
    }
    
    guard let target = target else {
      promise.reject(PrinterError.missingTarget.rawValue, "target not found")
      return
    }
        
    let result = printer.connect(target, timeout: Int(timeout))
    if (result != EPOS2_SUCCESS.rawValue) {
      isConnected = false
      printDebugLog("did fail to connect: \(result)")
      promise.reject(PrinterError.cmdConnect.rawValue, "did fail to connect")
    } else {
      isConnected = true
      promise.resolve(true)
    }
  }
  
  func disconnect(promise: Promise) {
    guard let printer = printer else {
      // Do nothing if we haven't setup a printer yet
      promise.resolve(true)
      return
    }
    
    let result = printer.disconnect()
    if (result != EPOS2_SUCCESS.rawValue) {
      isConnected = false
      promise.reject(PrinterError.cmdDisconnect.rawValue, "did fail to disconnect")
    } else {
      isConnected = true
      promise.resolve(true)
    }
  }
  
}

private extension EpsonManager {
  func stopDiscovery() {
    let status = Epos2Discovery.stop()
    if (status != EPOS2_SUCCESS.rawValue) {
      printDebugLog("🛑 did fail to stop discovery process")
    } else {
      printDebugLog("🟢 did stop discovery process")
    }
  }
  
  func dispatchTime(fromMilliseconds milliseconds: Int) -> DispatchTime {
      let seconds = milliseconds / 1000
      let nanoSeconds = (milliseconds % 1000) * 1_000_000
      let uptimeNanoseconds = DispatchTime.now().uptimeNanoseconds + UInt64(seconds) * 1_000_000_000 + UInt64(nanoSeconds)
      return DispatchTime(uptimeNanoseconds: uptimeNanoseconds)
  }

  func imageFromBase64(_ base64: String) -> UIImage? {
    if let data = Data(base64Encoded: base64) {
      return UIImage(data: data)
    }
    return nil
  }
  
  func scaleImage(_ image: UIImage, size: CGSize) -> UIImage? {
    let scale: CGFloat = max(size.width/image.size.width, size.height/image.size.height);
    let width: CGFloat = image.size.width * scale;
    let height: CGFloat = image.size.height * scale;
    let imageRect: CGRect = CGRectMake((size.width - width)/2.0,
                                       (size.height - height)/2.0,
                                       width,
                                       height);

    UIGraphicsBeginImageContextWithOptions(size, false, 0);
    image.draw(in: imageRect)
    let newImage = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    return newImage;
  }

}

extension EpsonManager: Epos2DiscoveryDelegate {
  func onDiscovery(_ deviceInfo: Epos2DeviceInfo!) {
    printerList.append(deviceInfo)
  }
}

extension EpsonManager: Epos2PtrReceiveDelegate {
  func onPtrReceive(_ printerObj: Epos2Printer!, code: Int32, status: Epos2PrinterStatusInfo!, printJobId: String!) {
    printDebugLog("onPtrReceive(): code=\(code), status: \(String(describing: status)), printJobId: \(String(describing: printJobId))")
  }
}

func usbAddress(target: String) -> String? {
  let rangeFirstThree = NSMakeRange(0, 3)
  let rangeThreeTillLength = NSMakeRange(4, target.count-4)
  let nsTarget = NSString(string: target)
  let prefix = nsTarget.substring(with: rangeFirstThree)
  if prefix == "USB" {
    return nsTarget.substring(with: rangeThreeTillLength)
  } else {
    return nil
  }
}

func bluetoothMessage(code: Int32) -> String {
  switch (code) {
  case EPOS2_BT_SUCCESS.rawValue:
    return "BLUETOOTH_SUCCESS"
  case EPOS2_BT_ERR_PARAM.rawValue:
    return "BLUETOOTH_ERROR_PARAM"
  case EPOS2_BT_ERR_CANCEL.rawValue:
    return "BLUETOOTH_ERROR_CANCEL"
  case EPOS2_BT_ERR_FAILURE.rawValue:
    return "BLUETOOTH_ERROR_FAILURE"
  case EPOS2_BT_ERR_UNSUPPORTED.rawValue:
    return "BLUETOOTH_ERROR_UNSUPPORTED"
  case EPOS2_BT_ERR_ILLEGAL_DEVICE.rawValue:
    return "BLUETOOTH_ERROR_ILLEGAL_DEVICE"
  case EPOS2_BT_ERR_ALREADY_CONNECT.rawValue:
    return "BLUETOOTH_ERROR_ALREADY_CONNECT"
  default:
    return "BLUETOOTH_ERROR_UNKNOWN"
  }
}
