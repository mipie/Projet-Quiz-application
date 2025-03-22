import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/settings_screen.dart';
import 'package:mobile/main.dart';

class SettingsService with ChangeNotifier {
  String? userId = FirebaseAuth.instance.currentUser?.uid;
  String username = "";
  String usernameError = "";
  String currentTheme = "";
  String currentThemeUrl = "";
  List<String> themesUrls = [];
  String currentAvatarUrl = "";
  List<String> avatarsUrls = [];
  String language = "";

  void openChat(context, [String? channel]) async {
    final context = navigatorKey.currentContext;

    if (context == null) {
      print("No valid context available. Unable to open chat dialog.");
      return;
    }

    showDialog(
      context: context,
      builder: (context) {
        return const SettingsScreen();
      },
    );
  }

  getUsername() async {
    try {
      userId = FirebaseAuth.instance.currentUser?.uid;

      DocumentSnapshot userDoc = await FirebaseFirestore.instance
          .collection("users")
          .doc(userId)
          .get();
      if (userDoc.exists && userDoc.data() != null) {
        username = userDoc['username'];
        return username;
      } else {
        print("User document not found or 'username' field is missing.");
        return null;
      }
    } catch (e) {
      print("Error retrieving username: $e");
      return null;
    }
  }

  void listenToSettingsChanges() {
    userId = FirebaseAuth.instance.currentUser!.uid;

    FirebaseFirestore.instance
        .collection('users')
        .doc(userId)
        .snapshots()
        .listen(
      (snapshot) {
        print("listening to theme change...");
        if (snapshot.exists || snapshot.data() == null) {
          final data = snapshot.data();
          if (data!.containsKey("theme")) {
            if (data["theme"].containsKey("availableThemes")) {
              if (themesUrls != data["theme"]["availableThemes"]) {
                themesUrls =
                    List<String>.from(data["theme"]["availableThemes"]);
                notifyListeners();
              }
            }

            if (data["theme"].containsKey("currentTheme")) {
              if (currentThemeUrl != data["theme"]["currentTheme"]) {
                currentThemeUrl = data["theme"]["currentTheme"].toString();
                getCurrentThemeName();
                notifyListeners();
              }
            }
          }
        }
      },
      onError: (error) {
        print('Erreur listening to settings changes: $error');
      },
    );
  }

  Future<bool> changeUsername(String newUsername) async {
    bool isValid = await verifyUsername(newUsername);

    if (!isValid) return isValid;

    try {
      userId = FirebaseAuth.instance.currentUser?.uid;

      await FirebaseFirestore.instance
          .collection("users")
          .doc(userId)
          .update({"username": newUsername});

      updateUsernameInChannels(username, newUsername);
      username = newUsername;

      return true;
    } catch (e) {
      print("Error changing username: $e");
      return false;
    }
  }

  Future<bool> verifyUsername(String name) async {
    userId = FirebaseAuth.instance.currentUser?.uid;
    final snapshot = await FirebaseFirestore.instance
        .collection("users")
        .where("username", isEqualTo: name)
        .limit(1)
        .get();
    if (name.isEmpty ||
        (snapshot.docs.isNotEmpty && snapshot.docs.first["uid"] == userId)) {
      usernameError = "Vous portez déjà ce nom";
      return true;
    }

    if (snapshot.docs.isNotEmpty) {
      usernameError = "Ce nom est déjà porté par un autre utilisateur";
      return false;
    }

    usernameError = "";
    return true;
  }

  Stream<bool> verifyUsernameRealTime(String name) {
    userId = FirebaseAuth.instance.currentUser?.uid;
    return FirebaseFirestore.instance
        .collection("users")
        .where("username", isEqualTo: name)
        .limit(1)
        .snapshots()
        .map((snapshot) {
      if (name.isEmpty || snapshot.docs.first["uid"] == userId) {
        usernameError = "";
        return true;
      }
      if (snapshot.docs.isNotEmpty) {
        usernameError = "Ce nom est déjà porté par un autre utilisateur";
        return false;
      }
      usernameError = "";
      return true;
    });
  }

