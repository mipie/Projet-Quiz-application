class ShopScreenConsts {
  static const Map<String, String> shop = {
    "fra": "Boutique",
    "eng": "Shop",
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

  static const Map<String, String> avatars = {
    "fra": "Avatars",
    "eng": "Avatars",
  };

  static const Map<String, String> themes = {
    "fra": "Thèmes",
    "eng": "Themes",
  };

  static const Map<String, String> purchased = {
    "fra": "Acheté",
    "eng": "Purchased",
  };

  static const Map<String, String> successfulPurchase = {
    "fra": "Achat réussi!",
    "eng": "Successful purchase!",
  };

  static const Map<String, String> notEnoughMoney = {
    "fra": "Vous n'avez pas assez d'argent.",
    "eng": "You do not have enough money.",
  };

  static const Map<String, String> buy = {
    "fra": "Acheter",
    "eng": "Buy",
  };

  static Map<String, Map<String, String>> translationMap = {
    "shop": shop,
    "username": username,
    "language": language,
    "french": french,
    "english": english,
    "avatars": avatars,
    "themes": themes,
    "purchased": purchased,
    "successfulPurchase": successfulPurchase,
    "notEnoughMoney": notEnoughMoney,
    "buy": buy,
  };

  static String get(String key, String selectedLanguage) {
    return translationMap[key]?[selectedLanguage] ?? '';
  }
}
