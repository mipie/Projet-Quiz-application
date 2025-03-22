class CreatenjoinConsts {
  static const Map<String, String> createYourChannel = {
    "fra": "Créez votre canal",
    "eng": "Create your channel",
  };

  static const Map<String, String> channelName = {
    "fra": "Nom du canal...",
    "eng": "Channel's name...",
  };

  static const Map<String, String> joinExistingChannel = {
    "fra": "Joignez un canal existant",
    "eng": "Join an existing channel",
  };

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

  static const Map<String, String> joinedAll = {
    "fra": "Vouz avez joint tous les canaux qui existent!",
    "eng": "You have joined all the existing channels!",
  };

  static Map<String, Map<String, String>> translationMap = {
    "createYourChannel": createYourChannel,
    "channelName": channelName,
    "joinExistingChannel": joinExistingChannel,
    "searchChannel": searchChannel,
    "yourChannels": yourChannels,
    "loadError": loadError,
    "noChannelsFound": noChannelsFound,
    "joinedAll": joinedAll,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
