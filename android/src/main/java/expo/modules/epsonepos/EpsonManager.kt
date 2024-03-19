package expo.modules.epsonepos

import android.content.Context
import android.graphics.Bitmap
import android.hardware.usb.UsbManager
import android.util.Log
import com.epson.epos2.Epos2Exception
import com.epson.epos2.discovery.Discovery
import com.epson.epos2.discovery.DiscoveryListener
import com.epson.epos2.discovery.FilterOption
import com.epson.epos2.printer.Printer
import com.epson.epos2.printer.PrinterStatusInfo
import com.epson.epos2.printer.ReceiveListener
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.UnexpectedException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

internal object PrintingCommands {
    const val COMMAND_ADD_TEXT = 0
    const val COMMAND_ADD_NEW_LINE = 1
    const val COMMAND_ADD_TEXT_STYLE = 2
    const val COMMAND_ADD_TEXT_SIZE = 3
    const val COMMAND_ADD_ALIGN = 4
    const val COMMAND_ADD_IMAGE_BASE_64 = 5
    const val COMMAND_ADD_IMAGE_ASSET = 6
    const val COMMAND_ADD_CUT = 7
    const val COMMAND_ADD_DATA = 8
    const val COMMAND_ADD_TEXT_SMOOTH = 9
    const val COMMAND_ADD_BARCODE = 10
    const val COMMAND_ADD_QRCODE = 11
    const val COMMAND_ADD_IMAGE = 12
    const val COMMAND_ADD_PULSE = 13
}

enum class PrinterError(val error: String) {
    NOT_FOUND("ERROR_PRINTER_NOT_FOUND"),
    MISSING_TARGET("ERROR_MISSING_TARGET"),
    CMD_ADD_CUT("ERROR_COMMAND_ADD_CUT"),
    CMD_ADD_FEED_LINE("ERROR_COMMAND_ADD_FEED_LINE"),
    CMD_ADD_IMAGE("ERROR_COMMAND_ADD_IMAGE"),
    CMD_ADD_TEXT("ERROR_COMMAND_ADD_TEXT"),
    CMD_ADD_TEXT_ALIGN("ERROR_COMMAND_ADD_TEXT_ALIGN"),
    CMD_ADD_TEXT_SIZE("ERROR_COMMAND_ADD_TEXT_SIZE"),
    CMD_CLEAR_BUFFER("ERROR_COMMAND_CLEAR_BUFFER"),
    CMD_BEGIN_TRANSACTION("ERROR_COMMAND_BEGIN_TRANSACTION"),
    CMD_END_TRANSACTION("ERROR_COMMAND_END_TRANSACTION"),
    CMD_SEND_DATA("ERROR_COMMAND_SEND_DATA"),
    CMD_CONNECT("ERROR_COMMAND_CONNECT"),
}

class PrinterException(errorCode: PrinterError) : CodedException(errorCode.name)

class EpsonManager: ReceiveListener {
    private var printer: Printer? = null
    private var isConnected: Boolean = false
    private val filterOption: FilterOption = FilterOption()
    private var timeout: Long = 5000;
    private var target: String? = null
    private val disconnectInterval: Long = 500 // milliseconds

    init {
        filterOption.deviceType = Discovery.TYPE_PRINTER
        filterOption.epsonFilter = Discovery.FILTER_NAME
        filterOption.deviceModel = Discovery.MODEL_ALL
        filterOption.usbDeviceName = Discovery.TRUE
        filterOption.bondedDevices = Discovery.TRUE
    }

