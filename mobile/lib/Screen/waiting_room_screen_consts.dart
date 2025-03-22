class WaitingRoomScreenConsts {
  static const Map<String, String> organizerQuit = {
    "fra": "L'organisateur a quitté la partie.",
    "eng": "The organizer has quit the game.",
  };

  static const Map<String, String> invitePlayers = {
    "fra": "Invitez des joueurs!",
    "eng": "Invite players!",
  };

  static const Map<String, String> game = {
    "fra": "Jeu : ",
    "eng": "Game : ",
  };

  static const Map<String, String> roomsCode = {
    "fra": "Code de la salle : ",
    "eng": "Room's code : ",
  };

  static const Map<String, String> entranceFee = {
    "fra": "Prix d'entrée : ",
    "eng": "Entrance fee : ",
  };

  static const Map<String, String> organizer = {
    "fra": "Organisateur",
    "eng": "Organizer",
  };

  static const Map<String, String> bannedNames = {
    "fra": "Noms bannis : ",
    "eng": "Banned names : ",
  };

  static const Map<String, String> roomIsLocked = {
    "fra": "La salle est verrouillée.",
    "eng": "The room is locked.",
  };

  static const Map<String, String> begin = {
    "fra": "Commencer",
    "eng": "Start",
  };

  static const Map<String, String> banned = {
    "fra": "Banni(e)",
    "eng": "Banned",
  };

  static const Map<String, String> bannedByOrg = {
    "fra": "Vous avez été banni(e) par l'organisateur!",
    "eng": "You have have been banned by the organizer!",
  };

  static const Map<String, String> confirmQuit = {
    "fra": "Êtes vous sûr de vouloir abandonner la partie?",
    "eng": "Are you sure you want to abandon the game?",
  };

  static const Map<String, String> quit = {
    "fra": "Quitter",
    "eng": "Quit",
  };

  static const Map<String, String> cancel = {
    "fra": "Annuler",
    "eng": "Cancel",
  };

  static Map<String, Map<String, String>> translationMap = {
    "organizerQuit": organizerQuit,
    "invitePlayers": invitePlayers,
    "game": game,
    "roomsCode": roomsCode,
    "entranceFee": entranceFee,
    "organizer": organizer,
    "roomIsLocked": roomIsLocked,
    "bannedNames": bannedNames,
    "begin": begin,
    "bannedByOrg": bannedByOrg,
    "banned": banned,
    "confirmQuit": confirmQuit,
    "cancel": cancel,
    "quit": quit,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
