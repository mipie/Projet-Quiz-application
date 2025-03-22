import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:mobile/Screen/lobbies_screen_consts.dart';
import 'package:mobile/Screen/observer_screen.dart';
import 'package:mobile/Screen/waiting_room_screen.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/room_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Services/user_service.dart';
import 'package:mobile/Sockets/socket_service.dart';
import 'package:mobile/Widget/button.dart';
import 'package:mobile/Widget/chat_button.dart';
import 'package:mobile/Widget/dialog.dart';
import 'package:mobile/Widget/home_button.dart';
import 'package:mobile/Widget/join_code.dart';
import 'package:mobile/Widget/snack_bar.dart';
import 'package:provider/provider.dart';

class LobbiesScreen extends StatefulWidget {
  final String name;

  const LobbiesScreen({super.key, required this.name});

  @override
  State<LobbiesScreen> createState() => _LobbiesScreen();
}

class _LobbiesScreen extends State<LobbiesScreen> {
  final UserService _userService = UserService();
  final SocketService _socketService = SocketService();
  RoomService _roomService = RoomService();
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  String name = FirebaseAuth.instance.currentUser!.displayName.toString();
  List<dynamic> listRoom = [];
  String? selectedGame;
  String? previousSelection;
  dynamic currentGame;

  final TextEditingController _codeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _userService.listenToAccountChanges(FirebaseAuth.instance.currentUser!.uid);
    _socketService.reconnect();
    _socketService.sendMessage('getAllRooms', null);
    _socketService.listenToEvent('actualRooms', (data) {
      setState(() {
        listRoom = data;
      });
    });

