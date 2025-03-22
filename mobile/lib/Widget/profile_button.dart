import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/friend_screen.dart';
import 'package:mobile/Screen/login_screen.dart';
import 'package:mobile/Screen/theme_consts.dart';
import 'package:mobile/Services/authentication.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/dialog_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Services/shop_service.dart';
import 'package:mobile/Services/statistics_service.dart';
import 'package:mobile/Services/user_service.dart';
import 'package:mobile/Widget/profile_button_consts.dart';
import 'package:mobile/Widget/progress_bar.dart';
import 'package:provider/provider.dart';

class ProfileButton extends StatefulWidget {
  final String name;
  final bool? isProfileVisible;

  const ProfileButton(
      {super.key, required this.name, this.isProfileVisible = false});

  @override
  State<ProfileButton> createState() => ProfileButtonState();
}

class ProfileButtonState extends State<ProfileButton> {
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  ShopService shopService = ShopService();
  StatisticsService statisticsService = StatisticsService();
  DialogService dialogService = DialogService();
  String? userId = FirebaseAuth.instance.currentUser?.uid;
  final UserService _userService = UserService();

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context);
    channelService = Provider.of<ChannelService>(context);

    return Row(
      children: [
        InkWell(
          onTap: () {
            // Mettre dans DialogService et dans ChangeDialog
            showMenu(
              context: context,
              elevation: 0,
              color: Colors.transparent,
              menuPadding: const EdgeInsets.only(top: 45),
              position: const RelativeRect.fromLTRB(255, 100, 0, 0),
              items: [
                PopupMenuItem(
                  value: 'friends',
                  padding: const EdgeInsets.only(
                    top: 2.5,
                    bottom: 2.5,
                    left: 5,
                    right: 5,
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                        borderRadius:
                            const BorderRadius.all(Radius.circular(10)),
                        color: ThemeConsts.get("myFriendsHeaderBackground",
                            settingsService.currentTheme),
                        boxShadow: const [
                          BoxShadow(
                              color: Colors.black26,
                              offset: Offset(0, 2),
                              blurRadius: 10)
                        ]),
                    padding: const EdgeInsets.all(10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Image.asset(
                          'assets/myFriendsIcon.png',
                          scale: 18,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                ProfileButtonConsts.get(
                                    "friends", settingsService.language),
                                style: const TextStyle(
                                    fontSize: 20, fontFamily: "Text"),
                              ),
                              if (userId != null)
                                StreamBuilder<int>(
                                  stream: channelService.numberNotif(),
                                  builder: (context, snapshot) {
                                    if (snapshot.hasData &&
                                        snapshot.data! > 0) {
                                      return Container(
                                        width: 25,
                                        height: 25,
                                        decoration: const BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Colors.red,
                                        ),
                                        child: Center(
                                          child: Text(
                                            '${snapshot.data}',
                                            style: const TextStyle(
                                              fontFamily: "Text",
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                            ),
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
                        const SizedBox(width: 10),
                      ],
                    ),
                  ),
                ),
                PopupMenuItem(
                  value: 'shop',
                  padding: const EdgeInsets.only(
                    top: 2.5,
                    bottom: 2.5,
                    left: 5,
                    right: 5,
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                        borderRadius:
                            const BorderRadius.all(Radius.circular(10)),
                        color: ThemeConsts.get("shopHeaderBackground",
                            settingsService.currentTheme),
                        boxShadow: const [
                          BoxShadow(
                              color: Colors.black26,
                              offset: Offset(0, 2),
                              blurRadius: 10)
                        ]),
                    padding: const EdgeInsets.all(10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.palette,
                          color: Colors.black,
                          size: 28,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          ProfileButtonConsts.get(
                              "shop", settingsService.language),
                          style: const TextStyle(
                            fontSize: 20,
                            fontFamily: "Text",
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                PopupMenuItem(
                  value: 'stats',
                  padding: const EdgeInsets.only(
                    top: 2.5,
                    bottom: 2.5,
                    left: 5,
                    right: 5,
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                        borderRadius:
                            const BorderRadius.all(Radius.circular(10)),
                        color: ThemeConsts.get("statisticsHeaderBackground",
                            settingsService.currentTheme),
                        boxShadow: const [
                          BoxShadow(
                              color: Colors.black26,
                              offset: Offset(0, 2),
                              blurRadius: 10)
                        ]),
                    padding: const EdgeInsets.all(10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Image.asset(
                          'assets/trophy.png',
                          scale: 18,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          ProfileButtonConsts.get(
                              "stats", settingsService.language),
                          style: const TextStyle(
                            fontSize: 20,
                            fontFamily: "Text",
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                PopupMenuItem(
                  value: 'settings',
                  padding: const EdgeInsets.only(
                    top: 2.5,
                    bottom: 2.5,
                    left: 5,
                    right: 5,
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                        borderRadius:
                            const BorderRadius.all(Radius.circular(10)),
                        color: ThemeConsts.get(
                            "profileSettingsHeaderBackground",
                            settingsService.currentTheme),
                        boxShadow: const [
                          BoxShadow(
                              color: Colors.black26,
                              offset: Offset(0, 2),
                              blurRadius: 10)
                        ]),
                    padding: const EdgeInsets.all(10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.settings,
                          size: 28,
                        ),
                        const SizedBox(width: 10),
                        Text(
                            ProfileButtonConsts.get(
                                "profile_settings", settingsService.language),
                            style: const TextStyle(
                                fontSize: 20, fontFamily: "Text")),
                      ],
                    ),
                  ),
                ),
                PopupMenuItem(
                  value: 'logout',
                  padding: const EdgeInsets.only(
                    top: 2.5,
                    bottom: 2.5,
                    left: 5,
                    right: 5,
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                        borderRadius:
                            const BorderRadius.all(Radius.circular(10)),
                        color: ThemeConsts.get("logoutHeaderBackground",
                            settingsService.currentTheme),
                        boxShadow: const [
                          BoxShadow(
                              color: Colors.white30,
                              offset: Offset(0, 2),
                              blurRadius: 10)
                        ]),
                    padding: const EdgeInsets.all(10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(left: 3),
                          child: Icon(
                            Icons.logout,
                            size: 26,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                            ProfileButtonConsts.get(
                                "logout", settingsService.language),
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontFamily: "Text")),
                      ],
                    ),
                  ),
                ),
              ],
            ).then((value) async {
              if (value == 'logout') {
                await AuthServices().signOut();
                String uid = FirebaseAuth.instance.currentUser?.uid ?? '';
                settingsService.updateAccountLogsHistory(uid);

                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(
                    builder: (context) => const LoginScreen(),
                  ),
                );
              } else if (value == "friends") {
                showDialog(
                  context: context,
                  builder: (context) => const FriendScreen(),
                );
              } else if (value == "shop") {
                shopService.openDialogue(context);
              } else if (value == "stats") {
                statisticsService.openChat(context);
              } else if (value == "settings") {
                settingsService.openChat(context);
              }
            });
          },
          child: Column(
            children: [
              const SizedBox(
                height: 10,
              ),
              Stack(
                alignment: AlignmentDirectional.centerEnd,
                children: [
                  Padding(
                    padding:
                        const EdgeInsets.only(top: 8, bottom: 8, right: 35),
                    child: StreamBuilder<int>(
                      stream: _userService.experienceStream,
                      builder: (context, snapshot) {
                        const maxExperience =
                            100; // Valeur maximale de progression
                        final experience =
                            _userService.cachedExperience % maxExperience;
                        final level =
                            (_userService.cachedExperience ~/ maxExperience) +
                                1;

                        final progress =
                            (experience / maxExperience).clamp(0.0, 1.0);

                        return Column(
                          mainAxisAlignment: MainAxisAlignment.start,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Barre d'expérience
                            Text(
                              '${ProfileButtonConsts.get("level", settingsService.language)}$level',
                              style: const TextStyle(
                                fontFamily: "Text",
                                fontSize: 14,
                                color: Colors.black,
                                shadows: [
                                  Shadow(
                                    blurRadius: 10,
                                    color: Colors.white,
                                  ),
                                ],
                              ),
                            ),
                            Stack(
                              alignment: Alignment.center,
                              children: [
                                Stack(
                                  alignment: Alignment.centerLeft,
                                  children: [
                                    Container(
                                      width: 150,
                                      height: 20,
                                      decoration: BoxDecoration(
                                        color: const Color.fromARGB(
                                            255, 212, 212, 212),
                                        borderRadius: BorderRadius.circular(5),
                                      ),
                                    ),
                                    Transform.rotate(
                                      angle: 3.14159,
                                      child: StripedProgressBar(progress),
                                    ),
                                  ],
                                ),
                                Text(
                                  '$experience / 100',
                                  style: const TextStyle(
                                    fontFamily: "Text",
                                    fontSize: 14,
                                    color: Colors.black,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(
                              height: 20,
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                  StreamBuilder<String?>(
                    stream: settingsService.getCurrentAvatar(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(
                          child: const CircularProgressIndicator(
                            color: Colors.white,
                          ),
                        );
                      }
                      return Stack(
                        children: [
                          Column(
                            children: [
                              Container(
                                margin:
                                    const EdgeInsets.only(right: 5, top: 12),
                                padding: const EdgeInsets.all(
                                    3), // Padding for the black border
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.black,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.white,
                                      blurRadius: 10,
                                      offset: Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Container(
                                  padding: const EdgeInsets.all(
                                      2), // Padding for the white border
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors
                                        .white, // Middle white border color
                                  ),
                                  child: Container(
                                    padding: const EdgeInsets.all(
                                        25), // Inner padding for image
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      image: DecorationImage(
                                        image: snapshot.data != "" &&
                                                snapshot.data != null
                                            ? NetworkImage(snapshot.data!)
                                            : const AssetImage(
                                                "assets/noImage.jpg"),
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(
                                height: 5,
                              ),
                              Text(
                                settingsService.username,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontFamily: "Text",
                                  shadows: [
                                    Shadow(
                                      color: Colors.white,
                                      blurRadius: 20,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          Positioned(
                            top: 13,
                            right: 3,
                            child: userId != null
                                ? StreamBuilder<int>(
                                    stream: channelService
                                        .getTotalFriendsNotifs(userId!),
                                    builder: (context, snapshot) {
                                      if (snapshot.hasData &&
                                          snapshot.data! > 0) {
                                        return Container(
                                          height: 20,
                                          width: 20,
                                          decoration: const BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: Colors.red,
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.white,
                                                blurRadius: 8,
                                              )
                                            ],
                                          ),
                                          child: const Text(
                                            '',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                              fontFamily: "Text",
                                            ),
                                          ),
                                        );
                                      }
                                      return const SizedBox();
                                    },
                                  )
                                : const SizedBox.shrink(),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(
          width: 20,
        ),
      ],
    );
  }
}
