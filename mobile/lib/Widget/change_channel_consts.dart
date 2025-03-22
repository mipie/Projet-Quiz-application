class ChangeChannelConsts {
  static const Map<String, String> searchChannel = {
    "fra": "Cherchez un canal...",
    "eng": "Search for a channel...",
  };

  static const Map<String, String> yourChannels = {
    "fra": "Vos canaux",
    "eng": "Your channels",
  };

  static const Map<String, String> loadError = {
    "fra": "Il y a eu une erreur!",
    "eng": "There was an error!",
  };

  static const Map<String, String> noChannelsFound = {
    "fra": "Aucun canal trouvé",
    "eng": "No channels found",
  };

  static const Map<String, String> yourOwnChannels = {
    "fra": "Vos propres canaux",
    "eng": "Your own channels",
  };

  static const Map<String, String> noCreatedChannels = {
    "fra": "Vous n'avez pas de canaux créés.",
    "eng": "You have no created channels.",
  };

  static Map<String, Map<String, String>> translationMap = {
    "searchChannel": searchChannel,
    "yourChannels": yourChannels,
    "loadError": loadError,
    "noChannelsFound": noChannelsFound,
    "yourOwnChannels": yourOwnChannels,
    "noCreatedChannels": noCreatedChannels,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
