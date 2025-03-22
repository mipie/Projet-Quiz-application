class HistogramConsts {
  static const Map<String, String> fieldModified = {
    "fra": "Champ modifié",
    "eng": "Field modified",
  };

  static const Map<String, String> fieldNotModified = {
    "fra": "Champ non-modifié (+ de 5s)",
    "eng": "Field not modified (5+ s)",
  };

  static const Map<String, String> acceptedValues = {
    "fra": "Valeurs acceptées : ",
    "eng": "Accepted values : ",
  };

  static const Map<String, String> noMargin = {
    "fra": "Aucune marge acceptée",
    "eng": "No margin accepted",
  };

  static const Map<String, String> goodAnswer = {
    "fra": "Bonne réponse : ",
    "eng": "Good answer : ",
  };

  static const Map<String, String> badAnswers = {
    "fra": "Mauvaises réponses : ",
    "eng": "Bad answers : ",
  };

  static Map<String, Map<String, String>> translationMap = {
    "fieldModified": fieldModified,
    "fieldNotModified": fieldNotModified,
    "acceptedValues": acceptedValues,
    "noMargin": noMargin,
    "goodAnswer": goodAnswer,
    "badAnswers": badAnswers,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