    fun constants(): Map<String, Any> {
        val constants: MutableMap<String, Any> = HashMap()
        // Printer series
        constants["SERIES_TM_M10"] = Printer.TM_M10
        constants["SERIES_TM_M30"] = Printer.TM_M30
        constants["SERIES_TM_M30II"] = Printer.TM_M30II
        constants["SERIES_TM_M30III"] = Printer.TM_M30III
        constants["SERIES_TM_P20"] =  Printer.TM_P20
        constants["SERIES_TM_P60"] = Printer.TM_P60
        constants["SERIES_TM_P60II"] = Printer.TM_P60II
        constants["SERIES_TM_P80"] = Printer.TM_P80
        constants["SERIES_TM_T20"] = Printer.TM_T20
        constants["SERIES_TM_T60"] = Printer.TM_T60
        constants["SERIES_TM_T70"] = Printer.TM_T70
        constants["SERIES_TM_T81"] = Printer.TM_T81
        constants["SERIES_TM_T82"] = Printer.TM_T82
        constants["SERIES_TM_T83"] = Printer.TM_T83
        constants["SERIES_TM_T88"] = Printer.TM_T88
        constants["SERIES_TM_T90"] = Printer.TM_T90
        constants["SERIES_TM_T90KP"] = Printer.TM_T90KP
        constants["SERIES_TM_U220"] = Printer.TM_U220
        constants["SERIES_TM_U330"] = Printer.TM_U330
        constants["SERIES_TM_L90"] = Printer.TM_L90
        constants["SERIES_TM_H6000"] = Printer.TM_H6000
        constants["SERIES_TM_T83III"] = Printer.TM_T83III
        constants["SERIES_TM_T100"] = Printer.TM_T100
        constants["SERIES_TS_100"] = Printer.TS_100
        constants["SERIES_TM_M50"] = Printer.TM_M50
        constants["SERIES_TM_T88VII"] = Printer.TM_T88VII
        constants["SERIES_TM_L90LFC"] = Printer.TM_L90LFC
        constants["SERIES_TM_L100"] = Printer.TM_L100

        // Print commands
        constants["COMMAND_ADD_TEXT"] = PrintingCommands.COMMAND_ADD_TEXT
        constants["COMMAND_ADD_NEW_LINE"] = PrintingCommands.COMMAND_ADD_NEW_LINE
        constants["COMMAND_ADD_TEXT_STYLE"] = PrintingCommands.COMMAND_ADD_TEXT_STYLE
        constants["COMMAND_ADD_TEXT_SIZE"] = PrintingCommands.COMMAND_ADD_TEXT_SIZE
        constants["COMMAND_ADD_TEXT_SMOOTH"] = PrintingCommands.COMMAND_ADD_TEXT_SMOOTH
        constants["COMMAND_ADD_ALIGN"] = PrintingCommands.COMMAND_ADD_ALIGN
        constants["COMMAND_ADD_IMAGE_BASE_64"] = PrintingCommands.COMMAND_ADD_IMAGE_BASE_64
        constants["COMMAND_ADD_IMAGE_ASSET"] = PrintingCommands.COMMAND_ADD_IMAGE_ASSET
        constants["COMMAND_ADD_IMAGE"] = PrintingCommands.COMMAND_ADD_IMAGE
        constants["COMMAND_ADD_BARCODE"] = PrintingCommands.COMMAND_ADD_BARCODE
        constants["COMMAND_ADD_QRCODE"] = PrintingCommands.COMMAND_ADD_QRCODE
        constants["COMMAND_ADD_CUT"] = PrintingCommands.COMMAND_ADD_CUT
        constants["COMMAND_ADD_DATA"] = PrintingCommands.COMMAND_ADD_DATA
        constants["COMMAND_ADD_PULSE"] = PrintingCommands.COMMAND_ADD_PULSE
        constants["ALIGN_LEFT"] = Printer.ALIGN_LEFT
        constants["ALIGN_RIGHT"] = Printer.ALIGN_RIGHT
        constants["ALIGN_CENTER"] = Printer.ALIGN_CENTER
        constants["TRUE"] = Printer.TRUE
        constants["FALSE"] = Printer.FALSE

        // Print languages
        constants["LANG_EN"] = Printer.LANG_EN
        constants["LANG_JA"] = Printer.LANG_JA
        constants["LANG_ZH_CN"] = Printer.LANG_ZH_CN
        constants["LANG_ZH_TW"] = Printer.LANG_ZH_TW
        constants["LANG_KO"] = Printer.LANG_KO
        constants["LANG_TH"] = Printer.LANG_TH
        constants["LANG_VI"] = Printer.LANG_VI
        constants["LANG_MULTI"] = Printer.PARAM_DEFAULT

        // Print Barcodes
        constants["BARCODE_UPC_A"] = Printer.BARCODE_UPC_A
        constants["BARCODE_UPC_E"] = Printer.BARCODE_UPC_E
        constants["BARCODE_EAN13"] = Printer.BARCODE_EAN13
        constants["BARCODE_JAN13"] = Printer.BARCODE_JAN13
        constants["BARCODE_EAN8"] = Printer.BARCODE_EAN8
        constants["BARCODE_JAN8"] = Printer.BARCODE_JAN8
        constants["BARCODE_CODE39"] = Printer.BARCODE_CODE39
        constants["BARCODE_ITF"] = Printer.BARCODE_ITF
        constants["BARCODE_CODABAR"] = Printer.BARCODE_CODABAR
        constants["BARCODE_CODE93"] = Printer.BARCODE_CODE93
        constants["BARCODE_CODE128"] = Printer.BARCODE_CODE128
        constants["BARCODE_GS1_128"] = Printer.BARCODE_GS1_128
        constants["BARCODE_GS1_DATABAR_OMNIDIRECTIONAL"] = Printer.BARCODE_GS1_DATABAR_OMNIDIRECTIONAL
        constants["BARCODE_GS1_DATABAR_TRUNCATED"] = Printer.BARCODE_GS1_DATABAR_TRUNCATED
        constants["BARCODE_GS1_DATABAR_LIMITED"] = Printer.BARCODE_GS1_DATABAR_LIMITED
        constants["BARCODE_GS1_DATABAR_EXPANDED"] = Printer.BARCODE_GS1_DATABAR_EXPANDED
        constants["BARCODE_CODE128_AUTO"] = Printer.BARCODE_CODE128_AUTO
        constants["HRI_NONE"] = Printer.HRI_NONE
        constants["HRI_ABOVE"] = Printer.HRI_ABOVE
        constants["HRI_BELOW"] = Printer.HRI_BELOW
        constants["HRI_BOTH"] = Printer.HRI_BOTH
        constants["LEVEL_L"] = Printer.LEVEL_L
        constants["LEVEL_M"] = Printer.LEVEL_M
        constants["LEVEL_Q"] = Printer.LEVEL_Q
        constants["LEVEL_H"] = Printer.LEVEL_H
        constants["SYMBOL_QRCODE_MODEL_1"] = Printer.SYMBOL_QRCODE_MODEL_1
        constants["SYMBOL_QRCODE_MODEL_2"] = Printer.SYMBOL_QRCODE_MODEL_2
        constants["SYMBOL_QRCODE_MICRO"] = Printer.SYMBOL_QRCODE_MICRO

        // Print image settings
        constants["COLOR_1"] = Printer.COLOR_1
        constants["COLOR_2"] = Printer.COLOR_2
        constants["COLOR_3"] = Printer.COLOR_3
        constants["COLOR_4"] = Printer.COLOR_4

        constants["MODE_MONO"] = Printer.MODE_MONO
        constants["MODE_GRAY16"] = Printer.MODE_GRAY16
        constants["MODE_MONO_HIGH_DENSITY"] = Printer.MODE_MONO_HIGH_DENSITY

        constants["HALFTONE_DITHER"] = Printer.HALFTONE_DITHER
        constants["HALFTONE_ERROR_DIFFUSION"] = Printer.HALFTONE_ERROR_DIFFUSION
        constants["HALFTONE_THRESHOLD"] = Printer.HALFTONE_THRESHOLD

        // Add pulse settings
        constants["DRAWER_2PIN"] = Printer.DRAWER_2PIN
        constants["DRAWER_5PIN"] = Printer.DRAWER_5PIN

        return constants
    }

