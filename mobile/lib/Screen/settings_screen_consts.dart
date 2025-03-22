class SettingsScreenConsts {
  static const Map<String, String> profileSettings = {
    "fra": "Paramètres du profil",
    "eng": "Profile Settings",
  };

  static const Map<String, String> username = {
    "fra": "Nom d'utilisateur",
    "eng": "Username",
  };

  static const Map<String, String> language = {
    "fra": "Langue",
    "eng": "Language",
  };

  static const Map<String, String> french = {
    "fra": "Français",
    "eng": "French",
  };

  static const Map<String, String> english = {
    "fra": "Anglais",
    "eng": "English",
  };

  static const Map<String, String> avatar = {
    "fra": "Avatar",
    "eng": "Avatar",
  };

  static const Map<String, String> theme = {
    "fra": "Thème",
    "eng": "Theme",
  };

  static const Map<String, String> connectionHistory = {
    "fra": "Historique des connexions",
    "eng": "Connection History",
  };

  static const Map<String, String> type = {
    "fra": "Type",
    "eng": "Type",
  };

  static const Map<String, String> date = {
    "fra": "Date",
    "eng": "Date",
  };

  static const Map<String, String> errorMessage = {
    "fra": "Il y a eu une erreur!",
    "eng": "There was an error!",
  };

  static const Map<String, String> noConnections = {
    "fra": "Vous n'avez aucune connexion ni déconnexion.",
    "eng": "You have no logins nor logouts.",
  };

  static const Map<String, String> login = {
    "fra": "Connexion",
    "eng": "Login",
  };

  static const Map<String, String> logout = {
    "fra": "Déconnexion",
    "eng": "Logout",
  };

  static Map<String, Map<String, String>> translationMap = {
    "profileSettings": profileSettings,
    "username": username,
    "language": language,
    "french": french,
    "english": english,
    "avatar": avatar,
    "theme": theme,
    "connectionHistory": connectionHistory,
    "type": type,
    "date": date,
    "errorMessage": errorMessage,
    "noConnections": noConnections,
    "login": login,
    "logout": logout,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
