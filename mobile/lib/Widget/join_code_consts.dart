class JoinCodeConsts {
  static const Map<String, String> roomsCode = {
    "fra": "Code de la salle",
    "eng": "Room's code",
  };

  static const Map<String, String> cancel = {
    "fra": "Annuler",
    "eng": "Cancel",
  };

  static const Map<String, String> enter = {
    "fra": "Entrer",
    "eng": "Enter",
  };

  static Map<String, Map<String, String>> translationMap = {
    "roomsCode": roomsCode,
    "cancel": cancel,
    "enter": enter,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
