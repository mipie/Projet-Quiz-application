import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';

class UserService {
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;
  UserService._internal();

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Streams pour notifier des changements
  final StreamController<Map<String, dynamic>> _accountController =
      StreamController.broadcast();
  final StreamController<List<Map<String, dynamic>>> _friendsController =
      StreamController.broadcast();
  final StreamController<int> _experienceController =
      StreamController.broadcast();
  final StreamController<int> _walletController = StreamController.broadcast();

  // Getters pour les streams
  Stream<Map<String, dynamic>> get accountStream => _accountController.stream;
  Stream<List<Map<String, dynamic>>> get friendsStream =>
      _friendsController.stream;
  Stream<int> get experienceStream => _experienceController.stream;
  Stream<int> get walletStream => _walletController.stream;

  // Cache local
  Map<String, dynamic>? _cachedAccount;
  List<Map<String, dynamic>> _cachedFriends = [];
  int _cachedExperience = 0;
  int _cachedWallet = 0;

  // Méthode pour écouter les changements de données du compte
  void listenToAccountChanges(String userId) {
    _firestore.collection('users').doc(userId).snapshots().listen(
      (snapshot) {
        if (snapshot.exists) {
          final data = snapshot.data();
          if (data != null) {
            _cachedAccount = data; // Mise à jour du cache
            _accountController.add(data);

            // Mise à jour de l'expérience
            final newExperience = data['experience'] ?? 0;
            if (newExperience != _cachedExperience) {
              _cachedExperience = newExperience;
              _experienceController.add(_cachedExperience);
            }

            // Mise à jour du wallet
            final newWallet = data['wallet'] ?? 0;
            if (newWallet != _cachedWallet) {
              _cachedWallet = newWallet;
              _walletController.add(_cachedWallet);
            }

            // Si la liste des amis change, mettre à jour leurs données
            if (data.containsKey('friends')) {
              _fetchFriends(data['friends']);
            }
          }
        } else {
          _accountController.addError('Compte introuvable.');
        }
      },
      onError: (error) {
        _accountController.addError('Erreur : $error');
      },
    );
  }

  // Méthode pour récupérer et écouter les données des amis
  void _fetchFriends(List<dynamic> friendsList) {
    // Récupérer les UID des amis
    final friendIds = friendsList.map((friend) => friend['uid']).toList();

    if (friendIds.isEmpty) {
      _cachedFriends = [];
      _friendsController.add(_cachedFriends);
      return;
    }

    // Écouter les informations de chaque ami dans Firestore
    _firestore
        .collection('users')
        .where(FieldPath.documentId, whereIn: friendIds)
        .snapshots()
        .listen(
      (querySnapshot) {
        _cachedFriends = querySnapshot.docs.map((doc) {
          return {
            'uid': doc.id,
            'username': doc.data()['username'] ?? 'Non défini',
          };
        }).toList();
        _friendsController.add(_cachedFriends);
      },
      onError: (error) {
        _friendsController
            .addError('Erreur lors du chargement des amis : $error');
      },
    );
  }

  // Méthode pour récupérer les données en cache
  Map<String, dynamic>? get cachedAccount => _cachedAccount;
  List<Map<String, dynamic>> get cachedFriends => _cachedFriends;
  int get cachedExperience => _cachedExperience;
  int get cachedWallet => _cachedWallet;

  // Nettoyer les ressources
  void dispose() {
    _accountController.close();
    _friendsController.close();
    _experienceController.close();
    _walletController.close();
  }
}
