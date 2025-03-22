class ChatScreenConsts {
  static const Map<String, String> room = {
    "fra": "Salle : ",
    "eng": "Room : ",
  };

  static const Map<String, String> cannotSendMessage = {
    "fra": "Vous ne pouvez plus envoyer de messages.",
    "eng": "You can no longer send messages.",
  };

  static const Map<String, String> orgHasMuteYou = {
    "fra": "L'organisateur vous a rendu muet.",
    "eng": "The organizer has muted you.",
  };

  static const Map<String, String> enterMessage = {
    "fra": "Saisissez votre message...",
    "eng": "Enter your message...",
  };

  static Map<String, Map<String, String>> translationMap = {
    "room": room,
    "cannotSendMessage": cannotSendMessage,
    "orgHasMuteYou": orgHasMuteYou,
    "enterMessage": enterMessage,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
