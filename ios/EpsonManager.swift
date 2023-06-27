
struct EpsonManager {
  
  private var timeout: Float = 3000
    
  mutating func setTimeout(_ timeout: Float) {
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
    fatalError("TODO: printerIsConnected")
  }
  
  func printerIsConnected() -> Bool {
    fatalError("TODO: printerIsConnected")
  }
  
}
