class StatisticsScreenConsts {
  static const Map<String, String> statistics = {
    "fra": "Statistiques",
    "eng": "Statistics",
  };

  static const Map<String, String> yourStats = {
    "fra": "Vos statistiques de partie",
    "eng": "Your Games' Statistics",
  };

  static const Map<String, String> leaderboard = {
    "fra": "Classement",
    "eng": "Leaderboard",
  };

  static const Map<String, String> gamesPlayed = {
    "fra": "Nombre de parties jouées",
    "eng": "Number of played games",
  };

  static const Map<String, String> gamesWon = {
    "fra": "Nombre de parties gagnées",
    "eng": "Number of won games",
  };

  static const Map<String, String> gamesLosses = {
    "fra": "Nombre de parties perdues",
    "eng": "Number of lost games",
  };

  static const Map<String, String> avgGoodAns = {
    "fra": "Moyenne de bonnes réponses par partie",
    "eng": "Average of good answers per game",
  };

  static const Map<String, String> averageTime = {
    "fra": "Temps moyen par partie",
    "eng": "Average time per game",
  };

  static const Map<String, String> rank = {
    "fra": "Rang",
    "eng": "Rank",
  };

  static const Map<String, String> username = {
    "fra": "Nom d'utilisateur",
    "eng": "  Username  ",
  };

  static const Map<String, String> nbPoints = {
    "fra": "Points",
    "eng": "Points",
  };

  static const Map<String, String> nbWins = {
    "fra": "Victoires",
    "eng": "Victories",
  };

  static const Map<String, String> nbTies = {
    "fra": "Égalités",
    "eng": "Ties",
  };

  static const Map<String, String> nbLosses = {
    "fra": "Défaites",
    "eng": "Defeats",
  };

  static const Map<String, String> gamesHistory = {
    "fra": "Votre historique de partie",
    "eng": "Your Games' History",
  };

  static const Map<String, String> gameName = {
    "fra": "Nom du jeu",
    "eng": "Game's name",
  };

  static const Map<String, String> hasWon = {
    "fra": "Résultat",
    "eng": "Result",
  };

  static const Map<String, String> date = {
    "fra": "Date",
    "eng": "Date",
  };

  static const Map<String, String> win = {
    "fra": "Victoire",
    "eng": "Victory",
  };

  static const Map<String, String> loss = {
    "fra": "Défaite",
    "eng": "Defeat",
  };

  static const Map<String, String> error = {
    "fra": "Il y a eu une erreur!",
    "eng": "There was an error!",
  };

  static const Map<String, String> noData = {
    "fra": "Vous n'avez encore joué aucune partie.",
    "eng": "You have not played a game yet.",
  };

  static Map<String, Map<String, String>> translationMap = {
    "statistics": statistics,
    "yourStats": yourStats,
    "gamesPlayed": gamesPlayed,
    "gamesWon": gamesWon,
    "gamesLosses": gamesLosses,
    "avgGoodAns": avgGoodAns,
    "averageTime": averageTime,
    "leaderboard": leaderboard,
    "rank": rank,
    "username": username,
    "nbPoints": nbPoints,
    "nbWins": nbWins,
    "nbTies": nbTies,
    "nbLosses": nbLosses,
    "gamesHistory": gamesHistory,
    "gameName": gameName,
    "hasWon": hasWon,
    "date": date,
    "win": win,
    "loss": loss,
    "error": error,
    "noData": noData,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
