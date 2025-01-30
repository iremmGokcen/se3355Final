import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector) // Tarayıcı dilini otomatik algılar
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "Welcome": "Welcome",
          "Rent a Car": "Rent a Car",
          "Pickup Office": "Pickup Office",
          "Dropoff Office": "Dropoff Office",
          "Pickup Date": "Pickup Date",
          "Dropoff Date": "Dropoff Date",
          "Search": "Search",
          "Logout": "Logout",
        }
      },
      tr: {
        translation: {
          "Welcome": "Hoş Geldiniz",
          "Rent a Car": "Araç Kirala",
          "Pickup Office": "Teslim Alma Ofisi",
          "Dropoff Office": "İade Ofisi",
          "Pickup Date": "Alış Tarihi",
          "Dropoff Date": "İade Tarihi",
          "Search": "Ara",
          "Logout": "Çıkış Yap",
        }
      }
    },
    fallbackLng: "tr", // Eğer tarayıcı dilini algılayamazsa Türkçe kullan
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
