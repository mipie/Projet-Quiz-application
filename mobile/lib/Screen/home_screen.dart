import 'package:audioplayers/audioplayers.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/create_session_screen.dart';
import 'package:mobile/Screen/home_screen_consts.dart';
import 'package:mobile/Screen/lobbies_screen.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/dialog_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Services/shop_service.dart';
import 'package:mobile/Services/statistics_service.dart';
import 'package:mobile/Services/user_service.dart';
import 'package:mobile/Services/wallet_service.dart';
import 'package:mobile/Sockets/socket_service.dart';
import 'package:mobile/Widget/button.dart';
import 'package:mobile/Widget/chat_button.dart';
import 'package:mobile/Widget/profile_button.dart';
import 'package:provider/provider.dart';

class HomeScreen extends StatefulWidget {
  final String name;
  static const route = "/home-screen";

  const HomeScreen({super.key, required this.name});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final SocketService _socketService = SocketService();
  SettingsService settingsService = SettingsService();
  WalletService walletService = WalletService();
  ChannelService channelService = ChannelService();
  ShopService shopService = ShopService();
  StatisticsService statisticsService = StatisticsService();
  DialogService dialogService = DialogService();
  String? userId = FirebaseAuth.instance.currentUser?.uid;
  final player = AudioPlayer();
  bool hasPlayedSound = false;
  final UserService _userService = UserService();

  @override
  void initState() {
    super.initState();
    _socketService.reconnect();
    _socketService.removeAllListeners();
    _userService.listenToAccountChanges(FirebaseAuth.instance.currentUser!.uid);
    Provider.of<SettingsService>(context, listen: false)
        .listenToSettingsChanges();
    Provider.of<WalletService>(context, listen: false)
        .listenToSettingsChanges();
    print("listened to changes...");
    channelService.setupFirebaseMessaging(context);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      // Pour refresh le token lorsque Functions le met à null car il est invalide
      // channelService
      //     .listenForTokenRefresh(FirebaseAuth.instance.currentUser!.uid);

      // await channelService.startTokenRetrieval();
      await channelService.deleteRoomsInUserChannels();
      await settingsService.getUsername();
      await settingsService.loadLanguage();
      ChannelService.setIsMute(false);
    });
  }

  @override
  void dispose() {
    super.dispose();
  }

  void playNotificationSound() async {
    await player.setSource(
        AssetSource('new_notif.mp3')); // Make sure the file is in your assets
    await player.resume(); // Play the sound
  }

  bool isLandscape(BuildContext context) {
    return MediaQuery.of(context).orientation == Orientation.landscape;
  }

  @override
  Widget build(BuildContext context) {
    double height = MediaQuery.of(context).size.height;

    settingsService = Provider.of<SettingsService>(context);
    channelService = Provider.of<ChannelService>(context);

    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          // Background theme image
          Positioned.fill(
            child: settingsService.currentThemeUrl != ""
                ? Consumer<SettingsService>(
                    builder: (context, settingsService, child) {
                      return Image.network(
                        settingsService.currentThemeUrl,
                        fit: BoxFit.cover,
                      );
                    },
                  )
                : Image.asset(
                    "assets/noImage.jpg",
                    fit: BoxFit.cover,
                  ),
          ),
          // Main body content
          Positioned.fill(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    children: [
                      SizedBox(
                        height: height * 0.15,
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 30),
                        decoration: const BoxDecoration(
                            color: Colors.transparent,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.white70,
                                blurRadius: 5000,
                              )
                            ]),
                        child: Text(
                          HomeScreenConsts.get(
                              "kamPaf", settingsService.language),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 120,
                            fontFamily: "Title",
                          ),
                        ),
                      ),
                      Text(
                        HomeScreenConsts.get(
                            "quizGames", settingsService.language),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 30,
                          fontFamily: "Text",
                        ),
                      ),
                    ],
                  ),
                  !isLandscape(context)
                      ? Image.asset(
                          "assets/logoKamPaf.png",
                          height: 300,
                        )
                      : const SizedBox.shrink(),
                  Column(
                    children: [
                      MyButton(
                        onTab: () async {
                          showDialog(
                            context: context,
                            builder: (context) =>
                                LobbiesScreen(name: settingsService.username),
                          );
                        },
                        text: HomeScreenConsts.get(
                            "joinGame", settingsService.language),
                        width: 300,
                      ),
                      MyButton(
                        onTab: () async {
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(
                              builder: (context) =>
                                  SessionScreen(name: settingsService.username),
                            ),
                          );
                        },
                        text: HomeScreenConsts.get(
                            "createGame", settingsService.language),
                        width: 300,
                      ),
                    ],
                  ),
                  Column(
                    children: [
                      Text(
                        HomeScreenConsts.get(
                            "team107", settingsService.language),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                          fontFamily: "Text",
                        ),
                      ),
                      const Text(
                        "Kevin Habchy, Anis Ait-Kaci Ali, Michlove Pierre, Pungtzé-Sy Djoetchuang Kamdem, Ali Elmoussaoui, Farid Bakir",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 15,
                          fontFamily: "Text",
                        ),
                      ),
                      SizedBox(height: height / 10),
                    ],
                  ),
                ],
              ),
            ),
          ),
          // AppBar or ToolBar
          Positioned(
            top: 30,
            left: 10,
            child: ChatButton(
              name: settingsService.username,
              channel: ChannelService.selectedChannel,
              isInGame: false,
            ),
          ),
          Positioned(
            top: 20,
            right: 0,
            child: ProfileButton(name: settingsService.username),
          ),
        ],
      ),
    );
  }
}
