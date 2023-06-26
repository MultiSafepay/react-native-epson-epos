import {
  PrinterLanguage,
  PrinterSeriesName,
} from "./ReactNativeEpsonEpos.types";
import { PRINTER_LANGUAGE, PRINTER_SERIES } from "./constants";

/**
 * @param language the language code
 * @returns the language code of the printer depeding ot the passed language param, defaults to EPOS2_LANG_EN
 */
export function getPrinterLanguage(language: PrinterLanguage): number {
  let lang;
  if (typeof PRINTER_LANGUAGE[language] === "number") {
    lang = PRINTER_LANGUAGE[language];
  } else {
    console.warn("An invalid parameter of language was passed.");
    lang = PRINTER_LANGUAGE.LANG_EN;
  }
  return lang;
}

export function getPrinterSeriesByName(
  printerName: PrinterSeriesName
): PrinterSeriesName {
  const keys = Object.keys(PRINTER_SERIES);
  const seriesName = keys.find((series) => {
    const [, , model] = series.split("_");
    return printerName.toLowerCase().includes(model?.toLowerCase?.());
  }) as PrinterSeriesName | undefined;

  return seriesName ?? "SERIES_TM_T20";
}
