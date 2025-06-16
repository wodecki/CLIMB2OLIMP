# Translation mapping between technical names (used in backend) and display names
CATEGORY_TRANSLATIONS = {
    # Technical name -> Display name
    "Role i Współpraca": "Role i Współpraca",
    "Szkolenie": "Szkolenia",
    "Działania i Przepływ": "Aktywności i procesy", 
    "Podejmowanie Decyzji": "Podejmowanie Decyzji",
    "Procesy ZW": "Procesy zarządzania wiedzą",
    "Techniki ZW": "Technologie zarządzania wiedzą",
    "Metody": "Metody",
    "Komputeryzacja i Oprogramowanie": "Oprogramowanie i infrastruktura IT"
}

# Reverse mapping: Display name -> Technical name
DISPLAY_TO_TECHNICAL = {v: k for k, v in CATEGORY_TRANSLATIONS.items()}

def get_display_name(technical_name: str) -> str:
    """Convert technical category name to display name for user-facing output"""
    return CATEGORY_TRANSLATIONS.get(technical_name, technical_name)

def get_technical_name(display_name: str) -> str:
    """Convert display name back to technical name for backend processing"""
    return DISPLAY_TO_TECHNICAL.get(display_name, display_name)

def get_all_technical_names():
    """Get all technical names (for backend communication)"""
    return list(CATEGORY_TRANSLATIONS.keys())

def get_all_display_names():
    """Get all display names (for UI)"""
    return list(CATEGORY_TRANSLATIONS.values())