class SearchFriendsConsts {
  static const Map<String, String> friendsSearch = {
    "fra": "Recherche d'amis",
    "eng": "Friends Search",
  };

  static const Map<String, String> searchAFriend = {
    "fra": "Chercher un ami...",
    "eng": "Search for a friend...",
  };

  static const Map<String, String> noFriends = {
    "fra": "Aucun utilisateur trouvé",
    "eng": "No user found",
  };

  static const Map<String, String> error = {
    "fra": "Il y a eu une erreur!",
    "eng": "There was an error!",
  };

  static Map<String, Map<String, String>> translationMap = {
    "friendsSearch": friendsSearch,
    "searchAFriend": searchAFriend,
    "noFriends": noFriends,
    "error": error,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
