import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:mobile/Services/settings_service.dart';

class AuthServices {
  // for storign data in cloud firestore
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  // for authentication
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseDatabase _realtimeDb = FirebaseDatabase.instance;
  SettingsService settingsService = SettingsService();
  final String? userId = FirebaseAuth.instance.currentUser?.uid;
  bool isConnected = false;
  int initialMoney = 100;
  int inialExperience = 0;

  // for SignUp
  Future<String> signUpUser({
    required String email,
    required String password,
    required String name,
    required String? avatarUrl, // Nouveau paramètre
    required List<String> availableAvatars, // Nouveau paramètre
  }) async {
    String res = "An error has occurred!";

    if (email.isEmpty) {
      res = "Veuillez entrer une adresse courriel.";
      return res;
    } else if (name.isEmpty) {
      res = "Veuillez entrer un nom d'utilisateur.";
      return res;
    } else if (password.isEmpty) {
      res = "Veuillez entrer un mot de passe.";
      return res;
    } else if (avatarUrl == null || avatarUrl.isEmpty) {
      res = "Veuillez attendre le chargement des avatars.";
      return res;
    }

    try {
      if (email.isNotEmpty || password.isNotEmpty || name.isNotEmpty) {
        // for register user in firebase auth with email and password
        bool isUnique = await FirebaseFirestore.instance
            .collection("users")
            .where("username", isEqualTo: name)
            .get()
            .then((QuerySnapshot q) {
          return q.docs.isEmpty;
        });

        if (!isUnique) return "Ce nom d'utilisateur existe déjà!";

        UserCredential credential = await _auth.createUserWithEmailAndPassword(
          email: email,
          password: password,
        );

        await credential.user?.updateProfile(
          displayName: name,
        );

        // to add a user to our cloud firestore
        await _firestore.collection("users").doc(credential.user!.uid).set({
          'username': name,
          "email": email,
          'uid': credential.user!.uid,
          'fcmToken': '',
          'wallet': initialMoney,
          'experience': inialExperience,
          'rankingPoints': 0,
          'rankingW': 0,
          'rankingD': 0,
          'rankingL': 0,
          'avatar': {
            'currentAvatar': avatarUrl, // Ajout de l'URL de l'avatar
            'availableAvatars': availableAvatars,
          }, // liste des avatar disponible
          'friends': [],
          'requests': [],
          'createdChannels': [],
          'joinedChannels': [
            {
              'lastMessageSeen': null,
              'title': 'KAM? PAF!',
            },
          ],
          'historic': [],
          'language': "fra",
          'theme': {
            'availableThemes': [],
            'currentTheme': '',
          },
          'gamesHistoric': [],
          'statistics': {
            'averageGoodAnsPerGame': 0,
            'averageTimePerGame': 0,
            'gamesL': 0,
            'gamesP': 0,
            'gamesW': 0,
          },
        });

        //settingsService.loadAvatars(); // pourquoi on met cette ligne
        settingsService.loadThemes();

        res = "Success";
      }
    } on FirebaseAuthException catch (e) {
      switch (e.code) {
        case 'invalid-email':
          return "L'adresse email est invalide!";
        case 'email-already-in-use':
          return "L'adresse email est déjà utilisée par une autre personne!";
        case 'weak-password':
          return 'Le mot de passe doit contenir au moins 6 caractères!';
      }
      print(e.code);
      return "Erreur au moment de créer au compte : ${e.toString()}";
    }
    isConnected = res == "Success";
    return res;
  }

  // for log in
  Future<String> logInUser({
    required String name,
    required String password,
  }) async {
    String res = "Une erreur s'est produite!";

    if (name.isEmpty) {
      res = "Veuillez entrer un nom d'utilisateur.";
      return res;
    } else if (password.isEmpty) {
      res = "Veuillez entrer un mot de passe.";
      return res;
    }

    try {
      if (name.isNotEmpty || password.isNotEmpty) {
        // log in user with name and password
        QuerySnapshot userSnapshot = await FirebaseFirestore.instance
            .collection("users")
            .where("username", isEqualTo: name)
            .get();

        if (userSnapshot.docs.isEmpty)
          return "Ce nom d'utilisateur n'existe pas!";

        String email = userSnapshot.docs[0]['email'];
        String userId = userSnapshot.docs[0]['uid'];

        DatabaseReference userStatusRef = _realtimeDb.ref("status/$userId");
        DataSnapshot snapshot = await userStatusRef.get();

        if (snapshot.exists && snapshot.value != null) {
          final data = snapshot.value as Map<dynamic, dynamic>;
          if (data['logged']) {
            // ** ...== true)
            return "Cet utilisateur est déjà connecté!";
          }
        }

        await _auth.signInWithEmailAndPassword(
          email: email,
          password: password,
        );

        userStatusRef.set({"logged": true});

        userStatusRef.onDisconnect().set({"logged": false});

        res = "Success";
      }
    } on FirebaseAuthException catch (e) {
      switch (e.code) {
        case 'invalid-credential':
          return "Le mot de passe est invalide!";
        case 'too-many-requests':
          return "Vous avez essayé trop de fois. Veuillez essayer plus tard!";
      }
      return "Erreur au moment de se connecter au compte : ${e.toString()}";
    }
    isConnected = res == "Success";
    return res;
  }

  // for Log out
  Future<void> signOut() async {
    DatabaseReference userStatusRef =
        _realtimeDb.ref("status/${_auth.currentUser!.uid}");

    await userStatusRef.set({"logged": false});

    await _auth.signOut();

    isConnected = false;
  }
}