    fun setTimeout(timeout: Long) {
        this.timeout = timeout
    }

    fun printerIsSetup(): Boolean {
       return printer != null
    }

    fun printerIsConnected(): Boolean {
       return isConnected
    }

    suspend fun startDiscovery(portType: String, context: Context): List<HashMap<String, String>> {
        val results: MutableList<HashMap<String, String>> = mutableListOf()

        when (portType) {
            "LAN" -> {
                filterOption.portType = Discovery.PORTTYPE_TCP
            }
            "BLUETOOTH" -> {
                filterOption.portType = Discovery.PORTTYPE_BLUETOOTH
            }
            "USB" -> {
                filterOption.portType = Discovery.PORTTYPE_USB
            }
            else -> {
                filterOption.portType = Discovery.PORTTYPE_ALL
            }
        }

        printDebugLog("startDiscovery: "+portType+" filterOption.portType="+filterOption.portType.toString())

        try {
            stopDiscovery()
        } catch (e: Exception) {
            printDebugLog("something failed: "+e.message)
        }

        val scope = CoroutineScope(Dispatchers.IO)
        scope.launch {
            try {
                printDebugLog("🟢 did start discovery process")
                Discovery.start(context, filterOption, DiscoveryListener { deviceInfo ->
                    val item = HashMap<String, String>()
                    item["name"] = deviceInfo.deviceName
                    item["target"] = deviceInfo.target
                    item["ip"] = deviceInfo.ipAddress
                    item["mac"] = deviceInfo.macAddress
                    item["bt"] = deviceInfo.bdAddress
                    val usbAddress = getUSBAddress(deviceInfo.target)
                    val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager?
                    if (usbAddress != null && usbManager != null) {
                        item["usb"] = usbAddress

                        // Note: This is not working on Android 11
                        // val usbSerialNumber = getUsbSerialNumber(usbManager, usbAddress)
                        // if (usbSerialNumber != null) {
                        //     item["usbSerialNumber"] = usbSerialNumber
                        // }
                    }
                    results.add(item)
                })
            } catch (e: Exception) {
                printDebugLog("🛑 did fail to start discovery process: "+e.message)
                cancel("did fail to start discovery", e)
            }
        }
        delay(timeout)
        scope.cancel()
        return results
    }

