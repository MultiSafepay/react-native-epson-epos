package expo.modules.epsonepos

import android.content.Context
import android.graphics.Bitmap
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Log
import com.epson.epos2.Epos2Exception
import com.epson.epos2.discovery.Discovery
import com.epson.epos2.discovery.DiscoveryListener
import com.epson.epos2.discovery.FilterOption
import com.epson.epos2.printer.Printer
import expo.modules.kotlin.Promise
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

class EpsonManager () {
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

        Log.d(SDK_TAG, "startDiscovery: "+portType+" filterOption.portType="+filterOption.portType.toString())

        try {
            stopDiscovery()
        } catch (e: Exception) {
            Log.d(SDK_TAG, "something failed: "+e.message)
        }

        val scope = CoroutineScope(Dispatchers.IO)
        scope.launch {
            try {
                Log.d(SDK_TAG, "🟢 did start discovery process")
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
                        val usbSerialNumber = getUsbSerialNumber(usbManager, usbAddress)
                        if (usbSerialNumber != null) {
                            item["usbSerialNumber"] = usbSerialNumber
                        }
                    }
                    results.add(item)
                })
            } catch (e: Exception) {
                Log.d(SDK_TAG, "🛑 did fail to start discovery process: "+e.message)
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
        }

        try {
            printer = Printer(series, lang, context)
            this.target = target
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject(UnexpectedException(e))
        }
    }

    fun connectPrinter(promise: Promise) {
        try {
            if (isConnected) {
                printer!!.disconnect()
            }
        } catch (e: Exception) {
            Log.d(SDK_TAG, "failed to connect: could not disconnect target=$target")
        }

        try {
            Log.d(SDK_TAG, "Will connect to: $target")
            printer!!.connect(target!!, Printer.PARAM_DEFAULT)
            isConnected = true
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject(UnexpectedException(e))
        }
    }

    fun disconnectPrinter(promise: Promise) {
        try {
            printer?.disconnect()
            isConnected = false
            Thread.sleep(disconnectInterval)

            promise.resolve(true)
        } catch (e: Exception) {
            var errorMessage: String? = null;
            if (e is Epos2Exception) {
                //Note: If printer is processing such as printing and so on, the disconnect API returns ERR_PROCESSING.
                if (e.errorStatus == Epos2Exception.ERR_PROCESSING) {
                    Thread.sleep(disconnectInterval)
                } else {
                    errorMessage = "Status: ${e.errorStatus}, Reason: $e.message"
                }
            } else {
                errorMessage = e.message
            }

            Log.d(SDK_TAG, "failed to disconnect (target=$target): $errorMessage")
            promise.reject(UnexpectedException(e))
        }
    }

    fun printImage(bitmap: Bitmap, imageWidth: Int, imageHeight: Int, promise: Promise) {
        try {
            printer!!.addPulse(Printer.PARAM_DEFAULT, Printer.PARAM_DEFAULT)
            printer!!.addTextAlign(Printer.ALIGN_CENTER)
            printer!!.addImage(bitmap, 0, 0, imageWidth, imageHeight, Printer.COLOR_1, Printer.MODE_MONO, Printer.HALFTONE_DITHER, Printer.PARAM_DEFAULT.toDouble(), Printer.COMPRESS_AUTO )

            printer!!.addCut(Printer.CUT_FEED);

            printer!!.sendData(Printer.PARAM_DEFAULT)
            // After printing we must clear the bugger
            printer!!.clearCommandBuffer()

            // Add a delay to prevent potential issues
            Thread.sleep(disconnectInterval)
            promise.resolve(true)
        } catch (e: Exception) {
            printer?.clearCommandBuffer()
            promise.reject(UnexpectedException(e))
        }
    }

    fun cutPaper(promise: Promise) {
        try {
            printer!!.addCut(Printer.CUT_FEED)
        } catch (e: Exception) {
            printer?.clearCommandBuffer()
            promise.resolve(true)
        }
    }

    private fun stopDiscovery() {
        try {
            Discovery.stop()
            Log.d(SDK_TAG, "🟢 did stop discovery process")
        } catch (e: Epos2Exception) {
            Log.d(SDK_TAG, "🛑 did fail to stop discovery process: "+e.message)
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            val device = usbManager.deviceList?.get(usbAddress)
            if (device != null) {
                return device.serialNumber
            }
        }
        return null
    }
}

