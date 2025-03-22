import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/shop_screen.dart';

class ShopService with ChangeNotifier {
  String? userId = FirebaseAuth.instance.currentUser?.uid;
  String username = "";
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  List<String>? _cachedAvatarUrls;
  List<String>? _cachedThemeUrls;

  List<String>? _cachedPurchasedAvatars;
  List<String>? _cachedPurchasedThemes;

  Future<List<String>> fetchAvatarShopUrls() async {
    if (_cachedAvatarUrls != null) {
      return _cachedAvatarUrls!;
    }
    try {
      final ListResult result = await _storage.ref('shop/avatars').listAll();
      List<String> urls = [];
      for (var ref in result.items) {
        final url = await ref.getDownloadURL();
        urls.add(url);
      }
      _cachedAvatarUrls = urls;
      return urls;
    } catch (e) {
      print("Erreur lors du chargement des avatars: $e");
      return [];
    }
  }

  Future<List<String>> fetchThemeShopUrls() async {
    if (_cachedThemeUrls != null) {
      return _cachedThemeUrls!;
    }
    try {
      final ListResult result = await _storage.ref('shop/themes').listAll();
      List<String> urls = [];
      for (var ref in result.items) {
        final url = await ref.getDownloadURL();
        urls.add(url);
      }
      _cachedThemeUrls = urls;
      return urls;
    } catch (e) {
      print("Erreur lors du chargement des thèmes: $e");
      return [];
    }
  }

  Future<void> purchaseAvatar(String avatarUrl) async {
    userId = FirebaseAuth.instance.currentUser?.uid;
    if (userId == null) {
      print("User ID not found. Cannot complete purchase.");
      return;
    }

    try {
      DocumentReference userRef = _firestore.collection('users').doc(userId);

      await userRef.update({
        'avatar.availableAvatars': FieldValue.arrayUnion([avatarUrl]),
      });

      _cachedPurchasedAvatars ??= [];
      _cachedPurchasedAvatars!.add(avatarUrl);

      print("Avatar purchased and added to user profile.");
      notifyListeners();
    } catch (e) {
      print("Erreur lors de l'achat de l'avatar : $e");
    }
  }

  Future<void> purchaseTheme(String themeUrl) async {
    if (userId == null) {
      print("User ID not found. Cannot complete purchase.");
      return;
    }

    try {
      DocumentReference userRef = _firestore.collection('users').doc(userId);

      await userRef.update({
        'theme.availableThemes': FieldValue.arrayUnion([themeUrl]),
      });

      _cachedPurchasedThemes ??= [];
      _cachedPurchasedThemes!.add(themeUrl);

      print("Theme purchased and added to user profile.");
      notifyListeners();
    } catch (e) {
      print("Erreur lors de l'achat du thème : $e");
    }
  }

  Future<List<String>> fetchPurchasedAvatars(
      {bool forceRefresh = false}) async {
    if (_cachedPurchasedAvatars != null && !forceRefresh) {
      return _cachedPurchasedAvatars!;
    }

    if (userId == null) return [];

    try {
      DocumentSnapshot userDoc =
          await _firestore.collection('users').doc(userId).get();
      _cachedPurchasedAvatars =
          List<String>.from(userDoc['avatar']['availableAvatars'] ?? []);
      return _cachedPurchasedAvatars!;
    } catch (e) {
      print("Erreur lors du chargement des avatars achetés : $e");
      return [];
    }
  }

  Future<List<String>> fetchPurchasedThemes({bool forceRefresh = false}) async {
    if (_cachedPurchasedThemes != null && !forceRefresh) {
      return _cachedPurchasedThemes!;
    }

    if (userId == null) return [];

    try {
      DocumentSnapshot userDoc =
          await _firestore.collection('users').doc(userId).get();
      _cachedPurchasedThemes =
          List<String>.from(userDoc['theme']['availableThemes'] ?? []);
      return _cachedPurchasedThemes!;
    } catch (e) {
      print("Erreur lors du chargement des thèmes achetés : $e");
      return [];
    }
  }

  void openDialogue(BuildContext context, [String? channel]) async {
    final avatarUrls = await fetchAvatarShopUrls();
    final themeUrls = await fetchThemeShopUrls();
    final purchasedAvatars = await fetchPurchasedAvatars(forceRefresh: true);
    final purchasedThemes = await fetchPurchasedThemes(forceRefresh: true);

    showDialog(
      context: context,
      builder: (context) {
        return ShopScreen(
          name: username,
          avatarUrls: avatarUrls,
          themeUrls: themeUrls,
          purchasedAvatarUrls: purchasedAvatars,
          purchasedThemeUrls: purchasedThemes,
        );
      },
    );
  }
}
