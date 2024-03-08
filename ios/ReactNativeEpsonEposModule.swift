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

    // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
    Constants([
      "PI": Double.pi
    ])

    // Defines event names that the module can send to JavaScript.
    Events("onChange")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("hello") {
      return "Hello world! 👋"
    }

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

    AsyncFunction("connectPrinter") { (promise: Promise) in
      epsonManager.connectPrinter(promise: promise)
    }

    AsyncFunction("disconnectPrinter") { (promise: Promise) in
      epsonManager.disconnectPrinter(promise: promise)
    }

    AsyncFunction("printImage") { (base64: String, imageWidth: Int, imageHeight: Int, promise: Promise) in
      epsonManager.printImageAndOrCut(base64: base64, imageWidth: imageWidth, imageHeight: imageHeight, cut: false, promise: promise)
    }
      
    AsyncFunction("printImageAndCut") { (base64: String, imageWidth: Int, imageHeight: Int, promise: Promise) in
      epsonManager.printImageAndOrCut(base64: base64, imageWidth: imageWidth, imageHeight: imageHeight, cut: true, promise: promise)
    }

    AsyncFunction("cutPaper") { (promise: Promise) in
      epsonManager.cutPaper(promise: promise)
    }
    
    AsyncFunction("pairingBluetoothPrinter") { (promise: Promise) in
      epsonManager.pairingBluetoothPrinter(promise: promise)
    }
  }
}
