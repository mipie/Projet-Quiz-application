class GameScreenConsts {
  static const Map<String, String> organizerQuit = {
    "fra": "L'organisateur a quitté la partie.",
    "eng": "The organizer has quit the game.",
  };

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

  static const Map<String, String> bonusQCM = {
    "fra": "+20% pour avoir répondu correctement en 1er(e)!",
    "eng": "+20% for having answered correctly first!",
  };

  static const Map<String, String> bonusQRE = {
    "fra": "+20% pour avoir eu la réponse exacte!",
    "eng": "+20% for having the exact answer!",
  };

  static const Map<String, String> waitingOnOthers = {
    "fra": "En attente que les autres joueurs finissent...",
    "eng": "Waiting for the other players to finish...",
  };

  static const Map<String, String> organizerMovingOn = {
    "fra": "L'organisateur passera à la suite d'ici peu...",
    "eng": "The organizer will be moving on shortly...",
  };

  static const Map<String, String> organizerGrading = {
    "fra": "L'organisateur évalue les réponses...",
    "eng": "The organizer is evaluating the answers...",
  };

  static const Map<String, String> organizerActivatedPanic = {
    "fra": "Dépêchez-vous! L'organisateur a activé le mode panique.",
    "eng": "Hurry up! The organizer has actived panic mode.",
  };

  static const Map<String, String> organizerFrozeTime = {
    "fra": "L'organisateur a arrêté le temps!",
    "eng": "The organizer has frozen time!",
  };

  static const Map<String, String> enterAnswer = {
    "fra": "Entrez votre réponse...",
    "eng": "Enter your answer...",
  };

  static const Map<String, String> valueSelected = {
    "fra": "Valeur sélectionnée : ",
    "eng": "Value selected : ",
  };

  static const Map<String, String> toleranceMargin = {
    "fra": "Marge de tolérance : ± ",
    "eng": "Tolerance margin : ± ",
  };

  static Map<String, Map<String, String>> translationMap = {
    "wantToAbandon": wantToAbandon,
    "cancel": cancel,
    "confirm": confirm,
    "bonusQCM": bonusQCM,
    "bonusQRE": bonusQRE,
    "waitingOnOthers": waitingOnOthers,
    "organizerMovingOn": organizerMovingOn,
    "organizerGrading": organizerGrading,
    "organizerActivatedPanic": organizerActivatedPanic,
    "organizerFrozeTime": organizerFrozeTime,
    "enterAnswer": enterAnswer,
    "valueSelected": valueSelected,
    "toleranceMargin": toleranceMargin,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
