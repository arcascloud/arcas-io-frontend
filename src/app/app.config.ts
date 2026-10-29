import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';
import { FilterMatchMode } from 'primeng/api';
import { MessageService, ConfirmationService } from 'primeng/api';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

const ArcasPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef4f9',
      100: '#dbe7f0',
      200: '#b9d0e3',
      300: '#93b7d3',
      400: '#6f9dc0',
      500: '#4a7ba8',
      600: '#3d6690',
      700: '#39495b',
      800: '#28425c',
      900: '#1f3448',
      950: '#1e2e3b',
    },
    colorScheme: {
      dark: {
        surface: {
          0: '#ffffff',
          50: '#eef3f8',
          100: '#d9e4ef',
          200: '#b4c8de',
          300: '#8aa9c9',
          400: '#5f86ab',
          500: '#3d6690',
          600: '#2c4d6f',
          700: '#213a56',
          800: '#213546',
          900: '#1e2e3b' /* p-menu bar*/,
          950: '#28425c',
        },
        primary: {
          color: '{primary.700}',
          contrastColor: '{surface.800}',
          hoverColor: '{primary.700}' /* color de input */,
          activeColor: '{primary.700}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.200}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
          color: 'rgba(255, 255, 255, 0.88)',
          focusColor: 'rgba(255,255,255,.98)',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    MessageService,
    ConfirmationService,
    providePrimeNG({
      filterMatchModeOptions: {
        text: [
          FilterMatchMode.STARTS_WITH,
          FilterMatchMode.CONTAINS,
          FilterMatchMode.NOT_CONTAINS,
          FilterMatchMode.ENDS_WITH,
          FilterMatchMode.EQUALS,
          FilterMatchMode.NOT_EQUALS,
        ],
        numeric: [
          FilterMatchMode.EQUALS,
          FilterMatchMode.NOT_EQUALS,
          FilterMatchMode.LESS_THAN,
          FilterMatchMode.LESS_THAN_OR_EQUAL_TO,
          FilterMatchMode.GREATER_THAN,
          FilterMatchMode.GREATER_THAN_OR_EQUAL_TO,
        ],
        date: [
          FilterMatchMode.DATE_IS,
          FilterMatchMode.DATE_IS_NOT,
          FilterMatchMode.DATE_BEFORE,
          FilterMatchMode.DATE_AFTER,
        ],
      },
      theme: {
        preset: ArcasPreset,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
        },
      },
      ripple: true,
    }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
