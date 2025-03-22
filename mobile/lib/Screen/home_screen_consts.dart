class HomeScreenConsts {
  static const Map<String, String> kamPaf = {
    "fra": "KAM? PAF!",
    "eng": "KAM? PAF!",
  };

  static const Map<String, String> quizGames = {
    "fra": "Jeux-questionnaires",
    "eng": "Quiz Games",
  };

  static const Map<String, String> joinGame = {
    "fra": "Joindre une partie",
    "eng": "Join a game",
  };

  static const Map<String, String> createGame = {
    "fra": "Créer une partie",
    "eng": "Create a game",
  };

  static const Map<String, String> team107 = {
    "fra": "Équipe 107",
    "eng": "Team 107",
  };

  static Map<String, Map<String, String>> translationMap = {
    "kamPaf": kamPaf,
    "quizGames": quizGames,
    "joinGame": joinGame,
    "createGame": createGame,
    "team107": team107,
  };

  // Helper function to get translation
  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
