class DisplayChatConsts {
  static const Map<String, String> joinPlateform = {
    "fra": "a rejoint la plateforme.",
    "eng": "has joined the platform.",
  };

  static const Map<String, String> joinCanal = {
    "fra": "a joint le canal.",
    "eng": "has joined the channel.",
  };

  static const Map<String, String> joinRoom = {
    "fra": "a rejoint la partie.",
    "eng": "has joined the room.",
  };

  static const Map<String, String> quit = {
    "fra": "a quitté le canal.",
    "eng": "has left the channel.",
  };

  static const Map<String, String> abandon = {
    "fra": "a abandonné la partie.",
    "eng": "has abandonned the game.",
  };

  static const Map<String, String> createChannel = {
    "fra": "Ce canal a été créé par :",
    "eng": "This channel has been created by :",
  };

  static const Map<String, String> createGameChannel = {
    "fra": "Cette salle de jeu a été ouverte par :",
    "eng": "This room has been opened by :",
  };

  static const Map<String, String> delete = {
    "fra": "a supprimé le canal.",
    "eng": "has deleted the channel.",
  };

  static const Map<String, String> creatorDeleted = {
    "fra": "Le créateur a fermé la salle.",
    "eng": "The creator has closed the room.",
  };

  static const Map<String, String> hasBeenDeleted = {
    "fra": "La salle de jeu a été fermée, car il ne reste que vous.",
    "eng": "The room has been closed because you are the only one left.",
  };

  static const Map<String, String> loadError = {
    "fra": "Il y a eu une erreur!",
    "eng": "There was an error!",
  };

  static Map<String, Map<String, String>> translationMap = {
    "joinPlateform": joinPlateform,
    "joinCanal": joinCanal,
    "joinRoom": joinRoom,
    "quit": quit,
    "abandon": abandon,
    "creatorDeleted": creatorDeleted,
    "hasBeenDeleted": hasBeenDeleted,
    "delete": delete,
    "createChannel": createChannel,
    "createGameChannel": createGameChannel,
    "loadError": loadError,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
