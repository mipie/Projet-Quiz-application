class MyFriendsConsts {
  static const Map<String, String> friendsRequests = {
    "fra": "Demandes d'amis",
    "eng": "Friends Resquests",
  };

  static const Map<String, String> yourFriends = {
    "fra": "Vos amis",
    "eng": "Your Friends",
  };

  static const Map<String, String> noRequests = {
    "fra": "Aucune demande pour l'instant",
    "eng": "No request for now",
  };

  static const Map<String, String> noFriends = {
    "fra": "Aucun ami pour l'instant",
    "eng": "No friend for now",
  };

  static const Map<String, String> error = {
    "fra": "Il y a eu une erreur!",
    "eng": "There was an error!",
  };

  static const Map<String, String> notConnected = {
    "fra": "Vous n'êtes pas connecté.",
    "eng": "You are not logged in.",
  };

  static Map<String, Map<String, String>> translationMap = {
    "friendsRequests": friendsRequests,
    "yourFriends": yourFriends,
    "noRequests": noRequests,
    "noFriends": noFriends,
    "error": error,
    "notConnected": notConnected,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
