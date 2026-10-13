import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEsHn from '@angular/common/locales/es-HN';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Habilita el locale es-HN para los pipes de Angular (currency, date, etc.)
registerLocaleData(localeEsHn);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
