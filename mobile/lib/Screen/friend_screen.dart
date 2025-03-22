import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/friend_screen_consts.dart';
import 'package:mobile/Screen/theme_consts.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/my_friend.dart';
import 'package:mobile/Widget/search_friend.dart';
import 'package:provider/provider.dart';

class FriendScreen extends StatefulWidget {
  const FriendScreen({super.key});

  @override
  State<FriendScreen> createState() => _FriendScreenState();
}

class _FriendScreenState extends State<FriendScreen> {
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();

  bool isFriendsTab = true;
  String? userId = FirebaseAuth.instance.currentUser?.uid;

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context, listen: false);

    double width = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;

    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        width: width * 0.7, // Set a fixed width for the dialog
        height: height * 0.9,
        decoration: BoxDecoration(
          shape: BoxShape.rectangle,
          border: Border.all(color: Colors.black87, width: 7),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Container(
          decoration: BoxDecoration(
            shape: BoxShape.rectangle,
            border: Border.all(color: Colors.white70, width: 8),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Stack(
            children: [
              Positioned.fill(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: settingsService.currentThemeUrl != ""
                      ? Image.network(
                          settingsService.currentThemeUrl,
                          fit: BoxFit.cover,
                        )
                      : Image.asset(
                          "assets/noImage.jpg",
                          fit: BoxFit.cover,
                        ),
                ),
              ),
              // SingleChildScrollView(
              Container(
                padding: const EdgeInsets.all(15),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    GestureDetector(
                      onTap: () {
                        // Ouvrir ChangeDialog
                      },
                      child: Container(
                        height: 75,
                        decoration: BoxDecoration(
                          shape: BoxShape.rectangle,
                          color: ThemeConsts.get("myFriendsHeaderBackground",
                              settingsService.currentTheme),
                          border: Border.all(
                              color: ThemeConsts.get("myFriendsHeaderBorder",
                                  settingsService.currentTheme),
                              width: 1),
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: const [
                            BoxShadow(
                              offset: Offset(0, 2),
                              blurRadius: 3,
                              spreadRadius: 3,
                              color: Colors.black12,
                            )
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              FriendScreenConsts.get(
                                  "myFriends", settingsService.language),
                              style: const TextStyle(
                                  color: Colors.black,
                                  fontSize: 30,
                                  fontFamily: "Text"),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const Divider(
                      color: Colors.white,
                    ),
                    Container(
                      decoration: const BoxDecoration(
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(10),
                          topRight: Radius.circular(10),
                        ),
                      ),
                      height: 50,
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  isFriendsTab =
                                      true; // Sélectionner l'onglet "Mes amis"
                                });
                              },
                              child: Container(
                                decoration: BoxDecoration(
                                  color: isFriendsTab
                                      ? Colors.white54
                                      : Colors.black12,
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(10),
                                  ),
                                ),
                                child: Center(
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        FriendScreenConsts.get(
                                            "manageMyFriends",
                                            settingsService.language),
                                        style: TextStyle(
                                          fontFamily: "Text",
                                          fontSize: 18,
                                          color: !isFriendsTab
                                              ? Colors.black26
                                              : const Color.fromARGB(200, 0, 0,
                                                  0), // Changer la couleur selon l'onglet sélectionné
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      if (userId != null)
                                        StreamBuilder<int>(
                                          stream: channelService
                                              .getTotalFriendsNotifs(userId!),
                                          builder: (context, snapshot) {
                                            if (snapshot.hasData &&
                                                snapshot.data! > 0) {
                                              return Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                        vertical: 2),
                                                decoration: const BoxDecoration(
                                                  shape: BoxShape.circle,
                                                  color: Colors.red,
                                                ),
                                                child: Text(
                                                  '${snapshot.data}',
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontWeight: FontWeight.bold,
                                                    fontFamily: "Text",
                                                  ),
                                                ),
                                              );
                                            }
                                            return const SizedBox();
                                          },
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  isFriendsTab =
                                      false; // Sélectionner l'onglet "Rechercher"
                                });
                              },
                              child: Container(
                                decoration: BoxDecoration(
                                  color: !isFriendsTab
                                      ? Colors.white54
                                      : Colors.black12,
                                  borderRadius: const BorderRadius.only(
                                    topRight: Radius.circular(10),
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    FriendScreenConsts.get("searchNewFriend",
                                        settingsService.language),
                                    style: TextStyle(
                                      fontFamily: "Text",
                                      fontSize: 18,
                                      color: isFriendsTab
                                          ? Colors.black26
                                          : const Color.fromARGB(200, 0, 0,
                                              0), // Changer la couleur selon l'onglet sélectionné
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: isFriendsTab
                          ? const MyFriend()
                          : const SearchFriend(),
                    ),
                    const Divider(
                      color: Colors.white,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
