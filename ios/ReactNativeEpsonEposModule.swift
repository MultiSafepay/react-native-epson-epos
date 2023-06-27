import ExpoModulesCore

public class ReactNativeEpsonEposModule: Module {
  
  private var epsonManager = EpsonManager()
  
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

    AsyncFunction("discoverPrinters") { (promise: Promise) in
      // return@Coroutine epsonManager.startDiscovery(context)
    }

    AsyncFunction("setupPrinter") { (target: String, series: Int, lang: Int, promise: Promise) in
      // epsonManager.setupPrinter(context, target, series, lang, promise)
    }

    AsyncFunction("connectPrinter") { (promise: Promise) in
      // epsonManager.connectPrinter(promise)
      promise.reject("TODO", "To be implemented")
    }

    AsyncFunction("disconnectPrinter") { (promise: Promise) in
      // epsonManager.disconnectPrinter(promise)
      promise.reject("TODO", "To be implemented")
    }

    AsyncFunction("printImage") { (base64: String, imageWidth: Int, imageHeight: Int, promise: Promise) in
      // val decodedString: ByteArray = Base64.decode(base64, Base64.DEFAULT)
      // val bitmap = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.size)

      // if (bitmap == null) {
      //   promise.reject(CodedException("Did fail to decode image"))
      // }
      // epsonManager.printImage(bitmap, imageWidth, imageHeight, promise)
      promise.reject("TODO", "To be implemented")
    }

    AsyncFunction("cutPaper") { (promise: Promise) in
      // epsonManager.cutPaper(promise)
      promise.reject("TODO", "To be implemented")
    }
  }
}
