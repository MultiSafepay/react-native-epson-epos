import ExpoModulesCore

public class ReactNativeEpsonEposModule: Module {
  
  private let epsonManager = EpsonManager()
  
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ReactNativeEpsonEpos')` in JavaScript.
    Name("ReactNativeEpsonEpos")

    // Defines event names that the module can send to JavaScript.
    Events("onChange")

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("setValueAsync") { (value: String) in
      // Send an event to JavaScript.
      self.sendEvent("onChange", [
        "value": value
      ])
    }

    // Enables the module to be used as a native view. Definition components that are accepted as part of the
    // view definition: Prop, Events.
    View(ReactNativeEpsonEposView.self) {
      // Defines a setter for the `name` prop.
      Prop("name") { (view: ReactNativeEpsonEposView, prop: String) in
        print(prop)
      }
    }

    // -----------------------------
    // Epson ePOS SDK public methods
    // -----------------------------

    Function("setTimeout") { (timeout: Float) in
      epsonManager.setTimeout(timeout)
    }

    Function("getConstants") {
      return epsonManager.constants()
    }

    Function("printerIsSetup") {
      return epsonManager.printerIsSetup()
    }

    Function("printerIsConnected") {
      return epsonManager.printerIsConnected()
    }

    AsyncFunction("discoverPrinters") { (portType: String, promise: Promise) in
      let printerPortType = PrinterPortType(rawValue: portType)!
      epsonManager.discoverPrinters(portType: printerPortType, promise: promise)
    }

    AsyncFunction("setupPrinter") { (target: String, series: Int, lang: Int, promise: Promise) in
      epsonManager.setupPrinter(target: target, series: series, lang: lang, promise: promise)
    }
    
    AsyncFunction("pairingBluetoothPrinter") { (promise: Promise) in
      epsonManager.pairingBluetoothPrinter(promise: promise)
    }
      
    // Low level API methods
    
    /**
     * This function adds a cut command to the command buffer.
     */
    AsyncFunction("addCut") { (promise: Promise) in
      epsonManager.addCut(promise: promise)
    }
    
    /**
     * This function adds a feed line command to the command buffer.
     */
    AsyncFunction("addFeedLine") { (line: Int, promise: Promise) in
      epsonManager.addFeedLine(line: line, promise: promise)
    }
    
    /**
     * This function adds an image command to the command buffer.
     */
    AsyncFunction("addImage") { (base64: String, imageWidth: Int, imageHeight: Int, promise: Promise) in
      epsonManager.addImage(base64: base64, imageWidth: imageWidth, imageHeight: imageHeight, promise: promise)
    }
    
    /**
     * This function adds a text command to the command buffer.
     */
    AsyncFunction("addText") { (text: String, promise: Promise) in
      epsonManager.addText(text: text, promise: promise)
    }
    
    /**
     * This function adds a text align command to the command buffer.
     */
    AsyncFunction("addTextAlign") { (align: Int, promise: Promise) in
      epsonManager.addTextAlign(align: align, promise: promise)
    }
    
    /**
     * This function adds a text size command to the command buffer.
     */
    AsyncFunction("addTextSize") { (width: Int, height: Int, promise: Promise) in
      epsonManager.addTextSize(width: width, height: height, promise: promise)
    }
    
    /**
     * This function clears the command buffer.
     */
    AsyncFunction("clearBuffer") { (promise: Promise) in
      epsonManager.clearBuffer(promise: promise)
    }
    
    /**
     * This function begins a transaction.
     */
    AsyncFunction("beginTransaction") { (promise: Promise) in
      epsonManager.beginTransaction(promise: promise)
    }
    
    /**
     * This function ends a transaction.
     */
    AsyncFunction("endTransaction") { (promise: Promise) in
      epsonManager.endTransaction(promise: promise)
    }
    
    /**
     * This function sends the data in the command buffer to the printer.
     */
    AsyncFunction("sendData") { (promise: Promise) in
      epsonManager.sendData(promise: promise)
    }
    
    /**
     * This function connects to the printer.
     */
    AsyncFunction("connect") { (promise: Promise) in
      epsonManager.connect(promise: promise)
    }
    
    /**
     * This function disconnects from the printer.
     */
    AsyncFunction("disconnect") { (promise: Promise) in
      epsonManager.disconnect(promise: promise)
    }
    
    /**
     * This function sends raw data (ESC/POS or printer command bytes) to the printer.
     */
    AsyncFunction("sendRawData") { (data: [Int], promise: Promise) in
      let byteData = Data(data.map { UInt8($0) })
      epsonManager.sendRawData(data: byteData, promise: promise)
    }
    
    /**
     * This function opens the cash drawer.
     */
    AsyncFunction("openCashDrawer") { (promise: Promise) in
      epsonManager.openCashDrawer(promise: promise)
    }
  }
}
