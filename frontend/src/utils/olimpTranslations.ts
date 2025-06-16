// Mapowanie między nazwami technicznymi (używanymi w backendzie) a nazwami wyświetlanymi dla OLIMP
export const OLIMP_SECTION_TRANSLATIONS = {
  // Technical name -> Display name
  "TECHNOLOGY AND INFRASTRUCTURE": "Technologie i infrastruktura",
  "DATA": "Dane",
  "PEOPLE AND COMPETENCIES": "Ludzie i kompetencje",
  "ORGANIZATION AND PROCESSES": "Organizacja i procesy",
  "STRATEGY AND MANAGEMENT": "Strategia i zarządzanie",
  "BUDGET": "Budżet",
  "PRODUCTS AND SERVICES": "Produkty i usługi",
  "ETHICS AND REGULATIONS": "Etyka i regulacje"
} as const;

// Reverse mapping: Display name -> Technical name
export const OLIMP_DISPLAY_TO_TECHNICAL = Object.entries(OLIMP_SECTION_TRANSLATIONS).reduce(
  (acc, [technical, display]) => {
    acc[display] = technical;
    return acc;
  },
  {} as Record<string, string>
);

// Helper functions
export function getOlimpTechnicalName(displayName: string): string {
  return OLIMP_DISPLAY_TO_TECHNICAL[displayName] || displayName;
}

export function getOlimpDisplayName(technicalName: string): string {
  return OLIMP_SECTION_TRANSLATIONS[technicalName as keyof typeof OLIMP_SECTION_TRANSLATIONS] || technicalName;
}

// Get all technical names (for backend communication)
export function getAllOlimpTechnicalNames(): string[] {
  return Object.keys(OLIMP_SECTION_TRANSLATIONS);
}

// Get all display names (for UI)
export function getAllOlimpDisplayNames(): string[] {
  return Object.values(OLIMP_SECTION_TRANSLATIONS);
}

// Area descriptions in Polish
export const OLIMP_AREA_DESCRIPTIONS = {
  "Technologie i infrastruktura": "Skupienie na infrastrukturze IT, adoptacji chmury i zdolnościach technicznych",
  "Dane": "Skupienie na jakości danych, zarządzaniu, automatyzacji i analityce",
  "Ludzie i kompetencje": "Skupienie na umiejętnościach zespołu, szkoleniach i rozwoju kompetencji AI",
  "Organizacja i procesy": "Skupienie na strukturze organizacyjnej, przepływach pracy i integracji procesów",
  "Strategia i zarządzanie": "Skupienie na długoterminowej strategii AI, ocenie wpływu na biznes i zarządzaniu",
  "Budżet": "Skupienie na planowaniu finansowym, alokacji zasobów i priorytetach inwestycyjnych",
  "Produkty i usługi": "Skupienie na produktach wzbogaconych AI, automatyzacji i doświadczeniu klienta",
  "Etyka i regulacje": "Skupienie na etyce AI, zgodności, ochronie danych i przestrzeganiu przepisów"
} as const;
