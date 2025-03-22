class LobbiesScreenConsts {
  static const Map<String, String> notEnoughMoney = {
    "fra": "Vous n'avez pas assez d'argent.",
    "eng": "You do not have enough money.",
  };

  static const Map<String, String> roomDoesNotExist = {
    "fra": "La salle n'existe pas.",
    "eng": "The room does not exist.",
  };

  static const Map<String, String> roomIsLocked = {
    "fra": "La salle a été verrouillée par l'organisateur.",
    "eng": "The room has been locked by the organizer.",
  };

  static const Map<String, String> notFriendWithOrg = {
    "fra": "Vous n'êtes pas ami avec l'organisateur de cette partie.",
    "eng": "You are not friend with the organizer of this game.",
  };

  static const Map<String, String> notYetLv5 = {
    "fra": "Vous n'êtes pas encore niveau 5.",
    "eng": "You are not yet level 5.",
  };

  static const Map<String, String> already2Players = {
    "fra": "Il y a déjà 2 joueurs dans la salle.",
    "eng": "There are already 2 players in the room.",
  };

  static const Map<String, String> cancel = {
    "fra": "Annuler",
    "eng": "Cancel",
  };

  static const Map<String, String> confirm = {
    "fra": "Confirm",
    "eng": "Confirmer",
  };

  static const Map<String, String> bannedByOrg = {
    "fra": "Vous avez été banni(e) par l'organisateur!",
    "eng": "You have have been banned by the organizer!",
  };

  static const Map<String, String> joinAsObserver = {
    "fra": "Voulez-vous rejoindre la partie en tant qu'observateur?",
    "eng": "Do you want to join the game as an observer?",
  };

  static const Map<String, String> no = {
    "fra": "Non",
    "eng": "No",
  };

  static const Map<String, String> yes = {
    "fra": "Oui",
    "eng": "Yes",
  };

  static const Map<String, String> gamesList = {
    "fra": "Liste des salles",
    "eng": "List of rooms",
  };

  static const Map<String, String> room = {
    "fra": "Salle",
    "eng": "Room",
  };

  static const Map<String, String> creator = {
    "fra": "Créateur",
    "eng": "Creator",
  };

  static const Map<String, String> gamesName = {
    "fra": "Nom du jeu",
    "eng": "Game's name",
  };

  static const Map<String, String> players = {
    "fra": "Joueurs",
    "eng": "Players",
  };

  static const Map<String, String> observers = {
    "fra": "Observateurs",
    "eng": "Observers",
  };

  static const Map<String, String> entranceFee = {
    "fra": "Prix d'entrée",
    "eng": "Entrance fee",
  };

  static const Map<String, String> state = {
    "fra": "État",
    "eng": "State",
  };

  static const Map<String, String> noGames = {
    "fra": "Aucune partie pour l'instant.",
    "eng": "There are no games for now.",
  };

  static const Map<String, String> legend = {
    "fra": "LÉGENDE",
    "eng": "LEGEND",
  };

  static const Map<String, String> rankedMode = {
    "fra": "Mode Classé",
    "eng": "Ranked Mode",
  };

  static const Map<String, String> classicMode = {
    "fra": "Mode Classique",
    "eng": "Classic Mode",
  };

  static const Map<String, String> friendsMode = {
    "fra": "Mode Amis",
    "eng": "Friends Mode",
  };

  static const Map<String, String> onHold = {
    "fra": "En attente",
    "eng": "On hold",
  };

  static const Map<String, String> ongoing = {
    "fra": "En cours",
    "eng": "Ongoing",
  };

  static const Map<String, String> joinGame = {
    "fra": "Rejoindre la salle",
    "eng": "Join the room",
  };

  static const Map<String, String> useCode = {
    "fra": "Utiliser un code",
    "eng": "Use a code",
  };

  static Map<String, Map<String, String>> translationMap = {
    "notEnoughMoney": notEnoughMoney,
    "roomDoesNotExist": roomDoesNotExist,
    "roomIsLocked": roomIsLocked,
    "notFriendWithOrg": notFriendWithOrg,
    "notYetLv5": notYetLv5,
    "already2Players": already2Players,
    "cancel": cancel,
    "confirm": confirm,
    "bannedByOrg": bannedByOrg,
    "joinAsObserver": joinAsObserver,
    "no": no,
    "yes": yes,
    "gamesList": gamesList,
    "room": room,
    "creator": creator,
    "gamesName": gamesName,
    "players": players,
    "observers": observers,
    "entranceFee": entranceFee,
    "state": state,
    "noGames": noGames,
    "legend": legend,
    "rankedMode": rankedMode,
    "classicMode": classicMode,
    "friendsMode": friendsMode,
    "onHold": onHold,
    "ongoing": ongoing,
    "joinGame": joinGame,
    "useCode": useCode,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