    fun setupPrinter(context: Context, target: String, series: Int, lang: Int, promise: Promise) {
        if (printer != null) {
            // Reset printer
            printer!!.clearCommandBuffer()
            printer!!.setReceiveEventListener(null)

            printer = null
            isConnected = false
        }

        try {
            printer = Printer(series, lang, context)
            this.target = target
            printer!!.setReceiveEventListener(this)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject(UnexpectedException(e))
        }
    }

    fun beginTransaction(promise: Promise) {
        try {
            printer!!.beginTransaction()
            promise.resolve(true)
        } catch (e: Exception) {
            printDebugLog("failed to begin transaction")
            printer?.clearCommandBuffer()
            promise.reject(PrinterException(PrinterError.CMD_BEGIN_TRANSACTION))
        }
    }

    fun endTransaction(promise: Promise) {
        try {
            printer!!.endTransaction()
            promise.resolve(true)
        } catch (e: Exception) {
            printDebugLog("failed to end transaction")
            printer?.clearCommandBuffer()
            promise.reject(PrinterException(PrinterError.CMD_END_TRANSACTION))
        }
    }

    fun addCut(promise: Promise) {
        try {
            printer!!.addCut(Printer.CUT_FEED)
            promise.resolve(true)
        } catch (e: Exception) {
            printDebugLog("failed to cut paper")
            printer?.clearCommandBuffer()
            promise.reject(PrinterException(PrinterError.CMD_ADD_CUT))
        }
    }

    fun addFeedLine(line: Int, promise: Promise) {
        try {
            printer!!.addFeedLine(line)
            promise.resolve(true)
        } catch (e: Exception) {
            printDebugLog("failed to add feed line")
            printer?.clearCommandBuffer()
            promise.reject(PrinterException(PrinterError.CMD_ADD_FEED_LINE))
        }
    }

    fun addTextSize(width: Int, height: Int, promise: Promise) {
        try {
            printer!!.addTextSize(width, height)
            promise.resolve(true)
        } catch (e: Exception) {
            printDebugLog("failed to add text size")
            printer?.clearCommandBuffer()
            promise.reject(PrinterException(PrinterError.CMD_ADD_TEXT_SIZE))
        }
    }

    fun addImage(bitmap: Bitmap, imageWidth: Int, imageHeight: Int, promise: Promise) {
        try {
            printer!!.addImage(bitmap, 0, 0, imageWidth, imageHeight, Printer.COLOR_1, Printer.MODE_MONO, Printer.HALFTONE_DITHER, Printer.PARAM_DEFAULT.toDouble(), Printer.COMPRESS_AUTO )
            promise.resolve(true)
        } catch (e: Exception) {
            printDebugLog("failed to add image")
            printer?.clearCommandBuffer()
            promise.reject(PrinterException(PrinterError.CMD_ADD_IMAGE))
        }
    }

    fun addText(text: String, promise: Promise) {
        try {
            printer!!.addText(text)
            promise.resolve(true)
        } catch (e: Exception) {
            printDebugLog("failed to add text")
            printer?.clearCommandBuffer()
            promise.reject(PrinterException(PrinterError.CMD_ADD_TEXT))
        }
    }

