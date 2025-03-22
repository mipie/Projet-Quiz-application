class ProfileButtonConsts {
  static const Map<String, String> level = {
    "fra": "Niv : ",
    "eng": "Lv : ",
  };

  static const Map<String, String> friends = {
    "fra": "Mes amis",
    "eng": "My Friends",
  };

  static const Map<String, String> shop = {
    "fra": "Boutique",
    "eng": "Shop",
  };

  static const Map<String, String> stats = {
    "fra": "Statistiques",
    "eng": "Statistics",
  };

  static const Map<String, String> profile_settings = {
    "fra": "Paramètres du profil",
    "eng": "Profile Settings",
  };

  static const Map<String, String> logout = {
    "fra": "Se déconnecter",
    "eng": "Logout",
  };

  static Map<String, Map<String, String>> translationMap = {
    "level": level,
    "friends": friends,
    "shop": shop,
    "stats": stats,
    "profile_settings": profile_settings,
    "logout": logout,
  };

  // Helper function to get translation
  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
