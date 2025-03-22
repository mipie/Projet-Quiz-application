class ObserverScreenConsts {
  static const Map<String, String> organizerQuit = {
    "fra": "L'organisateur a quitté la partie.",
    "eng": "The organizer has quit the game.",
  };

  static const Map<String, String> organizer = {
    "fra": "Organisateur",
    "eng": "Organizer",
  };

  static Map<String, Map<String, String>> translationMap = {
    "organizer": organizer,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