    fun addTextAlign(align: Int, promise: Promise) {
        try {
            printer!!.addTextAlign(align)
            promise.resolve(true)
        } catch (e: Exception) {
            printDebugLog("failed to add text align")
            printer?.clearCommandBuffer()
            promise.reject(PrinterException(PrinterError.CMD_ADD_TEXT_ALIGN))
        }
    }

    fun clearBuffer(promise: Promise) {
        try {
            printer!!.clearCommandBuffer()
            promise.resolve(true)
        } catch (e: Exception) {
            printDebugLog("failed to clear buffer")
            promise.reject(PrinterException(PrinterError.CMD_CLEAR_BUFFER))
        }
    }

    fun sendData(promise: Promise) {
        try {
            printer!!.sendData(Printer.PARAM_DEFAULT)
            promise.resolve(true)
        } catch (e: Exception) {
            printDebugLog("failed to clear buffer")
            promise.reject(PrinterException(PrinterError.CMD_SEND_DATA))
        }
    }

    fun connect(promise: Promise) {
        if (printer == null) {
            promise.reject(PrinterException(PrinterError.NOT_FOUND))
            return
        }

        if (target == null) {
            promise.reject(PrinterException(PrinterError.MISSING_TARGET))
            return
        }

        try {
            printer!!.connect(target, timeout.toInt())
            isConnected = true
            promise.resolve()
        } catch (e: Exception) {
            printDebugLog("failed to connect printer")
            if (e is Epos2Exception) {
                if (e.errorStatus == Epos2Exception.ERR_PROCESSING) {
                    // If the printer is processing, wait for a while before retrying
                    Thread.sleep(disconnectInterval)
                } else {
                    // If the exception is not ERR_PROCESSING, continue in the loop without delay
                }
                val reason = getEpos2ExceptionText(e.errorStatus)
                printDebugLog("reason: ${reason} - ${e.errorStatus}")
                promise.reject(CodedException("$e.errorStatus"))
            } else {
                promise.reject(PrinterException(PrinterError.CMD_CONNECT))
            }

        }
    }

    fun disconnect(promise: Promise) {
        if (printer == null) {
            // Do nothing if we haven't setup a printer yet
            promise.resolve()
            return
        }

        var disconnected = false
        while (!disconnected) {
            try {
                printer!!.disconnect()
                disconnected = true
            } catch (e: Epos2Exception) {
                if (e.errorStatus == Epos2Exception.ERR_PROCESSING) {
                    // If the printer is processing, wait for a while before retrying
                    Thread.sleep(disconnectInterval)
                } else {
                    // If the exception is not ERR_PROCESSING, continue in the loop without delay
                }
            } catch (e: Exception) {
                // If any other exception occurs, reject the promise and break the loop
                promise.reject(UnexpectedException(e))
                break
            }
        }
        promise.resolve()
        isConnected = false
    }

    private fun stopDiscovery() {
        try {
            Discovery.stop()
            printDebugLog("🟢 did stop discovery process")
        } catch (e: Epos2Exception) {
            printDebugLog("🛑 did fail to stop discovery process: "+e.message)
        }
    }

    private fun getUSBAddress(target: String): String? {
        return if (target.contains("USB:")) {
            target.substring(4, target.length)
        } else {
            null
        }
    }

    private fun getUsbSerialNumber(usbManager: UsbManager, usbAddress: String): String? {
        val device = usbManager.deviceList?.get(usbAddress)
        if (device != null) {
            val hasPermission = usbManager.hasPermission(device)
            printDebugLog("getUsbSerialNumber(): hasPermission: $hasPermission")
            return device.serialNumber
        }
        return null
    }

    override fun onPtrReceive(printerObj: Printer?, code: Int, status: PrinterStatusInfo?, printJobId: String?) {
        printDebugLog("onPtrReceive(): code=$code, status: ${EpsonManager.makeErrorMessage(status)}, printJobId: $printJobId")
    }

