import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/chat_screen.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/snack_bar.dart';
import 'package:rxdart/rxdart.dart';

import '../main.dart';

class ChannelService with ChangeNotifier {
  final FirebaseMessaging fcm = FirebaseMessaging.instance;
  SettingsService settingsService = SettingsService();
  String? userId = FirebaseAuth.instance.currentUser?.uid;
  String? name = FirebaseAuth.instance.currentUser?.displayName.toString();
  // final player = AudioPlayer();
  static String selectedChannel = 'KAM? PAF!';
  String room = "";
  static bool isDialogOpen = false;
  String createError = "";
  int lastNotificationCount = 0;
  int lastNotifGameCount = 0;
  static final ValueNotifier<bool> isMute = ValueNotifier<bool>(false);

  void setupFirebaseMessaging(BuildContext context) {
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      if (message.notification != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          openChat(context, false, message.notification!.title);
        });
      }
    });
  }

  void openChat(context, [bool? isInGame, String? channel]) {
    final context = navigatorKey.currentContext;

    if (context == null) {
      print("No valid context available. Unable to open chat dialog.");
      return;
    }

    print(isDialogOpen);
    // if (isDialogOpen) {
    //   // En réalité on devrait pop si la page sur la pile est une dialog mais comment le vérifier?
    //   Navigator.of(context, rootNavigator: true).pop();
    // }

    if (isInGame == true && channel != null) selectedChannel = channel;
    print("chatScreenKey state : ${chatScreenKey.currentState}");
    // resetChatScreenKey();
    // print("chatScreenKey state : ${chatScreenKey.currentState}");
    print("opening chat : $selectedChannel");
    if (isDialogOpen) {
      chatScreenKey.currentState?.onSelectedChannel();
    } else {
      showDialog(
        context: context,
        builder: (context) {
          isDialogOpen = true;
          return ChatScreen(
            key: chatScreenKey,
            name: FirebaseAuth.instance.currentUser!.displayName.toString(),
            selectedChannel: selectedChannel,
            isInGame: isInGame ?? false,
          );
        },
        routeSettings: const RouteSettings(name: '/chat-screen'),
      ).then((_) {
        print("closing chat dialog ...");
        isDialogOpen = false;
      });
    }
    notifyListeners();
  }

  // String sanitizeTopic(String channelId) {
  //   return channelId.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_');
  // }

  // void subscribeToChannelTopics(String channel) {
  //   final sanitizedTopic = sanitizeTopic(channel);
  //   print(sanitizedTopic);
  //   // Vérifier s'il est possible de faire avec des channel qui ont des accents
  //   FirebaseMessaging.instance.subscribeToTopic(sanitizedTopic);
  // }

  // void unsubscribeToChannelTopics(String channel) {
  //   final sanitizedTopic = sanitizeTopic(channel);
  //   FirebaseMessaging.instance.unsubscribeFromTopic(sanitizedTopic);
  // }

  getToken() async {
    userId = FirebaseAuth.instance.currentUser?.uid;

    if (userId == null) return;

    NotificationSettings settings =
        await FirebaseMessaging.instance.requestPermission();
    if (settings.authorizationStatus != AuthorizationStatus.authorized) {
      print('User declined permission');
      return;
    }
    print('User granted permission');

    var userDoc =
        await FirebaseFirestore.instance.collection("users").doc(userId).get();

    // Get FCM token
    String? fcmToken = userDoc.get("fcmToken");
    print('old FCM Token: $fcmToken');

    if (fcmToken!.isEmpty) {
      await FirebaseMessaging.instance.deleteToken();
      fcmToken = await FirebaseMessaging.instance.getToken();
      print('new FCM Token: $fcmToken');

      await FirebaseFirestore.instance.collection('users').doc(userId).set(
        {
          'fcmToken': fcmToken,
        },
        SetOptions(merge: true),
      );
    }

    return fcmToken;
  }

  startTokenRetrieval() {
    userId = FirebaseAuth.instance.currentUser?.uid;

    if (userId == null) return;
    Timer.periodic(const Duration(seconds: 15), (Timer timer) async {
      // Check if the token is not in use before proceeding
      String? token = await getToken();

      // Print or handle the token as needed
      if (token != null) {
        print('Retrieved token: $token');
      } else {
        print('Failed to retrieve token');
      }
    });
  }

  // Pour refresh le token lorsque Functions le met à null car il est invalide
  // void listenForTokenRefresh(String userId) {
  //   FirebaseFirestore.instance
  //       .collection('users')
  //       .doc(userId)
  //       .snapshots()
  //       .listen((snapshot) async {
  //     final data = snapshot.data();
  //     print(data);
  //     if (data != null) {
  //       final currentToken = data['fcmToken'] as String?;
  //       print("currentToken : ${currentToken}");

  //       // Check if the token has changed
  //       // if (currentToken != null && currentToken != lastKnownToken) {
  //       //   lastKnownToken = currentToken;

  //       // If token is empty, refresh it
  //       if (currentToken == null) {
  //         final newToken = await channelService.getToken();
  //         print('New token generated and updated: $newToken');
  //       } else {
  //         print('Token refreshed and updated in Firestore: $currentToken');
  //       }
  //     }
  //     // }
  //   });
  // }

  static void setIsMute(bool isMuted) {
    isMute.value = isMuted;
  }

  sendMessage(String message, String name, String channel, String avatarUrl,
      [bool? isInGame]) {
    print("sending message in channel : $channel");
    if (channel.isEmpty) return;
    String collection = isInGame == true ? "game-channels" : "channels";

    Map<String, dynamic> newMessage = {
      "avatar": avatarUrl,
      "message": message.trim(),
      "username": name,
      "time": Timestamp.now(),
      "fromAdmins": false,
    };

    FirebaseFirestore.instance.collection(collection).doc(channel).update({
      "messages": FieldValue.arrayUnion([newMessage])
    });
  }

  Stream<List<Map<String, dynamic>>> getChannelMessages(String channel) {
    return FirebaseFirestore.instance
        .collection("channels")
        .doc(channel)
        .snapshots()
        .map((DocumentSnapshot snapshot) {
      if (snapshot.exists) {
        List<dynamic> messages = snapshot.get("messages");

        List<Map<String, dynamic>> messageList =
            List<Map<String, dynamic>>.from(messages);

        messageList.sort((a, b) {
          Timestamp timeA = a['time'];
          Timestamp timeB = b['time'];
          return timeB.compareTo(timeA);
        });

        return messageList;
      } else {
        return [];
      }
    });
  }

  Stream<List<Map<String, dynamic>>> getGameChannelMessages(String channel) {
    // if (channel.length <= 13) {
    //   room = channel.padLeft(channel.length + 13, "*");
    // }
    // print("getting channel : $channel");
    room = channel;
    print("getting messages room : $room");
    if (room.isEmpty) return Stream.value([]);

    return FirebaseFirestore.instance
        .collection("game-channels")
        .doc(room)
        .snapshots()
        .map((DocumentSnapshot snapshot) {
      if (snapshot.exists) {
        List<dynamic> messages = snapshot.get("messages");

        List<Map<String, dynamic>> messageList =
            List<Map<String, dynamic>>.from(messages);

        messageList.sort((a, b) {
          Timestamp timeA = a['time'];
          Timestamp timeB = b['time'];
          return timeB.compareTo(timeA);
        });

        return messageList;
      } else {
        return [];
      }
    });
  }

  updateLastMessageSeen(String channel) async {
    try {
      DocumentReference<Map<String, dynamic>> channelsRef =
          FirebaseFirestore.instance.collection('channels').doc(channel);

      DocumentSnapshot<Map<String, dynamic>> channelDoc =
          await channelsRef.get();

      List<Map<String, dynamic>> messages =
          List<Map<String, dynamic>>.from(channelDoc.data()?['messages'] ?? []);

      var lastMessageTime = messages.last['time'];

      userId = FirebaseAuth.instance.currentUser?.uid;

      DocumentReference<Map<String, dynamic>> myChannelsRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      DocumentSnapshot<Map<String, dynamic>> userDoc =
          await myChannelsRef.get();

      List<Map<String, dynamic>> joinedChannels =
          List<Map<String, dynamic>>.from(
              userDoc.data()?['joinedChannels'] ?? []);

      int channelIndex = joinedChannels
          .indexWhere((channelMap) => channelMap['title'] == channel);

      if (channelIndex != -1) {
        joinedChannels[channelIndex]['lastMessageSeen'] = lastMessageTime;

        await myChannelsRef.update({
          'joinedChannels': joinedChannels,
        });
        return;
      }

      List<Map<String, dynamic>> createdChannels =
          List<Map<String, dynamic>>.from(
              userDoc.data()?['createdChannels'] ?? []);

      channelIndex = createdChannels
          .indexWhere((channelMap) => channelMap['title'] == channel);

      if (channelIndex != -1) {
        createdChannels[channelIndex]['lastMessageSeen'] = lastMessageTime;

        await myChannelsRef.update({
          'createdChannels': createdChannels,
        });
        return;
      }
    } catch (e) {}
  }

  updateGameLastMessageSeen(String channel) async {
    try {
      // room = channel.padLeft(channel.length + 13, "*");
      print("updating channel : $channel");
      print("updating room : $room");
      room = channel;

      // Reference to the game channel document
      DocumentReference<Map<String, dynamic>> channelsRef =
          FirebaseFirestore.instance.collection('game-channels').doc(room);

      // Fetch the current document
      DocumentSnapshot<Map<String, dynamic>> channelDoc =
          await channelsRef.get();

      if (!channelDoc.exists) {
        print("Channel '$room' does not exist.");
        return;
      }

      // Extract the messages list
      List<dynamic> messages = channelDoc.data()?['messages'] ?? [];
      if (messages.isEmpty) {
        print("No messages in channel '$room'.");
        return;
      }

      // Get the timestamp of the last message
      var lastMessageTime = messages.last['time'];

      // Extract the members list
      List<dynamic> members = channelDoc.data()?['members'] ?? [];
      int memberIndex = members.indexWhere(
        (member) => member['username'] == name,
      );

      if (memberIndex == -1) {
        print("Member '$name' not found in channel '$room'.");
        return;
      }

      // Get the current member
      Map<String, dynamic> member = members[memberIndex];

      // Check if the lastMessageSeen needs updating
      if (member['lastMessageSeen'] != lastMessageTime) {
        // Update the lastMessageSeen for the member
        member['lastMessageSeen'] = lastMessageTime;

        // Update the members field in Firestore
        members[memberIndex] = member;
        await channelsRef.update({'members': members});
      }
      print("Last message already seen by '${name}'.");

      DocumentReference<Map<String, dynamic>> myChannelsRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      DocumentSnapshot<Map<String, dynamic>> userDoc =
          await myChannelsRef.get();

      List<Map<String, dynamic>> joinedChannels =
          List<Map<String, dynamic>>.from(
              userDoc.data()?['joinedChannels'] ?? []);

      int channelIndex = joinedChannels
          .indexWhere((channelMap) => channelMap['title'] == channel);

      if (channelIndex != -1) {
        joinedChannels[channelIndex]['lastMessageSeen'] = lastMessageTime;

        await myChannelsRef.update({
          'joinedChannels': joinedChannels,
        });
      }

      print("Successfully updated last message seen for '${name}'.");
    } catch (e) {
      print("Error updating the last message seen of '$room': $e");
    }
  }

  Stream<List<Map<String, dynamic>>> getOtherChannels() async* {
    try {
      QuerySnapshot channelsSnapshot =
          await FirebaseFirestore.instance.collection("channels").get();

      userId = FirebaseAuth.instance.currentUser?.uid;

      DocumentSnapshot userDoc = await FirebaseFirestore.instance
          .collection("users")
          .doc(userId)
          .get();

      Map<String, dynamic>? userData = userDoc.data() as Map<String, dynamic>?;

      List<Map<String, dynamic>> joinedChannels =
          List<Map<String, dynamic>>.from(userData?['joinedChannels'] ?? []);
      List<Map<String, dynamic>> createdChannels =
          List<Map<String, dynamic>>.from(userData?['createdChannels'] ?? []);

      List<String> joinedChannelTitles =
          joinedChannels.map((channel) => channel['title'].toString()).toList();
      List<String> createdChannelTitles = createdChannels
          .map((channel) => channel['title'].toString())
          .toList();

      List<Map<String, dynamic>> channelsNotJoined = channelsSnapshot.docs
          .where((doc) {
            var channelData = doc.data() as Map<String, dynamic>;
            return !joinedChannelTitles.contains(channelData['title']) &&
                !createdChannelTitles.contains(channelData['title']);
          })
          .map((doc) => doc.data() as Map<String, dynamic>)
          .toList();
      yield channelsNotJoined;
    } catch (e) {
      yield [];
    }
  }

  Stream<int> getTotalFriendsNotifs(String uid) {
    return FirebaseFirestore.instance
        .collection("users")
        .doc(uid)
        .snapshots()
        .map((userDoc) {
      if (userDoc.exists && userDoc.data()!.containsKey('requests')) {
        return List<Map<String, dynamic>>.from(userDoc.data()!['requests'])
            .toList()
            .length;
      } else {
        return 0;
      }
    });
  }

  // Vérifier que c'Est bien temps réel
  Stream<int> getChannelNotifs(String name, bool isCreated) {
    userId = FirebaseAuth.instance.currentUser?.uid;

    return FirebaseFirestore.instance
        .collection("users")
        .doc(userId)
        .snapshots()
        .switchMap((userDoc) {
      Map<String, dynamic>? userData = userDoc.data();

      if (userData == null) {
        return Stream.value(0);
      }

      String channelType = isCreated ? 'createdChannels' : 'joinedChannels';

      List<Map<String, dynamic>> channels =
          List<Map<String, dynamic>>.from(userData[channelType] ?? []);

      if (channels.isEmpty) {
        return Stream.value(0);
      }

      List<Stream<int>> notificationStreams = channels.map((channel) {
        String channelTitle = channel['title'];

        if (channelTitle.length > 13) {
          return getGameChannelTotalNotifs(channelTitle);
        }
        return getNumberNotifications(channelTitle, name);
      }).toList();

      return Rx.combineLatest(notificationStreams,
          (List<dynamic> notifications) {
        return notifications.fold<int>(
            0, (sum, notifs) => sum + (notifs as int));
      });
    });
  }

  Stream<int> getGameChannelTotalNotifs(String channel) {
    // Listen to the user document for real-time updates
    userId = FirebaseAuth.instance.currentUser?.uid;
    name = FirebaseAuth.instance.currentUser?.displayName;

    // room = channel.padLeft(channel.length + 13, "*");
    // print("getting channel : $channel");
    room = channel;
    // print("getting notifs room : $room");

    if (room.isEmpty) return Stream.value(0);

    // Now listen to the channel's document for real-time updates
    return FirebaseFirestore.instance
        .collection("game-channels")
        .doc(room)
        .snapshots()
        .map((channelDoc) {
      if (!channelDoc.exists) {
        return 0;
      }

      Map<String, dynamic>? channelData = channelDoc.data();

      if (channelData == null || !channelData.containsKey('messages')) {
        return 0;
      }

      // Get the list of messages in the channel
      List<dynamic> messages = channelData['messages'] ?? [];

      if (messages.isEmpty) {
        return 0; // No messages in the channel
      }

      // Get the timestamp of the last message in the channel
      Timestamp lastMessageTime = messages.last['time'];

      // if (messages.last['username'] == name) {
      //   return 0;
      // }
      // Get the user's lastMessageSeen timestamp for the channel
      List<dynamic> members = channelDoc.data()?['members'] ?? [];
      int memberIndex = members.indexWhere(
        (member) => member['username'] == name,
      );

      if (memberIndex == -1) {
        print("Member '$name' not found in channel '$room'.");
        return 0;
      }

      Timestamp? lastMessageSeen = members[memberIndex]['lastMessageSeen'];

      int missedMessagesCount = 0;
      if (lastMessageSeen != null &&
          lastMessageSeen.compareTo(lastMessageTime) < 0) {
        // Count the messages missed since lastMessageSeen
        missedMessagesCount = messages.where((msg) {
          return msg['time'].compareTo(lastMessageSeen) > 0;
        }).length;
      }

      return missedMessagesCount; // Return missed message count
    });
  }

  // Stream<int> getCreatedChannelNotifications(String name) {
  //   userId = FirebaseAuth.instance.currentUser?.uid;

  //   return FirebaseFirestore.instance
  //       .collection("users")
  //       .doc(userId)
  //       .snapshots()
  //       .switchMap((userDoc) {
  //     Map<String, dynamic>? userData = userDoc.data();

  //     if (userData == null) {
  //       return Stream.value(0);
  //     }

  //     List<Map<String, dynamic>> createdChannels =
  //         List<Map<String, dynamic>>.from(userData['createdChannels'] ?? []);

  //     List<Stream<int>> notificationStreams = createdChannels.map((channel) {
  //       String channelTitle = channel['title'];
  //       return getNumberNotifications(channelTitle, name);
  //     }).toList();

  //     return Rx.combineLatest(notificationStreams,
  //         (List<dynamic> notifications) {
  //       return notifications.fold<int>(
  //           0, (sum, notifs) => sum + (notifs as int));
  //     });
  //   });
  // }

  Stream<int> getTotalNotifications(String name) {
    Stream<int> joinedNotifications = getChannelNotifs(name, false);
    Stream<int> createdNotifications = getChannelNotifs(name, true);

    return Rx.combineLatest2(joinedNotifications, createdNotifications,
        (int joined, int created) {
      return joined + created;
    }).doOnData((currentCount) async {
      if (currentCount > lastNotificationCount) {
        final player = AudioPlayer();
        player.play(AssetSource('new_notif.mp3'));
      }
      lastNotificationCount = currentCount;
    });
  }

  Stream<int> getNumberNotifications(String channelTitle, String name) {
    // Listen to the user document for real-time updates
    userId = FirebaseAuth.instance.currentUser?.uid;

    return FirebaseFirestore.instance
        .collection("users")
        .doc(userId)
        .snapshots()
        .asyncExpand((userDoc) {
      // Parse user data from snapshot
      Map<String, dynamic>? userData = userDoc.data();

      if (userData == null) {
        return Stream.value(0);
      }

      // Get the user's joined and created channels
      List<Map<String, dynamic>> joinedChannels =
          List<Map<String, dynamic>>.from(userData['joinedChannels'] ?? []);
      List<Map<String, dynamic>> createdChannels =
          List<Map<String, dynamic>>.from(userData['createdChannels'] ?? []);

      // Combine both joined and created channels
      List<Map<String, dynamic>> allChannels = [
        ...joinedChannels,
        ...createdChannels
      ];

      // Find the user's record for the specified channel
      Map<String, dynamic>? userChannel = allChannels.firstWhere(
        (ch) => ch['title'] == channelTitle,
        orElse: () => {},
      );

      // Now listen to the channel's document for real-time updates
      return FirebaseFirestore.instance
          .collection("channels")
          .doc(channelTitle)
          .snapshots()
          .map((channelDoc) {
        if (!channelDoc.exists) {
          return 0;
        }

        Map<String, dynamic>? channelData = channelDoc.data();

        if (channelData == null || !channelData.containsKey('messages')) {
          return 0;
        }

        // Get the list of messages in the channel
        List<dynamic> messages = channelData['messages'] ?? [];

        if (messages.isEmpty) {
          return 0; // No messages in the channel
        }

        // Get the timestamp of the last message in the channel
        Timestamp lastMessageTime = messages.last['time'];

        if (messages.last['username'] == name) {
          return 0;
        }
        // Get the user's lastMessageSeen timestamp for the channel
        Timestamp? lastMessageSeen = userChannel['lastMessageSeen'];

        int missedMessagesCount = 0;
        if (lastMessageSeen != null &&
            lastMessageSeen.compareTo(lastMessageTime) < 0) {
          // Count the messages missed since lastMessageSeen
          missedMessagesCount = messages.where((msg) {
            return msg['time'].compareTo(lastMessageSeen) > 0;
          }).length;
        }

        return missedMessagesCount; // Return missed message count
      });
    });
  }

  Stream<int> numberNotif() {
    userId = FirebaseAuth.instance.currentUser?.uid;

    return FirebaseFirestore.instance
        .collection("users")
        .doc(userId)
        .snapshots()
        .map((userDoc) {
      if (userDoc.exists && userDoc.data()!.containsKey('requests')) {
        return List<Map<String, dynamic>>.from(userDoc.data()!['requests'])
            .toList()
            .length;
      } else {
        return 0;
      }
    });
  }

  Stream<List<Map<String, dynamic>>> searchOtherChannels(
      String searchText) async* {
    if (searchText.isEmpty) {
      yield* getOtherChannels();
    } else {
      String lowerCaseSearchText = searchText.toLowerCase();
      yield* getOtherChannels().map((channels) {
        return channels.where((channel) {
          String title = channel['title'].toString().toLowerCase();
          return title
                  .split(' ')
                  .any((word) => word.startsWith(lowerCaseSearchText.trim())) ||
              title.startsWith(lowerCaseSearchText.trim());
        }).toList();
      });
    }
  }

  joinChannel(String channel, String name) async {
    try {
      CollectionReference<Map<String, dynamic>> channelRef =
          FirebaseFirestore.instance.collection('channels');

      QuerySnapshot channelsSnapshot =
          await channelRef.where("title", isEqualTo: channel).get();

      if (channelsSnapshot.docs.isEmpty) {
        throw Exception("Le canal $channel n'existe pas.");
      }

      var time = Timestamp.now();

      await channelRef.doc(channel).update({
        "messages": FieldValue.arrayUnion([
          {
            "message": "$name a rejoint le canal.",
            "time": time,
            "username": name,
            "fromAdmins": true,
          },
        ])
      });

      // channelService.subscribeToChannelTopics(channel);
      userId = FirebaseAuth.instance.currentUser?.uid;

      DocumentReference<Map<String, dynamic>> myChannelsRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      DocumentSnapshot<Map<String, dynamic>> userDoc =
          await myChannelsRef.get();

      List<Map<String, dynamic>> joinedChannels =
          List<Map<String, dynamic>>.from(
              userDoc.data()?['joinedChannels'] ?? []);

      Map<String, dynamic> newChannel = {
        'lastMessageSeen': null,
        'title': channel,
      };

      joinedChannels.insert(1, newChannel);

      await myChannelsRef.update({
        'joinedChannels': joinedChannels,
      });

      updateLastMessageSeen(channel);
    } catch (e) {
      throw Exception("Erreur au moment de joindre $channel: $e");
    }
  }

  joinGameChannel(String channel) async {
    try {
      print("joining channel : $channel");
      room = channel;
      print("joining room : $room");

      CollectionReference<Map<String, dynamic>> channelRef =
          FirebaseFirestore.instance.collection('game-channels');

      QuerySnapshot channelsSnapshot =
          await channelRef.where("title", isEqualTo: room).get();

      if (channelsSnapshot.docs.isEmpty) {
        throw Exception("Le canal $room n'existe pas.");
      }

      var time = Timestamp.now();

      await channelRef.doc(room).update({
        "messages": FieldValue.arrayUnion([
          {
            "message": "$name a rejoint la partie.",
            "time": time,
            "username": name,
            "fromAdmins": true,
          },
        ]),
        "members": FieldValue.arrayUnion([
          {
            "lastMessageSeen": time,
            "username": name,
          },
        ]),
      });

      userId = FirebaseAuth.instance.currentUser?.uid;

      DocumentReference<Map<String, dynamic>> myChannelsRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      DocumentSnapshot<Map<String, dynamic>> userDoc =
          await myChannelsRef.get();

      List<Map<String, dynamic>> joinedChannels =
          List<Map<String, dynamic>>.from(
              userDoc.data()?['joinedChannels'] ?? []);

      Map<String, dynamic> newChannel = {
        'lastMessageSeen': time,
        'title': room,
      };

      joinedChannels.insert(1, newChannel);

      await myChannelsRef.update({
        'joinedChannels': joinedChannels,
      });

      updateGameLastMessageSeen(room);
    } catch (e) {
      print("Erreur au moment de joindre $room: $e");
    }
  }

  Stream<bool?> verifyChannel(String channel) {
    channel = channel.trim();
    return FirebaseFirestore.instance
        .collection('channels')
        .where('title', isEqualTo: channel)
        .limit(1)
        .snapshots()
        .map((snapshot) {
      if (channel.isEmpty) {
        createError = "";
        return null;
      }
      if (snapshot.docs.isNotEmpty) {
        createError = "Ce canal existe déjà.";
        return false;
      }
      createError = "";
      return true;
    });
  }

  Future<bool?> createChannel(String channel, String name) async {
    try {
      var time = Timestamp.now();

      await FirebaseFirestore.instance.collection("channels").doc(channel).set({
        "title": channel,
        "creator": name,
        "messages": [
          {
            "message": "Ce canal a été créé par : $name",
            "time": time,
            "username": name,
            "fromAdmins": true,
          },
        ]
      });

      // channelService.subscribeToChannelTopics(channel);

      DocumentReference<Map<String, dynamic>> myChannelsRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      DocumentSnapshot<Map<String, dynamic>> userDoc =
          await myChannelsRef.get();

      List<Map<String, dynamic>> createdChannels =
          List<Map<String, dynamic>>.from(
              userDoc.data()?['createdChannels'] ?? []);

      Map<String, dynamic> newChannel = {
        'lastMessageSeen': time,
        'title': channel,
      };

      createdChannels.insert(0, newChannel);

      await myChannelsRef.update({
        'createdChannels': createdChannels,
      });

      createError = "Votre canal a bien été créé!";
      notifyListeners();
      return true;
    } catch (e) {
      throw Exception("Erreur au moment de créer le canal $channel: $e");
    }
  }

  // getRoomName(String? channel) {
  //   print("room : $room");
  //   return channel room.substring(13);
  // }

  standardize(String room) {
    return room.length > 13 ? room : room.padLeft(room.length + 13, "*");
  }

  unstandardize(String room) {
    return room.length > 13 ? room.substring(13) : room;
  }

  createGameChannel(String channel, String name) async {
    try {
      print("creating channel : $channel");
      room = channel;
      print("creating room : $room");

      var lateTime = Timestamp.now();
      var updatedTime = lateTime.toDate().subtract(const Duration(seconds: 5));
      var time = Timestamp.fromDate(updatedTime);

      await FirebaseFirestore.instance
          .collection("game-channels")
          .doc(room)
          .set({
        "title": room,
        "creator": name,
        "members": [
          {
            "username": name,
            "lastMessageSeen": time,
          }
        ],
        "messages": [
          {
            "message": "Cette salle de jeu a été ouverte par : $name",
            "time": time,
            "username": name,
            "fromAdmins": true,
          },
        ],
      });

      DocumentReference<Map<String, dynamic>> myChannelsRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      DocumentSnapshot<Map<String, dynamic>> userDoc =
          await myChannelsRef.get();

      List<Map<String, dynamic>> joinedChannels =
          List<Map<String, dynamic>>.from(
              userDoc.data()?['joinedChannels'] ?? []);

      Map<String, dynamic> newChannel = {
        'lastMessageSeen': time,
        'title': room,
      };

      joinedChannels.insert(1, newChannel);

      await myChannelsRef.update({
        'joinedChannels': joinedChannels,
      });

      print("room created : $room");
      createError = "Votre canal a bien été créé!";
      notifyListeners();
      return true;
    } catch (e) {
      throw Exception("Erreur au moment de créer le canal de jeu $room: $e");
    }
  }

  Stream<List<Map<String, dynamic>>> getMyChannels(bool isCreated) async* {
    try {
      // Get the user document
      userId = FirebaseAuth.instance.currentUser?.uid;

      DocumentSnapshot userDoc = await FirebaseFirestore.instance
          .collection("users")
          .doc(userId)
          .get();

      Map<String, dynamic>? userData = userDoc.data() as Map<String, dynamic>?;

      // Determine which channel type to get (created or joined)
      String channelType =
          isCreated == true ? 'createdChannels' : 'joinedChannels';

      List<Map<String, dynamic>> allChannels =
          List<Map<String, dynamic>>.from(userData?[channelType] ?? []);

      List<String> channelTitles =
          allChannels.map((channel) => channel['title'].toString()).toList();

      List<Map<String, dynamic>> channels = [];

      // Iterate through the channels and retrieve their data
      for (String title in channelTitles) {
        DocumentSnapshot channelDoc = await FirebaseFirestore.instance
            .collection("channels")
            .doc(title)
            .get();

        DocumentSnapshot gameChannelDoc = await FirebaseFirestore.instance
            .collection("game-channels")
            .doc(title)
            .get();

        if (channelDoc.exists) {
          Map<String, dynamic>? channelData =
              channelDoc.data() as Map<String, dynamic>?;

          if (channelData != null) {
            channels.add(channelData);
          }
        }
        if (gameChannelDoc.exists) {
          Map<String, dynamic>? gameChannelData =
              gameChannelDoc.data() as Map<String, dynamic>?;

          if (gameChannelData != null) {
            channels.add(gameChannelData);
          }
        }
      }

      yield channels;
    } catch (e) {
      yield [];
    }
  }

  Stream<List<Map<String, dynamic>>> searchMyChannels(
      String searchText, bool isCreated) async* {
    if (searchText.isEmpty) {
      yield* getMyChannels(isCreated);
    } else {
      String lowerCaseSearchText = searchText.toLowerCase();
      yield* getMyChannels(isCreated).map((channels) {
        return channels.where((channel) {
          String title = channel['title'].toString().toLowerCase();
          return title
                  .split(' ')
                  .any((word) => word.startsWith(lowerCaseSearchText.trim())) ||
              title.startsWith(lowerCaseSearchText.trim());
        }).toList();
      });
    }
  }

  Future<bool> quitChannel(context, String channel, String name) async {
    // bool? confirmQuit = await showDialog<bool>(
    //   context: context,
    //   builder: (BuildContext context) {
    //     return MyDialog(
    //       title: 'Confirmer la sortie',
    //       text: 'Êtes-vous sûr de vouloir quitter le canal "$channel"?',
    //       positiveButtonAction: () {
    //         Navigator.of(context).pop(false);
    //       },
    //       positiveButtonText: 'Annuler',
    //       negativeButtonAction: () {
    //         Navigator.of(context).pop(true);
    //       },
    //       negativeButtonText: 'Quitter',
    //     );
    //   },
    // );
    // if (confirmQuit == true && channel != "KAM? PAF!") {
    try {
      CollectionReference<Map<String, dynamic>> channelRef =
          FirebaseFirestore.instance.collection('channels');

      QuerySnapshot channelsSnapshot =
          await channelRef.where("title", isEqualTo: channel).get();

      if (channelsSnapshot.docs.isEmpty) {
        print("Le canal $channel n'existe pas.");
        return false;
      }

      channelRef.doc(channel).update({
        "messages": FieldValue.arrayUnion([
          {
            "message": "$name a quitté le canal.",
            "username": name,
            "time": Timestamp.now(),
            "fromAdmins": true,
          }
        ])
      });

      // channelService.unsubscribeToChannelTopics(channel);
      userId = FirebaseAuth.instance.currentUser?.uid;

      DocumentReference<Map<String, dynamic>> myChannelsRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      DocumentSnapshot<Map<String, dynamic>> userDoc =
          await myChannelsRef.get();
      List<Map<String, dynamic>> joinedChannels =
          List<Map<String, dynamic>>.from(
              userDoc.data()?['joinedChannels'] ?? []);

      joinedChannels.removeWhere((ch) => ch['title'] == channel);

      await myChannelsRef.update({
        'joinedChannels': joinedChannels,
      });
      // showSnackBar(context, 'Vous avez quitté $channel!');
      return true;
    } catch (e) {
      print('Erreur au moment de quitter $channel: $e');
    }
    return false;
    // }
    // return confirmQuit ?? false;
  }

  quitGameChannel(
    context,
    String channel,
    bool isHost,
    bool isWaitingRoom,
    bool isResults,
  ) async {
    try {
      print("quitting channel : $channel");
      room = channel;
      print("quitting room : $room");
      userId = FirebaseAuth.instance.currentUser?.uid;

      DocumentReference<Map<String, dynamic>> myChannelsRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      DocumentSnapshot<Map<String, dynamic>> userDoc =
          await myChannelsRef.get();
      List<Map<String, dynamic>> joinedChannels =
          List<Map<String, dynamic>>.from(
              userDoc.data()?['joinedChannels'] ?? []);

      joinedChannels.removeWhere((ch) => ch['title'] == room);

      await myChannelsRef.update({
        'joinedChannels': joinedChannels,
      });

      DocumentReference<Map<String, dynamic>> channelRef =
          FirebaseFirestore.instance.collection('game-channels').doc(room);
      DocumentSnapshot<Map<String, dynamic>> channelDoc =
          await channelRef.get();

      if (!channelDoc.exists) {
        print("La salle de jeu n'existe plus.");
        ChannelService.selectedChannel = "KAM? PAF!";
        return;
      }

      List<dynamic> members = channelDoc.data()?['members'] ?? [];

      print("members : $members");

      bool allPlayersQuit = members.length <= 2;

      print("isResults : $isResults");
      print("isWaitingRoom : $isWaitingRoom");
      print("allPlayersQuit : $allPlayersQuit");
      print("isHost : $isHost");

      if (!isHost && !isWaitingRoom && !isResults && allPlayersQuit) {
        ChannelService.selectedChannel = "KAM? PAF!";
        return;
      }

      if ((!isResults && isHost) || (isResults && allPlayersQuit)) {
        print("selectedChannel before delete : $selectedChannel");
        await deleteGameChannel(context, room);
        print("selectedChannel after delete : $selectedChannel");
        ChannelService.selectedChannel = "KAM? PAF!";
        return;
      }

      int memberIndex = members.indexWhere(
        (member) => member['username'] == name,
      );

      channelRef.update({
        "messages": FieldValue.arrayUnion([
          {
            "message": "$name a abandonné la partie.",
            "username": name,
            "time": Timestamp.now(),
            "fromAdmins": true,
          }
        ]),
        "members": FieldValue.arrayRemove([members[memberIndex]]),
      });
      print("selectedChannel abandon: $selectedChannel");
      ChannelService.selectedChannel = "KAM? PAF!";
      // showSnackBar(context, 'Vous avez abandonné la salle de jeu.');
    } catch (e) {
      print("Erreur lors de l'abandon de la salle de jeu: $e");
      // showSnackBar(context, "Une erreur s'est produite.");
    }
  }

  deleteChannel(context, String channel, String name) async {
    // bool? confirmDelete = await showDialog<bool>(
    //   context: context,
    //   builder: (BuildContext context) {
    //     return MyDialog(
    //       // Lang
    //       title: 'Confirmer la suppression',
    //       text: 'Êtes-vous sûr de vouloir supprimer le canal "$channel"?',
    //       positiveButtonText: 'Supprimer',
    //       positiveButtonAction: () {
    //         Navigator.of(context).pop(false);
    //       },
    //       negativeButtonAction: () {
    //         Navigator.of(context).pop(true);
    //       },
    //       negativeButtonText: 'Annuler',
    //     );
    //   },
    // );

    // if (confirmDelete == true) {
    try {
      CollectionReference<Map<String, dynamic>> channelsCollection =
          FirebaseFirestore.instance.collection('channels');

      QuerySnapshot channelsSnapshot =
          await channelsCollection.where("title", isEqualTo: channel).get();

      if (channelsSnapshot.docs.isEmpty) {
        print("Le canal $channel n'existe pas.");
        return;
      }

      await channelsCollection.doc(channel).update({
        "messages": FieldValue.arrayUnion([
          {
            "message": "$name a supprimé le canal.",
            "username": name,
            "time": Timestamp.now(),
            "fromAdmins": true,
          }
        ])
      });

      // channelService.unsubscribeToChannelTopics(channel);

      QuerySnapshot<Map<String, dynamic>> usersSnapshot =
          await FirebaseFirestore.instance.collection('users').get();

      for (var userDoc in usersSnapshot.docs) {
        var userData = userDoc.data();
        var uid = userDoc.id;

        List<dynamic> joinedChannels =
            List<dynamic>.from(userData['joinedChannels'] ?? []);

        // Make sure the joinedChannels is a list of maps and not strings
        joinedChannels.removeWhere((ch) {
          if (ch is Map<String, dynamic>) {
            return ch['title'] == channel;
          } else if (ch is String) {
            // À enlever wuand les users seront bien créés
            return ch == channel;
          }
          return false;
        });

        await FirebaseFirestore.instance.collection('users').doc(uid).update({
          'joinedChannels': joinedChannels,
        });
      }

      DocumentReference channelDocRef = channelsCollection.doc(channel);

      await channelDocRef.delete();

      userId = FirebaseAuth.instance.currentUser?.uid;

      DocumentReference<Map<String, dynamic>> myChannelsRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      DocumentSnapshot<Map<String, dynamic>> userDoc =
          await myChannelsRef.get();
      List<dynamic> createdChannels =
          List<dynamic>.from(userDoc.data()?['createdChannels'] ?? []);

      // Make sure the createdChannels is a list of maps and not strings
      createdChannels.removeWhere((ch) {
        if (ch is Map<String, dynamic>) {
          return ch['title'] == channel;
        } else if (ch is String) {
          // À enlever quand les users seront bien créés
          return ch == channel;
        }
        return false;
      });

      await myChannelsRef.update({
        'createdChannels': createdChannels,
      });
      // showSnackBar(context, 'Le canal $channel a été supprimé avec succès.');
      return true;
    } catch (e) {
      // showSnackBar(
      //     context, 'Erreur au moment de supprimer le canal $channel: $e');
    }
    return false;
    // }
  }

  deleteGameChannel(context, String channel) async {
    try {
      print("deleting channel : $channel");
      room = channel;
      print("deleting room : $room");

      CollectionReference<Map<String, dynamic>> channelsCollection =
          FirebaseFirestore.instance.collection('game-channels');

      QuerySnapshot channelsSnapshot =
          await channelsCollection.where("title", isEqualTo: room).get();

      if (channelsSnapshot.docs.isEmpty) {
        ChannelService.selectedChannel = "KAM? PAF!";
        return;
      }

      await channelsCollection.doc(room).update({
        "messages": FieldValue.arrayUnion([
          {
            "message": "$name a supprimé la salle de jeu.",
            "username": name,
            "time": Timestamp.now(),
            "fromAdmins": true,
          }
        ])
      });

      await channelsCollection.doc(room).delete();
      ChannelService.selectedChannel = "KAM? PAF!";
    } catch (e) {
      showSnackBar(context, 'Erreur au moment de supprimer la salle : $e');
    }
  }

  deleteRoomsInUserChannels() async {
    try {
      // Get the current user ID
      userId = FirebaseAuth.instance.currentUser?.uid;

      // Retrieve the user's channels
      DocumentReference<Map<String, dynamic>> myChannelsRef =
          FirebaseFirestore.instance.collection('users').doc(userId);

      DocumentSnapshot<Map<String, dynamic>> userDoc =
          await myChannelsRef.get();
      List<Map<String, dynamic>> joinedChannels =
          List<Map<String, dynamic>>.from(
              userDoc.data()?['joinedChannels'] ?? []);

      // A list to store channels to be removed
      List<Map<String, dynamic>> channelsToRemove = [];

      // Find all channels with titles longer than 13 characters
      for (var channel in joinedChannels) {
        String title = channel['title'] ?? '';
        if (title.length > 13) {
          print("about to delete $title");
          // Query the game-channels collection to check the members count
          CollectionReference<Map<String, dynamic>> gameChannelsRef =
              FirebaseFirestore.instance.collection('game-channels');

          QuerySnapshot channelSnapshot =
              await gameChannelsRef.where('title', isEqualTo: title).get();

          if (channelSnapshot.docs.isNotEmpty) {
            QueryDocumentSnapshot<Object?> gameChannelDoc =
                channelSnapshot.docs.first;
            List members =
                (gameChannelDoc.data() as Map<String, dynamic>)['members'] ??
                    [];

            // If the channel has only one member, delete the document
            if (members.length == 1) {
              await gameChannelsRef.doc(gameChannelDoc.id).delete();
              print('Channel $title deleted from game-channels.');
            }
          }

          // Add the channel to the list of channels to remove
          channelsToRemove.add(channel);
        }
      }

      // Remove the channels from the original list
      joinedChannels.removeWhere((ch) => channelsToRemove.contains(ch));

      // Update the user's joined channels
      await myChannelsRef.update({
        'joinedChannels': joinedChannels,
      });

      print("User's joined channels have been updated.");
      return true;
    } catch (e) {
      print('Erreur au moment de nettoyer les canaux joints: $e');
    }
  }
}
