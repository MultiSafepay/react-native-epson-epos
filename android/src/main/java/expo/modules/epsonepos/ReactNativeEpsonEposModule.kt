package expo.modules.epsonepos

import android.graphics.BitmapFactory
import android.util.Base64
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * This class is a module for the Epson ePOS SDK.
 * It provides methods for managing an Epson printer, including setting up the printer, connecting to the printer,
 * disconnecting from the printer, and sending various commands to the printer.
 */
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
  /**
   * This function defines the module's functionality and behavior.
   * It includes definitions for constants, events, functions, and views.
   */
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ReactNativeEpsonEpos')` in JavaScript.
    Name("ReactNativeEpsonEpos")

    // Defines event names that the module can send to JavaScript.
    Events("onChange")

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("setValueAsync") { value: String ->
      // Send an event to JavaScript.
      sendEvent("onChange", mapOf(
        "value" to value
      ))
    }

    // Enables the module to be used as a native view. Definition components that are accepted as part of
    // the view definition: Prop, Events.
    View(ReactNativeEpsonEposView::class) {
      // Defines a setter for the `name` prop.
      Prop("name") { view: ReactNativeEpsonEposView, prop: String ->
        println(prop)
      }
    }

    // -----------------------------
    // Epson ePOS SDK public methods
    // -----------------------------

    /**
     * This function sets the timeout for the Epson manager.
     */
    Function("setTimeout") { timeout: Long ->
      epsonManager.setTimeout(timeout)
    }

    /**
     * This function gets the constants for the Epson manager.
     */
    Function("getConstants") { ->
      epsonManager.constants()
    }

    /**
     * This function checks if the printer is set up.
     */
    Function("printerIsSetup") {
      epsonManager.printerIsSetup()
    }

    /**
     * This function checks if the printer is connected.
     */
    Function("printerIsConnected") {
      epsonManager.printerIsConnected()
    }

    /**
     * This function discovers printers.
     */
    AsyncFunction("discoverPrinters") Coroutine { portType: String ->
      return@Coroutine epsonManager.startDiscovery(portType, context)
    }

    /**
     * This function sets up the printer.
     */
    AsyncFunction("setupPrinter") { target: String, series: Int, lang: Int, promise: Promise ->
      epsonManager.setupPrinter(context, target, series, lang, promise)
    }

    // Low level API methods

    /**
     * This function adds a cut command to the command buffer.
     */
    AsyncFunction("addCut") {  promise: Promise ->
      epsonManager.addCut(promise)
    }

    /**
     * This function adds a feed line command to the command buffer.
     */
    AsyncFunction("addFeedLine") { line: Int,  promise: Promise ->
      epsonManager.addFeedLine(line, promise)
    }

    /**
     * This function adds an image command to the command buffer.
     */
    AsyncFunction("addImage") { base64: String, imageWidth: Int, imageHeight: Int, promise: Promise ->
      val decodedString: ByteArray = Base64.decode(base64, Base64.DEFAULT)
      val bitmap = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.size)

      if (bitmap == null) {
        promise.reject(CodedException("Did fail to decode image"))
      }
      epsonManager.addImage(bitmap, imageWidth, imageHeight, promise)
    }

    /**
     * This function adds a text command to the command buffer.
     */
    AsyncFunction("addText") { text: String,  promise: Promise ->
      epsonManager.addText(text, promise)
    }

    /**
     * This function adds a text align command to the command buffer.
     */
    AsyncFunction("addTextAlign") { align: Int,  promise: Promise ->
      epsonManager.addTextAlign(align, promise)
    }

    /**
     * This function adds a text size command to the command buffer.
     */
    AsyncFunction("addTextSize") { width: Int, height: Int,  promise: Promise ->
      epsonManager.addTextSize(width, height, promise)
    }

    /**
     * This function clears the command buffer.
     */
    AsyncFunction("clearBuffer") { promise: Promise ->
      epsonManager.clearBuffer(promise)
    }

    /**
     * This function begins a transaction.
     */
    AsyncFunction("beginTransaction") { promise: Promise ->
      epsonManager.beginTransaction(promise)
    }

    /**
     * This function ends a transaction.
     */
    AsyncFunction("endTransaction") { promise: Promise ->
      epsonManager.endTransaction(promise)
    }

    /**
     * This function sends the data in the command buffer to the printer.
     */
    AsyncFunction("sendData") { promise: Promise ->
      epsonManager.sendData(promise)
    }

    /**
     * This function connects to the printer.
     */
    AsyncFunction("connect") { promise: Promise ->
      epsonManager.connect(promise)
    }

    /**
     * This function disconnects from the printer.
     */
    AsyncFunction("disconnect") { promise: Promise ->
      epsonManager.disconnect(promise)
    }

    /**
     * This function sends raw data (ESC/POS or printer command bytes) to the printer.
     */
    AsyncFunction("sendRawData") { data: List<Int>, promise: Promise ->
      val byteArray = data.map { it.toByte() }.toByteArray()
      epsonManager.sendRawData(byteArray, promise)
    }

    /**
     * This function opens the cash drawer.
     */
    AsyncFunction("openCashDrawer") { promise: Promise ->
      epsonManager.openCashDrawer(promise = promise)
    }
  }
}
