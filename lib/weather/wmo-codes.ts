/**
 * PlanSafe India — WMO Weather Code Translator
 * Maps standard World Meteorological Organization (WMO) numerical weather codes
 * into standardized identifiers, plain English, and plain Hindi descriptions.
 */

export interface WmoWeatherCondition {
  code: string;
  textEn: string;
  textHi: string;
  isPrecipitation: boolean;
  isHighWindRisk: boolean;
}

const WMO_MAP: Record<number, WmoWeatherCondition> = {
  0: {
    code: "clear",
    textEn: "Clear Sky",
    textHi: "साफ आसमान",
    isPrecipitation: false,
    isHighWindRisk: false,
  },
  1: {
    code: "mostly_clear",
    textEn: "Mainly Clear",
    textHi: "मुख्यतः साफ",
    isPrecipitation: false,
    isHighWindRisk: false,
  },
  2: {
    code: "partly_cloudy",
    textEn: "Partly Cloudy",
    textHi: "आंशिक रूप से बादल",
    isPrecipitation: false,
    isHighWindRisk: false,
  },
  3: {
    code: "overcast",
    textEn: "Overcast",
    textHi: "बादल छाए रहेंगे",
    isPrecipitation: false,
    isHighWindRisk: false,
  },
  45: {
    code: "fog",
    textEn: "Fog",
    textHi: "कोहरा",
    isPrecipitation: false,
    isHighWindRisk: false,
  },
  48: {
    code: "depositing_rime_fog",
    textEn: "Depositing Rime Fog",
    textHi: "घना कोहरा",
    isPrecipitation: false,
    isHighWindRisk: false,
  },
  51: {
    code: "light_drizzle",
    textEn: "Light Drizzle",
    textHi: "हल्की बूंदाबांदी",
    isPrecipitation: true,
    isHighWindRisk: false,
  },
  53: {
    code: "moderate_drizzle",
    textEn: "Moderate Drizzle",
    textHi: "मध्यम बूंदाबांदी",
    isPrecipitation: true,
    isHighWindRisk: false,
  },
  55: {
    code: "dense_drizzle",
    textEn: "Dense Drizzle",
    textHi: "तेज बूंदाबांदी",
    isPrecipitation: true,
    isHighWindRisk: false,
  },
  61: {
    code: "light_rain",
    textEn: "Slight Rain",
    textHi: "हल्की बारिश",
    isPrecipitation: true,
    isHighWindRisk: false,
  },
  63: {
    code: "moderate_rain",
    textEn: "Moderate Rain",
    textHi: "मध्यम बारिश",
    isPrecipitation: true,
    isHighWindRisk: false,
  },
  65: {
    code: "heavy_rain",
    textEn: "Heavy Rain",
    textHi: "भारी बारिश",
    isPrecipitation: true,
    isHighWindRisk: false,
  },
  80: {
    code: "slight_rain_showers",
    textEn: "Slight Rain Showers",
    textHi: "हल्की बारिश की बौछारें",
    isPrecipitation: true,
    isHighWindRisk: false,
  },
  81: {
    code: "moderate_rain_showers",
    textEn: "Moderate Rain Showers",
    textHi: "मध्यम बारिश की बौछारें",
    isPrecipitation: true,
    isHighWindRisk: false,
  },
  82: {
    code: "violent_rain_showers",
    textEn: "Violent Rain Showers",
    textHi: "तीव्र बारिश की बौछारें",
    isPrecipitation: true,
    isHighWindRisk: true,
  },
  95: {
    code: "thunderstorm",
    textEn: "Thunderstorm",
    textHi: "गरज के साथ तूफान",
    isPrecipitation: true,
    isHighWindRisk: true,
  },
  96: {
    code: "thunderstorm_slight_hail",
    textEn: "Thunderstorm with Slight Hail",
    textHi: "ओलावृष्टि के साथ आंधी-तूफान",
    isPrecipitation: true,
    isHighWindRisk: true,
  },
  99: {
    code: "thunderstorm_heavy_hail",
    textEn: "Thunderstorm with Heavy Hail",
    textHi: "भारी ओलावृष्टि व आंधी-तूफान",
    isPrecipitation: true,
    isHighWindRisk: true,
  },
};

const DEFAULT_CONDITION: WmoWeatherCondition = {
  code: "unknown",
  textEn: "Variable Conditions",
  textHi: "परिवर्तनशील मौसम",
  isPrecipitation: false,
  isHighWindRisk: false,
};

export function interpretWmoCode(code: number): WmoWeatherCondition {
  return WMO_MAP[code] ?? DEFAULT_CONDITION;
}
