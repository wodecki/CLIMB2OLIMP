// Mapowanie między nazwami technicznymi (używanymi w backendzie) a nazwami wyświetlanymi
export const CATEGORY_TRANSLATIONS = {
  // Technical name -> Display name
  "Role i Współpraca": "Role i Współpraca",
  "Szkolenie": "Szkolenia",
  "Działania i Przepływ": "Aktywności i procesy", 
  "Podejmowanie Decyzji": "Podejmowanie Decyzji",
  "Procesy ZW": "Procesy zarządzania wiedzą",
  "Techniki ZW": "Technologie zarządzania wiedzą",
  "Metody": "Metody",
  "Komputeryzacja i Oprogramowanie": "Oprogramowanie i infrastruktura IT"
} as const;

// Reverse mapping: Display name -> Technical name
export const DISPLAY_TO_TECHNICAL = Object.entries(CATEGORY_TRANSLATIONS).reduce(
  (acc, [technical, display]) => {
    acc[display] = technical;
    return acc;
  },
  {} as Record<string, string>
);

// Helper functions
export function getTechnicalName(displayName: string): string {
  return DISPLAY_TO_TECHNICAL[displayName] || displayName;
}

export function getDisplayName(technicalName: string): string {
  return CATEGORY_TRANSLATIONS[technicalName as keyof typeof CATEGORY_TRANSLATIONS] || technicalName;
}

// Get all technical names (for backend communication)
export function getAllTechnicalNames(): string[] {
  return Object.keys(CATEGORY_TRANSLATIONS);
}

// Get all display names (for UI)
export function getAllDisplayNames(): string[] {
  return Object.values(CATEGORY_TRANSLATIONS);
}