class OrganizerScreenConsts {
  static const Map<String, String> wantToAbandon = {
    "fra": "Êtes vous sûr de vouloir abandonner la partie?",
    "eng": "Are your sure you want to abandon the game?",
  };

  static const Map<String, String> cancel = {
    "fra": "Annuler",
    "eng": "Cancel",
  };

  static const Map<String, String> confirm = {
    "fra": "Confirmer",
    "eng": "Confirm",
  };

  static const Map<String, String> nbAnswersLeft = {
    "fra": "Réponse(s) restante(s) à évaluer : ",
    "eng": "Answer(s) left to grade : ",
  };

  static const Map<String, String> allPlayersAnswered = {
    "fra": "Tous les joueurs ont fini de répondre à la question.",
    "eng": "All the players are done answering the question.",
  };

  static const Map<String, String> nextQuestion = {
    "fra": "Question suivante",
    "eng": "Next question",
  };

  static const Map<String, String> showResults = {
    "fra": "Présenter les résultats",
    "eng": "Show the results",
  };

  static const Map<String, String> timeLeft = {
    "fra": "Temps \nrestant:",
    "eng": "Time \nleft: ",
  };

  static Map<String, Map<String, String>> translationMap = {
    "wantToAbandon": wantToAbandon,
    "cancel": cancel,
    "confirm": confirm,
    "nbAnswersLeft": nbAnswersLeft,
    "allPlayersAnswered": allPlayersAnswered,
    "nextQuestion": nextQuestion,
    "showResults": showResults,
    "timeLeft": timeLeft,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
