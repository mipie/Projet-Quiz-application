class SessionScreenConsts {
  static const Map<String, String> createGame = {
    "fra": "Créer une partie",
    "eng": "Create a game",
  };

  static const Map<String, String> listGames = {
    "fra": "Liste des jeux",
    "eng": "List of games",
  };

  static const Map<String, String> description = {
    "fra": "Description",
    "eng": "Description",
  };

  static const Map<String, String> questionsDuration = {
    "fra": "Durée des questions",
    "eng": "Questions' duration",
  };

  static const Map<String, String> questions = {
    "fra": "Questions",
    "eng": "Questions",
  };

  static Map<String, Map<String, String>> translationMap = {
    "createGame": createGame,
    "listGames": listGames,
    "description": description,
    "questionsDuration": questionsDuration,
    "questions": questions,
  };

  // Helper function to get translation
  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
