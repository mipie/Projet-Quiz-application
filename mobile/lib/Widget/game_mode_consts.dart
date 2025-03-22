class GameModeConsts {
  static const Map<String, String> chooseGameMode = {
    "fra": "Veuillez choisir le mode de jeu",
    "eng": "Please choose the game mode",
  };

  static const Map<String, String> ranked = {
    "fra": "Classé",
    "eng": "Ranked",
  };

  static const Map<String, String> classic = {
    "fra": "Classique",
    "eng": "Classic",
  };

  static const Map<String, String> friends = {
    "fra": "Amis",
    "eng": "Friends",
  };

  static const Map<String, String> entranceFee = {
    "fra": "Prix d'entrée",
    "eng": "Entrance fee",
  };

  static const Map<String, String> noQRL = {
    "fra": "*Uniquement pour QCM et QRE",
    "eng": "*Only for QCM and QRE",
  };

  static const Map<String, String> cancel = {
    "fra": "Annuler",
    "eng": "Cancel",
  };

  static const Map<String, String> confirm = {
    "fra": "Confirmer",
    "eng": "Confirm",
  };

  static Map<String, Map<String, String>> translationMap = {
    "chooseGameMode": chooseGameMode,
    "ranked": ranked,
    "classic": classic,
    "friends": friends,
    "entranceFee": entranceFee,
    "noQRL": noQRL,
    "cancel": cancel,
    "confirm": confirm,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
