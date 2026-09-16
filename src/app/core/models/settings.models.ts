export interface CampoSetting {
  key: string;
  label: string;
  tipo: 'texto' | 'numero' | 'select';
  opciones?: { label: string; value: string }[];
}

export interface SettingsConfig {
  titulo: string;
  subtitulo: string;
  campos: CampoSetting[];
  /** ID del módulo en tmodulos para la tabla unificada ttipoparametros */
  moduloId?: number;
}

/**
 * Configuración de parámetros por módulo.
 * Usa la tabla unificada ttipoparametros.
 */
export const SETTINGS: Record<string, SettingsConfig> = {
  'param-ia': {
    titulo: 'Configuración de IA',
    subtitulo: 'Proveedores y modelos de inteligencia artificial',
    campos: [
      {
        key: 'proveedor',
        label: 'Proveedor',
        tipo: 'select',
        opciones: [
          { label: 'ZenMux', value: 'zenmux' },
          { label: 'OpenAI', value: 'openai' },
          { label: 'Anthropic', value: 'anthropic' },
          { label: 'Otro', value: 'otro' },
        ],
      },
      { key: 'modelo', label: 'Modelo', tipo: 'texto' },
      { key: 'apiKey', label: 'API Key', tipo: 'texto' },
      { key: 'baseUrl', label: 'Base URL', tipo: 'texto' },
      { key: 'temperatura', label: 'Temperatura', tipo: 'numero' },
      { key: 'maxTokens', label: 'Max Tokens', tipo: 'numero' },
    ],
  },
};