    companion object {
        @JvmStatic
        fun printDebugLog(message: String) {
            if (BuildConfig.DEBUG) {
                Log.d(SDK_TAG, message)
            }
        }

        @JvmStatic
        fun getEpos2ExceptionText(state: Int): String {
            var errorText = when (state) {
                Epos2Exception.ERR_PARAM -> "ERR_PARAM"
                Epos2Exception.ERR_CONNECT -> "ERR_CONNECT"
                Epos2Exception.ERR_TIMEOUT -> "ERR_TIMEOUT"
                Epos2Exception.ERR_MEMORY -> "ERR_MEMORY"
                Epos2Exception.ERR_ILLEGAL -> "ERR_ILLEGAL"
                Epos2Exception.ERR_PROCESSING -> "ERR_PROCESSING"
                Epos2Exception.ERR_NOT_FOUND -> "ERR_NOT_FOUND"
                Epos2Exception.ERR_IN_USE -> "ERR_IN_USE"
                Epos2Exception.ERR_TYPE_INVALID -> "ERR_TYPE_INVALID"
                Epos2Exception.ERR_DISCONNECT -> "ERR_DISCONNECT"
                Epos2Exception.ERR_ALREADY_OPENED -> "ERR_ALREADY_OPENED"
                Epos2Exception.ERR_ALREADY_USED -> "ERR_ALREADY_USED"
                Epos2Exception.ERR_BOX_COUNT_OVER -> "ERR_BOX_COUNT_OVER"
                Epos2Exception.ERR_BOX_CLIENT_OVER -> "ERR_BOX_CLIENT_OVER"
                Epos2Exception.ERR_UNSUPPORTED -> "ERR_UNSUPPORTED"
                Epos2Exception.ERR_FAILURE -> "ERR_FAILURE"
                else -> String.format("%d", state)
            }
            return errorText
        }

        @JvmStatic
        private fun makeErrorMessage(status: PrinterStatusInfo?): String {
            var msg = ""
            if (status != null) {
                if (status.online == Printer.FALSE) {
                    msg += "Printer is offline"
                }
                if (status.connection == Printer.FALSE) {
                    msg += "Please check the connection of the printer and the mobile terminal.\\nConnection get lost.\\n"
                }
                if (status.coverOpen == Printer.TRUE) {
                    msg += "Please close roll paper cover.\\n"
                }
                if (status.paper == Printer.PAPER_EMPTY) {
                    msg += "Please check roll paper.\\n"
                }
                if (status.paperFeed == Printer.TRUE || status.panelSwitch == Printer.SWITCH_ON) {
                    msg += "Please release a paper feed switch.\\n"
                }
                if (status.errorStatus == Printer.MECHANICAL_ERR || status.errorStatus == Printer.AUTOCUTTER_ERR) {
                    msg += "Please remove jammed paper and close roll paper cover.\\nRemove any jammed paper or foreign substances in the printer, and then turn the printer off and turn the printer on again.\\n"
                    msg += "Then, If the printer doesn\\'t recover from error, please cycle the power switch.\\n"
                }
                if (status.errorStatus == Printer.UNRECOVER_ERR) {
                    msg += "Please cycle the power switch of the printer.\\nIf same errors occurred even power cycled, the printer may out of order."
                }
                if (status.errorStatus == Printer.AUTORECOVER_ERR) {
                    if (status.autoRecoverError == Printer.HEAD_OVERHEAT) {
                        msg += "Please wait until error LED of the printer turns off. \\n"
                        msg += "Print head of printer is hot.\\n"
                    }
                    if (status.autoRecoverError == Printer.MOTOR_OVERHEAT) {
                        msg += "Please wait until error LED of the printer turns off. \\n"
                        msg += "Motor Driver IC of printer is hot.\\n"
                    }
                    if (status.autoRecoverError == Printer.BATTERY_OVERHEAT) {
                        msg += "Please wait until error LED of the printer turns off. \\n"
                        msg += "Battery of printer is hot.\\n"
                    }
                    if (status.autoRecoverError == Printer.WRONG_PAPER) {
                        msg += "Please set correct roll paper.\\n"
                    }
                }
                if (status.batteryLevel == Printer.BATTERY_LEVEL_0) {
                    msg += "Please connect AC adapter or change the battery.\\nBattery of printer is almost empty.\\n"
                }
                if (status.removalWaiting == Printer.REMOVAL_WAIT_PAPER) {
                    msg += "Please remove paper.\\n"
                }
                if (status.unrecoverError == Printer.HIGH_VOLTAGE_ERR ||
                        status.unrecoverError == Printer.LOW_VOLTAGE_ERR) {
                    msg += "Please check the voltage status.\\n"
                }
            }
            return msg
        }
    }
}