    _socketService.listenToEvent('verifiedCode', (data) async {
      if (data == null) {
        selectedGame = null;
        showSnackBar(
            context,
            LobbiesScreenConsts.get(
                "roomDoesNotExist", settingsService.language));
      } else if (data == false) {
        showSnackBar(context,
            LobbiesScreenConsts.get("roomIsLocked", settingsService.language));
      } else {
        dynamic game = listRoom.firstWhere(
          (game) => game['room'] == selectedGame,
          orElse: () => null,
        );
        List<dynamic> friends = _userService.cachedFriends
            .map((friend) => friend['username'])
            .toList();
        if (game['mode'] == 'fa-users' && !friends.contains(game['creator'])) {
          showSnackBar(
              context,
              LobbiesScreenConsts.get(
                  "notFriendWithOrg", settingsService.language));
        } else if (game['mode'] == 'fa-trophy' &&
            _userService.cachedExperience < 400) {
          showSnackBar(context,
              LobbiesScreenConsts.get("notYetLv5", settingsService.language));
        } else if (game['mode'] == 'fa-trophy' &&
            game['numberOfPlayers'] >= 2) {
          showSnackBar(
              context,
              LobbiesScreenConsts.get(
                  "already2Players", settingsService.language));
        } else {
          bool? result;
          if (game['price'] == 0) {
            result = true;
          } else if (game['price'] > _userService.cachedWallet) {
            showDialog<bool>(
              context: context,
              builder: (BuildContext context) {
                return MyDialog(
                  text: LobbiesScreenConsts.get(
                      "notEnoughMoney", settingsService.language),
                  positiveButtonAction: () {
                    // L'utilisateur annule
                    Navigator.of(context).pop();
                  },
                  positiveButtonText: 'OK!',
                );
              },
            );
          } else {
            result = await showDialog<bool>(
              context: context,
              builder: (BuildContext context) {
                return MyDialog(
                  title: 'Confirmation',
                  text: settingsService.language == "eng"
                      ? "The entrance fee is ${game['price']}MT. Are you sure you want to enter the room?"
                      : "Le prix d'entrée est de ${game['price']}MT. Souhaitez-vous vraiment joindre cette salle de jeu?",
                  negativeButtonAction: () {
                    // L'utilisateur annule
                    Navigator.of(context).pop(false);
                  },
                  negativeButtonText: LobbiesScreenConsts.get(
                      "cancel", settingsService.language),
                  positiveButtonAction: () {
                    // L'utilisateur confirme
                    Navigator.of(context).pop(true);
                  },
                  positiveButtonText: LobbiesScreenConsts.get(
                      "confirm", settingsService.language),
                );
              },
            );
          }
          if (result == true) {
            _socketService.sendMessage('joinGameByName', {
              'code': selectedGame,
              'name': name,
            });

            _socketService.listenToEvent('receiveId', (game) {
              setState(() {
                currentGame = game;
              });
            });
            _socketService.listenToEvent('nameAdd', (response) {
              if (response) {
                Map<String, dynamic> game = listRoom.firstWhere(
                    (map) => map['room'] == selectedGame,
                    orElse: () {});
                _roomService.mode = game['mode'];
                _roomService.price = game['price'];
                int newWallet =
                    (_userService.cachedWallet - game['price']).round();
                FirebaseFirestore.instance
                    .collection("users")
                    .doc(FirebaseAuth.instance.currentUser!.uid)
                    .update({
                  'wallet': newWallet,
                });
                ChannelService.isDialogOpen = false;
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => WaitingRoom(
                      name: settingsService.username,
                      game: currentGame,
                      isHost: false,
                      room: channelService.standardize(selectedGame!),
                    ),
                  ),
                );
              } else {
                showDialog(
                  context: context,
                  builder: (context) {
                    return MyDialog(
                      text: LobbiesScreenConsts.get(
                          "bannedByOrg", settingsService.language),
                      positiveButtonAction: () {
                        Navigator.of(context).pop();
                        setState(() {
                          selectedGame = null;
                        });
                      },
                      positiveButtonText: "OK!",
                    );
                  },
                );
              }
            });
          }
        }
      }
    });

    _socketService.listenToEvent('seeAsObserver', (_) async {
      bool? result = await showDialog<bool>(
        context: context,
        builder: (BuildContext context) {
          return MyDialog(
            text: LobbiesScreenConsts.get(
                "joinAsObserver", settingsService.language),
            negativeButtonAction: () {
              // L'utilisateur annule
              Navigator.of(context).pop(false);
            },
            negativeButtonText:
                LobbiesScreenConsts.get("no", settingsService.language),
            positiveButtonAction: () {
              // L'utilisateur confirme
              Navigator.of(context).pop(true);
            },
            positiveButtonText:
                LobbiesScreenConsts.get("yes", settingsService.language),
          );
        },
      );
      if (result == true) {
        _socketService.sendMessage('joinAsObserver', {
          'code': selectedGame,
          'name': name,
        });

        _socketService.listenToEvent('goObserved', (game) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => ObserverScreen(
                questions: game['questions'],
                room: channelService.standardize(selectedGame!),
              ),
            ),
          );
        });
      }
    });
  }

  void _selectGame(String room) {
    setState(() {
      previousSelection = selectedGame;
      selectedGame = room;
      if (previousSelection == selectedGame) {
        _socketService.sendMessage('verifyRoom', selectedGame);
      }
    });
  }

  void _joinGame() async {
    bool? result = await showDialog(
      context: context,
      builder: (context) => JoinCodeDialog(codeController: _codeController),
    );

    if (result == true && _codeController.text.isNotEmpty) {
      setState(() {
        selectedGame = _codeController.text;
      });
      _socketService.sendMessage('verifyRoom', selectedGame);
    }
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context);
    double width = MediaQuery.of(context).size.width;

    return GestureDetector(
      onTap: () {
        setState(() {
          selectedGame = null;
        });
      },
      child: Scaffold(
        body: Stack(
          children: [
            Positioned.fill(
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
            Positioned(
              top: 0,
              width: width,
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(vertical: 30, horizontal: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    ChatButton(
                      name: settingsService.username,
                      isInGame: false,
                    ),
                    HomeButton(
                      name: settingsService.username,
                    ),
                  ],
                ),
              ),
            ),
            Positioned.fill(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const SizedBox(
                    height: 30,
                  ),
                  Container(
                    width: width * 0.9,
                    padding: const EdgeInsets.only(
                      top: 20,
                      bottom: 5,
                      left: 10,
                      right: 10,
                    ),
                    decoration: const BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: Colors.white,
                          width: 2.0,
                        ),
                      ),
                      borderRadius: BorderRadius.vertical(
                        bottom: Radius.elliptical(100, 10),
                      ),
                    ),
                    child: Center(
                      child: Stack(
                        children: [
                          Text(
                            LobbiesScreenConsts.get(
                                "gamesList", settingsService.language),
                            style: TextStyle(
                              fontFamily: "Text",
                              fontSize: 40,
                              fontWeight: FontWeight.bold,
                              foreground: Paint()
                                ..style = PaintingStyle.stroke
                                ..strokeWidth = 1
                                ..color = Colors.black,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          Text(
                            LobbiesScreenConsts.get(
                                "gamesList", settingsService.language),
                            style: const TextStyle(
                              fontFamily: "Text",
                              fontSize: 40,
                              color: Colors.white,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: 16,
                        horizontal: 50,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(bottom: 15),
                            child: SizedBox(
                              width: width * 0.89,
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  _buildHeader(LobbiesScreenConsts.get(
                                      "room", settingsService.language)),
                                  _buildHeader(LobbiesScreenConsts.get(
                                      "creator", settingsService.language)),
                                  _buildHeader(LobbiesScreenConsts.get(
                                      "gamesName", settingsService.language)),
                                  _buildHeader('Mode'),
                                  _buildHeader(LobbiesScreenConsts.get(
                                      "players", settingsService.language)),
                                  _buildHeader(LobbiesScreenConsts.get(
                                      "observers", settingsService.language)),
                                  _buildHeader(LobbiesScreenConsts.get(
                                      "entranceFee", settingsService.language)),
                                  _buildHeader(LobbiesScreenConsts.get(
                                      "state", settingsService.language)),
                                ],
                              ),
                            ),
                          ),
                          Expanded(
                            child: Container(
                              decoration: const BoxDecoration(
                                border: Border(
                                  top: BorderSide(
                                    color: Colors.white,
                                    width: 2.0,
                                  ),
                                  bottom: BorderSide(
                                    color: Colors.white,
                                    width: 2.0,
                                  ),
                                ),
                                borderRadius: BorderRadius.vertical(
                                  top: Radius.elliptical(10, 10),
                                  bottom: Radius.elliptical(10, 10),
                                ),
                              ),
                              child: listRoom.isEmpty
                                  ? Center(
                                      child: Column(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            LobbiesScreenConsts.get("noGames",
                                                settingsService.language),
                                            style: const TextStyle(
                                                fontFamily: "Text",
                                                fontSize: 20,
                                                color: Colors.white,
                                                shadows: [
                                                  Shadow(
                                                    color: Colors.black54,
                                                    blurRadius: 15,
                                                  )
                                                ]),
                                          ),
                                          const SizedBox(
                                            height: 20,
                                          ),
                                          const CircularProgressIndicator(
                                            color: Colors.white,
                                          ),
                                        ],
                                      ),
                                    )
                                  : ListView.builder(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 20, vertical: 10),
                                      itemCount: listRoom.length,
                                      itemBuilder: (context, index) {
                                        var optionRoom = listRoom[index];
                                        return Padding(
                                          padding: const EdgeInsets.only(
                                              bottom: 8.0),
                                          child: _buildGameRow(
                                            room: optionRoom['room'],
                                            creator: optionRoom['creator'],
                                            gameName: optionRoom['name'],
                                            mode: optionRoom['mode'],
                                            players:
                                                optionRoom['numberOfPlayers'],
                                            spectators: optionRoom['observers'],
                                            price: optionRoom?['price'] ?? 0,
                                            status: optionRoom['state'],
                                            onTap: () =>
                                                _selectGame(optionRoom['room']),
                                          ),
                                        );
                                      },
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildLegend(),
                        Column(
                          children: [
                            MyButton(
                              text: LobbiesScreenConsts.get(
                                  "useCode", settingsService.language),
                              fontSize: 20,
                              disabled: listRoom.isEmpty,
                              onTab: _joinGame,
                            ),
                            MyButton(
                              text: LobbiesScreenConsts.get(
                                  "joinGame", settingsService.language),
                              fontSize: 20,
                              disabled:
                                  selectedGame == null || listRoom.isEmpty,
                              onTab: selectedGame == null || listRoom.isEmpty
                                  ? () {}
                                  : () {
                                      _socketService.sendMessage(
                                          'verifyRoom', selectedGame);
                                    },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(String title) {
    return Expanded(
      child: Center(
        child: Stack(
          children: [
            Text(
              title,
              style: TextStyle(
                fontFamily: "Text",
                fontSize: 20,
                foreground: Paint()
                  ..style = PaintingStyle.stroke
                  ..strokeWidth = 1.5
                  ..color = Colors.black,
              ),
              textAlign: TextAlign.center,
            ),
            Text(
              title,
              style: const TextStyle(
                fontFamily: "Text",
                fontSize: 20,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGameRow({
    required String room,
    required String creator,
    required String gameName,
    required String mode,
    required int players,
    required int spectators,
    required num price,
    required bool status,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedScale(
        scale: selectedGame == room
            ? 1.02
            : 1.0, // Apply scaling based on the condition
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selectedGame == room ? Colors.white : Colors.white70,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selectedGame == room ? Colors.black87 : Colors.black26,
              width: selectedGame == room ? 2 : 1,
            ),
            boxShadow: [
              if (selectedGame == room)
                const BoxShadow(
                  color: Colors.black54,
                  blurRadius: 8,
                  spreadRadius: 2,
                ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildCell(room, Colors.red),
              _buildCell(creator),
              _buildCell(gameName),
              _buildCellMode(mode),
              _buildCell(players.toString()),
              _buildCell(spectators.toString()),
              _buildCell(price.toString(), Colors.red),
              _buildCellStatus(status),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCell(String content, [Color? color]) {
    return Expanded(
      child: Text(
        content,
        style: TextStyle(
          fontFamily: "Text",
          fontSize: 16,
          color: color ?? Colors.black,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _buildCellMode(String mode) {
    IconData icon;
    if (mode == 'fa-trophy') {
      icon = FontAwesomeIcons.trophy;
    } else if (mode == 'fa-gamepad') {
      icon = FontAwesomeIcons.gamepad;
    } else {
      icon = FontAwesomeIcons.users;
    }
    return Expanded(
      child: Icon(
        icon,
        size: 20,
        color: Colors.black,
      ),
    );
  }

  Widget _buildCellStatus(bool status) {
    IconData icon;
    if (status) {
      icon = FontAwesomeIcons.lock;
    } else {
      icon = FontAwesomeIcons.lockOpen;
    }
    return Expanded(
      child: Icon(
        icon,
        size: 20,
        color: Colors.black,
      ),
    );
  }

  Widget _buildLegend() {
    double witdh = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;
    return Padding(
      padding: const EdgeInsets.only(left: 10, bottom: 20),
      child: Container(
        width: witdh * 0.55,
        height: height * 0.2,
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.black54,
          border: Border(
            top: BorderSide(
              color: Colors.white,
              width: 2.0,
            ),
            bottom: BorderSide(
              color: Colors.white,
              width: 2.0,
            ),
          ),
          borderRadius: BorderRadius.vertical(
            top: Radius.elliptical(10, 10),
            bottom: Radius.elliptical(10, 10),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Stack(
              children: [
                Text(
                  LobbiesScreenConsts.get("legend", settingsService.language),
                  style: TextStyle(
                    fontFamily: "Text",
                    fontSize: 25,
                    foreground: Paint()
                      ..style = PaintingStyle.stroke
                      ..strokeWidth = 1.5
                      ..color = Colors.black,
                  ),
                  textAlign: TextAlign.center,
                ),
                Text(
                  LobbiesScreenConsts.get("legend", settingsService.language),
                  style: const TextStyle(
                    fontFamily: "Text",
                    fontSize: 25,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            const SizedBox(
              width: 10,
            ),
            Column(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLegendItem(
                    FontAwesomeIcons.trophy,
                    LobbiesScreenConsts.get(
                        "rankedMode", settingsService.language)),
                _buildLegendItem(
                    FontAwesomeIcons.gamepad,
                    LobbiesScreenConsts.get(
                        "classicMode", settingsService.language)),
                _buildLegendItem(
                    FontAwesomeIcons.users,
                    LobbiesScreenConsts.get(
                        "friendsMode", settingsService.language)),
              ],
            ),
            const SizedBox(
              width: 10,
            ),
            Column(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLegendItem(
                    FontAwesomeIcons.lockOpen,
                    LobbiesScreenConsts.get(
                        "onHold", settingsService.language)),
                _buildLegendItem(
                    FontAwesomeIcons.lock,
                    LobbiesScreenConsts.get(
                        "ongoing", settingsService.language)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(IconData icon, String label) {
    return Row(
      children: [
        SizedBox(
          width: 45,
          child: Icon(
            icon,
            color: Colors.white,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontFamily: "Text",
            fontSize: 20,
          ),
        ),
      ],
    );
  }
}
