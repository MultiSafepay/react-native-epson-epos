package expo.modules.epsonepos

import android.content.Context
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Log
import com.epson.epos2.Epos2Exception
import com.epson.epos2.discovery.Discovery
import com.epson.epos2.discovery.DiscoveryListener
import com.epson.epos2.discovery.FilterOption
import expo.modules.kotlin.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.Executors
import kotlin.Exception

class EpsonManager () {

    private val mFilterOption: FilterOption = FilterOption()
    private var callback: Promise? = null
    private val pool = requireNotNull( Executors.newSingleThreadExecutor())

    init {
        mFilterOption.deviceType = Discovery.TYPE_PRINTER
        mFilterOption.epsonFilter = Discovery.FILTER_NAME
        mFilterOption.deviceModel = Discovery.MODEL_ALL
        mFilterOption.usbDeviceName = Discovery.TRUE
        mFilterOption.bondedDevices = Discovery.TRUE
    }

    suspend fun startDiscovery(context: Context): List<HashMap<String, String>> {
        val results: MutableList<HashMap<String, String>> = mutableListOf()

        val scope = CoroutineScope(Dispatchers.IO)
        val job = scope.launch {
            try {
                Log.d(SDK_TAG, "🟢 did start to start discovery process")
                Discovery.start(context, mFilterOption, DiscoveryListener { deviceInfo ->
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
                    Log.d(SDK_TAG, "Device found: "+item["name"])
                })
            } catch (e: Exception) {
                Log.d(SDK_TAG, "🛑 did fail to start discovery process: "+e.message)
                cancel("did fail to start discovery", e)
            }
        }
        delay(5000)
        scope.cancel()
        return results
    }

    /*
    suspend fun startDiscovery(context: Context) {
        stopDiscovery()
        val scope = CoroutineScope(Dispatchers.IO)
        scope.launch {
            try {
                Discovery.start(context,
                    mFilterOption,
                    DiscoveryListener { deviceInfo ->
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
                        Log.d(SDK_TAG, "Device found: "+item["name"])
                    })
                Log.d(SDK_TAG, "🟢 did start to start discovery process")
            } catch (e: Exception) {
                Log.d(SDK_TAG, "🛑 did fail to start discovery process: "+e.message)
                //promise.resolve(UnexpectedException(e))
                // TODO: List the list of discovered printers
                return@launch
            }
        }

        delay(5000)
        scope.cancel()
    }
     */

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

