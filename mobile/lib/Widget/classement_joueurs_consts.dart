class ClassementWidgetConsts {
  static const Map<String, String> leaderboard = {
    "fra": "CLASSEMENT",
    "eng": "LEADERBOARD",
  };

  static const Map<String, String> players = {
    "fra": "Joueur",
    "eng": "Player",
  };

  static const Map<String, String> state = {
    "fra": "État",
    "eng": "State",
  };

  static const Map<String, String> place = {
    "fra": "Position",
    "eng": "Place",
  };

  static const Map<String, String> view = {
    "fra": "Vue  ",
    "eng": "View ",
  };

  static Map<String, Map<String, String>> translationMap = {
    "leaderboard": leaderboard,
    "players": players,
    "state": state,
    "place": place,
    "view": view,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