  Future<void> updateUsernameInChannels(
      String oldUsername, String newUsername) async {
    userId = FirebaseAuth.instance.currentUser?.uid;

    try {
      // Fetch user's document
      DocumentSnapshot userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .get();
      if (!userDoc.exists) return;

      // Retrieve the lists of joined and created channels
      List<dynamic> joinedChannels = userDoc.get('joinedChannels') ?? [];
      List<dynamic> createdChannels = userDoc.get('createdChannels') ?? [];

      // Function to update messages in a specific channel
      Future<void> updateMessagesInChannel(String channelTitle) async {
        QuerySnapshot channelQuery = await FirebaseFirestore.instance
            .collection('channels')
            .where('title', isEqualTo: channelTitle)
            .limit(1)
            .get();

        if (channelQuery.docs.isNotEmpty) {
          DocumentSnapshot channelDoc = channelQuery.docs.first;
          List<dynamic> messages = channelDoc['messages'];

          // Update messages where the username matches the old username
          for (var message in messages) {
            if (message['username'] == oldUsername) {
              message['username'] = newUsername;
            }
          }

          // Update the channel document with modified messages
          await channelDoc.reference.update({'messages': messages});
        }
      }

      // Update messages in all joined channels
      for (var channel in joinedChannels) {
        await updateMessagesInChannel(channel['title']);
      }

      // Update messages in all created channels
      for (var channel in createdChannels) {
        await updateMessagesInChannel(channel['title']);
      }

      print('Username updated in all channels successfully.');
    } catch (e) {
      print("Error updating username in channels: $e");
    }
  }

  Future<String> loadLanguage() async {
    try {
      // Get the user ID from FirebaseAuth
      String? userId = FirebaseAuth.instance.currentUser?.uid;

      // If userId is null, return a default language or handle the error
      if (userId == null) {
        return "fra"; // Default language if user is not logged in
      }

      // Access the user's document in Firestore
      DocumentSnapshot userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .get();

      // Check if the document exists and contains the 'language' field
      if (userDoc.exists && userDoc.data() != null) {
        var data = userDoc.data() as Map<String, dynamic>;
        language = (data['language'] ?? "fra"); // Default to "fra" if null

        notifyListeners();
        return language;
      } else {
        return "fra"; // Default language if no document or field found
      }
    } catch (e) {
      print("Error loading language: $e");
      return "fra"; // Return default on error
    }
  }

  Stream<String> getLanguage() {
    userId = FirebaseAuth.instance.currentUser?.uid;

    if (userId == null) {
      return Stream.value("fra"); // Return default if user is not authenticated
    }

    try {
      return FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .snapshots()
          .map((snapshot) {
        if (snapshot.exists && snapshot.data() != null) {
          language = (snapshot.data()?['language'] ?? "fra");

          notifyListeners();
          return language;
        }
        return "fra"; // Default if no language found
      });
    } catch (e) {
      print("Error getting language: $e");
      return Stream.value("fra");
    }
  }

  toggleLanguage() async {
    userId = FirebaseAuth.instance.currentUser?.uid;

    DocumentReference<Map<String, dynamic>> myChannelsRef =
        FirebaseFirestore.instance.collection('users').doc(userId);

    DocumentSnapshot<Map<String, dynamic>> userDoc = await myChannelsRef.get();

    String oldLanguage = userDoc.data()?['language'] ?? "";
    language = (oldLanguage == "fra" ? "eng" : "fra");

    await myChannelsRef.update({
      'language': language,
    });

    notifyListeners();
    return language;
  }

  Future<void> loadAvatars() async {
    try {
      userId = FirebaseAuth.instance.currentUser?.uid;

      final Reference avatarsFolderRef =
          FirebaseStorage.instance.ref().child('avatars');

      final ListResult listResult = await avatarsFolderRef.listAll();

      DocumentReference userDocRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      String avatar = '';
      for (final Reference item in listResult.items) {
        final String avatarURL = await item.getDownloadURL();

        await userDocRef.update({
          'avatar.availableAvatars': FieldValue.arrayUnion([avatarURL]),
        });

        print("Avatar URL added successfully to availableAvatars.");
        avatar = avatarURL;
      }
      await userDocRef.update({
        'avatar.currentAvatar': avatar,
      });
    } catch (e) {
      print("Error loading avatars: $e");
    }
  }

  Future<String> getAvatar(String username) async {
    try {
      // Query Firestore for the user document with the matching username
      QuerySnapshot<Map<String, dynamic>> userDoc = await FirebaseFirestore
          .instance
          .collection('users')
          .where("username", isEqualTo: username)
          .get();

      // Check if a document exists
      if (userDoc.docs.isNotEmpty) {
        Map<String, dynamic> userData = userDoc.docs.first.data();

        // Safely check for the avatar field and its 'currentAvatar'
        if (userData.containsKey('avatar') && userData['avatar'] is Map) {
          Map<String, dynamic> avatarData = userData['avatar'];

          if (avatarData.containsKey('currentAvatar') &&
              avatarData['currentAvatar'] is String) {
            return avatarData['currentAvatar'] ??
                ""; // Return currentAvatar if it exists
          }
        }
      }
    } catch (e) {
      // Handle errors, such as Firestore issues or unexpected structure
      print("Error retrieving avatar: $e");
    }
    return ""; // Default avatar if not found
  }

