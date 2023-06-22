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
import expo.modules.kotlin.exception.UnexpectedException

class EpsonManager () {

    private val mFilterOption: FilterOption = FilterOption()
    // private val mUsbManager: UsbManager? = null

    init {
        mFilterOption.deviceType = Discovery.TYPE_PRINTER
        mFilterOption.epsonFilter = Discovery.FILTER_NAME
        mFilterOption.deviceModel = Discovery.MODEL_ALL
        mFilterOption.usbDeviceName = Discovery.TRUE
        mFilterOption.bondedDevices = Discovery.TRUE
    }

    fun startDiscovery(context: Context, promise: Promise) {
        // Stop any previous discovery process
        stopDiscovery()

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
                    promise.resolve(item)
            })
            Log.d(SDK_TAG, "🟢 did start to start discovery process")
        } catch (e: Exception) {
            Log.d(SDK_TAG, "🛑 did fail to start discovery process: "+e.message)
            promise.reject(UnexpectedException(e))
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

