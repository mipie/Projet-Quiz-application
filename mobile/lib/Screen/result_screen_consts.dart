class ResultScreenConsts {
  static const Map<String, String> previous = {
    "fra": "Précédente",
    "eng": "Previous",
  };

  static const Map<String, String> next = {
    "fra": "Suivante",
    "eng": "Next",
  };

  static const Map<String, String> mainMenu = {
    "fra": "Menu principal",
    "eng": "Main menu",
  };

  static Map<String, Map<String, String>> translationMap = {
    "previous": previous,
    "next": next,
    "mainMenu": mainMenu,
  };

  static String get(String key, String selectedLanguage) {
    print("key : $key, selectedLanguage : $selectedLanguage");
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