  Stream<String> getAvatarStream(String username) {
    return FirebaseFirestore.instance
        .collection('users')
        .where("username", isEqualTo: username)
        .snapshots()
        .map((querySnapshot) {
      try {
        // Check if any document exists
        if (querySnapshot.docs.isNotEmpty) {
          Map<String, dynamic> userData = querySnapshot.docs.first.data();

          // Safely check for the avatar field and its 'currentAvatar'
          if (userData.containsKey('avatar') && userData['avatar'] is Map) {
            Map<String, dynamic> avatarData = userData['avatar'];

            if (avatarData.containsKey('currentAvatar') &&
                avatarData['currentAvatar'] is String) {
              return avatarData['currentAvatar'] ??
                  ""; // Mettre une image par défaut
            }
          }
        }
      } catch (e) {
        // Handle errors gracefully
        print("Error retrieving avatar: $e");
      }
      return ""; // Default avatar if not found
    });
  }

  Stream<List<String>> getAvatars() {
    userId = FirebaseAuth.instance.currentUser?.uid;

    return FirebaseFirestore.instance
        .collection("users")
        .doc(userId)
        .snapshots()
        .map((snapshot) {
      if (snapshot.exists) {
        var data = snapshot.data();
        if (data != null && data.containsKey('avatar')) {
          var avatarData = data['avatar'];
          if (avatarData != null && avatarData['availableAvatars'] != null) {
            List<String> availableAvatars =
                List<String>.from(avatarData['availableAvatars']);

            avatarsUrls = availableAvatars;
            return availableAvatars; // Return the transformed list
          }
        }
      }
      return []; // Return an empty list if no avatars found
    });
  }

  Stream<String?> getCurrentAvatar() {
    userId = FirebaseAuth.instance.currentUser?.uid;

    try {
      return FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .snapshots()
          .map((DocumentSnapshot userDoc) {
        if (userDoc.exists) {
          Map<String, dynamic> userData =
              userDoc.data() as Map<String, dynamic>;

          Map<String, dynamic>? avatarData = userData['avatar'];

          if (avatarData != null) {
            currentAvatarUrl = avatarData['currentAvatar'];

            return currentAvatarUrl;
          }
        }
        return '';
      });
    } catch (e) {
      print("Error getting current avatar: $e");
      return Stream.value('');
    }
  }

  Future<void> updateCurrentAvatar(String avatarUrl) async {
    try {
      userId = FirebaseAuth.instance.currentUser?.uid;

      // Reference to the user's document
      DocumentReference userDocRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      // Update the currentAvatar in the avatar map
      await userDocRef.update({
        'avatar.currentAvatar': avatarUrl,
      });

      print("username : $username");
      updateAvatarInChannels(username, avatarUrl);

      // Optionally update the local variable (if you have it)
      currentAvatarUrl = avatarUrl;

      print(
          "Avatar updated to $currentAvatarUrl successfully with url: $avatarUrl.");
    } catch (e) {
      print("Failed to update avatar: $e");
    }
  }

  Future<void> updateAvatarInChannels(String username, String avatarUrl) async {
    userId = FirebaseAuth.instance.currentUser?.uid;

    try {
      // Fetch user's document
      DocumentSnapshot userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .get();
      if (!userDoc.exists) return;

      // Retrieve the lists of joined and created channels
      List<dynamic> joinedChannels = userDoc.get('joinedChannels') ?? [];
      List<dynamic> createdChannels = userDoc.get('createdChannels') ?? [];

      // Function to update messages in a specific channel
      Future<void> updateMessagesInChannel(String channelTitle) async {
        QuerySnapshot channelQuery = await FirebaseFirestore.instance
            .collection('channels')
            .where('title', isEqualTo: channelTitle)
            .limit(1)
            .get();

        if (channelQuery.docs.isNotEmpty) {
          DocumentSnapshot channelDoc = channelQuery.docs.first;
          List<dynamic> messages = channelDoc['messages'];

          // Update messages where the username matches the old username
          for (var message in messages) {
            if (message['username'] == username) {
              message['avatar'] = avatarUrl;
            }
          }

          // Update the channel document with modified messages
          await channelDoc.reference.update({'messages': messages});
        }
      }

      // Update messages in all joined channels
      for (var channel in joinedChannels) {
        await updateMessagesInChannel(channel['title']);
      }

      // Update messages in all created channels
      for (var channel in createdChannels) {
        await updateMessagesInChannel(channel['title']);
      }

      print('Avatar updated in all channels successfully.');
    } catch (e) {
      print("Error updating username in channels: $e");
    }
  }

