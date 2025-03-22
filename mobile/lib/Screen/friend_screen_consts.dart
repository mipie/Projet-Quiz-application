class FriendScreenConsts {
  static const Map<String, String> myFriends = {
    "fra": "Mes amis",
    "eng": "My Friends",
  };

  static const Map<String, String> manageMyFriends = {
    "fra": "Gérer mes amis",
    "eng": "Manage my friends",
  };

  static const Map<String, String> searchNewFriend = {
    "fra": "Chercher un nouvel ami",
    "eng": "Search for a new friend",
  };

  static Map<String, Map<String, String>> translationMap = {
    "myFriends": myFriends,
    "manageMyFriends": manageMyFriends,
    "searchNewFriend": searchNewFriend,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
