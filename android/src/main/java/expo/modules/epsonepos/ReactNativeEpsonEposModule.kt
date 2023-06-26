package expo.modules.epsonepos

import android.graphics.BitmapFactory
import android.util.Base64
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition


class ReactNativeEpsonEposModule : Module() {

  private val context get() = requireNotNull(appContext.reactContext)
  // private val permissionsManager: Permissions get() = requireNotNull(appContext.permissions)
  // private val context: Context
  //   get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  // private val permissionsManager: Permissions
  //   get() = appContext.permissions ?: throw Exceptions.PermissionsModuleNotFound()
  private val epsonManager = EpsonManager()

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ReactNativeEpsonEpos')` in JavaScript.
    Name("ReactNativeEpsonEpos")

    // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
    Constants(
      "PI" to Math.PI
    )

    // Defines event names that the module can send to JavaScript.
    Events("onChange")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("hello") {
      "Hello world! 👋"
    }

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("setValueAsync") { value: String ->
      // Send an event to JavaScript.
      sendEvent("onChange", mapOf(
        "value" to value
      ))
    }

    // -----------------------------
    // Epson ePOS SDK public methods
    // -----------------------------

    Function("setTimeout") { timeout: Long ->
      epsonManager.setTimeout(timeout)
    }

    Function("getConstants") { ->
      epsonManager.constants()
    }

    Function("printerIsSetup") {
      epsonManager.printerIsSetup()
    }

    AsyncFunction("discoverPrinters") Coroutine { ->
      return@Coroutine epsonManager.startDiscovery(context)
    }

    AsyncFunction("setupPrinter") { target: String, series: Int, lang: Int, promise: Promise ->
      epsonManager.setupPrinter(context, target, series, lang, promise)
    }

    AsyncFunction("connectPrinter") { promise: Promise ->
      epsonManager.connectPrinter(promise)
    }

    AsyncFunction("disconnectPrinter") { promise: Promise ->
      epsonManager.disconnectPrinter(promise)
    }

    AsyncFunction("printImage") { base64: String, imageWidth: Int, imageHeight: Int, promise: Promise ->
      val decodedString: ByteArray = Base64.decode(base64, Base64.DEFAULT)
      val bitmap = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.size)

      if (bitmap == null) {
        promise.reject(CodedException("Did fail to decode image"))
      }
      epsonManager.printImage(bitmap, imageWidth, imageHeight, promise)
    }

    AsyncFunction("cutPaper") { promise: Promise ->
      epsonManager.cutPaper(promise)
    }

    // Enables the module to be used as a native view. Definition components that are accepted as part of
    // the view definition: Prop, Events.
    View(ReactNativeEpsonEposView::class) {
      // Defines a setter for the `name` prop.
      Prop("name") { view: ReactNativeEpsonEposView, prop: String ->
        println(prop)
      }
    }
  }
}
