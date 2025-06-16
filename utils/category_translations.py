"""
Category translations utility for mapping between technical names and display names.
This ensures consistency between backend processing and frontend display.
"""

# Mapping between technical names (used in backend/data) and display names (shown to users)
CATEGORY_TRANSLATIONS = {
    "Role i Współpraca": "Role i współpraca",
    "Szkolenie": "Szkolenia",
    "Działania i Przepływ": "Aktywności i procesy",
    "Podejmowanie Decyzji": "Podejmowanie decyzji",
    "Procesy ZW": "Procesy zarządzania wiedzą",
    "Techniki ZW": "Technologie zarządzania wiedzą",
    "Metody": "Metody",
    "Komputeryzacja i Oprogramowanie": "Oprogramowanie i infrastruktura IT"
}

# Reverse mapping: Display name -> Technical name
DISPLAY_TO_TECHNICAL = {display: technical for technical, display in CATEGORY_TRANSLATIONS.items()}


def get_display_name(technical_name: str) -> str:
    """Convert technical name to user-friendly display name."""
    return CATEGORY_TRANSLATIONS.get(technical_name, technical_name)


def get_technical_name(display_name: str) -> str:
    """Convert display name back to technical name."""
    return DISPLAY_TO_TECHNICAL.get(display_name, display_name)


def get_all_technical_names() -> list:
    """Get all technical names."""
    return list(CATEGORY_TRANSLATIONS.keys())


def get_all_display_names() -> list:
    """Get all display names."""
    return list(CATEGORY_TRANSLATIONS.values())