  Future<void> loadThemes() async {
    try {
      userId = FirebaseAuth.instance.currentUser?.uid;

      final Reference themesFolderRef =
          FirebaseStorage.instance.ref().child('themes');

      final ListResult listResult = await themesFolderRef.listAll();
      print("listResult ${listResult.items.length}: $listResult");

      DocumentReference userDocRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      bool isFirst = true;
      for (final Reference item in listResult.items) {
        final String themeURL = await item.getDownloadURL();
        print("themeURL : ${themeURL}");

        await userDocRef.update({
          'theme.availableThemes': FieldValue.arrayUnion([themeURL]),
        });

        if (isFirst) {
          currentThemeUrl = themeURL;
          currentTheme = item.name.split('.')[0];
          // print("currentTheme : ${currentTheme}");
          await userDocRef.update({
            'theme.currentTheme': themeURL,
          });
        }

        print("Theme URL added successfully to availableThemes.");
        isFirst = false;
      }
    } catch (e) {
      print("Error loading themes: $e");
    }
  }

  Stream<List<String>> getThemes() {
    userId = FirebaseAuth.instance.currentUser?.uid;

    return FirebaseFirestore.instance
        .collection("users")
        .doc(userId)
        .snapshots()
        .map((snapshot) {
      if (snapshot.exists) {
        var data = snapshot.data();
        if (data != null && data.containsKey('theme')) {
          var themeData = data['theme'];
          if (themeData == null || themeData['availableThemes'] == null) {
            return [];
          }
          List<String> availableThemes =
              List<String>.from(themeData['availableThemes']);

          if (themesUrls != availableThemes) {
            themesUrls = availableThemes; // Return the transformed list
          }
          return themesUrls;
        }
      }
      return []; // Return an empty list if no themes found
    });
  }

  Stream<String> getCurrentThemeURL() {
    userId = FirebaseAuth.instance.currentUser?.uid;

    try {
      return FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .snapshots()
          .map((DocumentSnapshot userDoc) {
        if (userDoc.exists) {
          Map<String, dynamic> userData =
              userDoc.data() as Map<String, dynamic>;

          Map<String, dynamic>? themeData = userData['theme'];

          if (themeData != null) {
            currentThemeUrl = themeData['currentTheme'];

            getCurrentThemeName();

            return currentThemeUrl;
          }
        }
        return '';
      });
    } catch (e) {
      print("Error getting current theme: $e");
      return Stream.value('');
    }
  }

  getCurrentThemeName() {
    currentTheme = currentThemeUrl.split("themes%2F")[1].split(".")[0];
  }

  Future<void> updateCurrentTheme(String themeUrl) async {
    try {
      userId = FirebaseAuth.instance.currentUser?.uid;

      // Reference to the user's document
      DocumentReference userDocRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      // Update the currentTheme in the theme map
      await userDocRef.update({
        'theme.currentTheme': themeUrl,
      });

      // Optionally update the local variable (if you have it)
      currentThemeUrl = themeUrl;
      currentTheme = currentThemeUrl.split("themes%2F")[1].split(".")[0];

      notifyListeners();
      print("Theme updated to $currentTheme successfully with url: $themeUrl.");
    } catch (e) {
      print("Failed to update theme: $e");
    }
  }

  Stream<List<Timestamp>> getAccountLogsHistory() {
    try {
      userId = FirebaseAuth.instance.currentUser?.uid;

      return FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .snapshots()
          .map((snapshot) {
        if (snapshot.exists && snapshot.data() != null) {
          List<dynamic> historic = snapshot.data()?['historic'] ?? [];
          return historic.cast<Timestamp>();
        }
        return [];
      });
    } catch (e) {
      print("Error updating historic $e");
      return Stream.value([]);
    }
  }

  updateAccountLogsHistory(String uid) async {
    if (uid.isEmpty) return;

    DocumentReference<Map<String, dynamic>> myChannelsRef =
        FirebaseFirestore.instance.collection('users').doc(uid);

    DocumentSnapshot<Map<String, dynamic>> userDoc = await myChannelsRef.get();

    List<Timestamp> logsHistoric =
        List<Timestamp>.from(userDoc.data()?['historic'] ?? []);

    logsHistoric.insert(0, Timestamp.now());

    await myChannelsRef.update({
      'historic': logsHistoric,
    });
  }
}
