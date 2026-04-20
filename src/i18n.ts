// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  // Détecte la langue du navigateur et la sauvegarde
  .use(LanguageDetector)
  // Permet de charger les fichiers JSON via HTTP
  .use(Backend)
  // Passe l'instance i18n à react-i18next
  .use(initReactI18next)
  .init({
    // Dossier où se trouvent les fichiers JSON
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    // Langue par défaut si la détection échoue
    fallbackLng: 'en',
    // Pour le développement, on peut afficher les clés manquantes
    debug: false,
    interpolation: {
      escapeValue: false, // React protège déjà contre les attaques XSS
    },
    // Liste des langues supportées
    supportedLngs: ['en', 'fr', 'ar'],
    // Détection explicite de la langue pour le RTL
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;