import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:mobile/Screen/chat_screen.dart';
import 'package:mobile/Screen/game_screen.dart';
import 'package:mobile/Screen/home_screen.dart';
import 'package:mobile/Screen/organizer_screen.dart';
import 'package:mobile/Screen/theme_consts.dart';
import 'package:mobile/Screen/waiting_room_screen_consts.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/room_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Sockets/socket_service.dart';
import 'package:mobile/Widget/button.dart';
import 'package:mobile/Widget/chat_button.dart';
import 'package:mobile/Widget/dialog.dart';
import 'package:mobile/Widget/quit_button.dart';
import 'package:mobile/Widget/snack_bar.dart';
import 'package:provider/provider.dart';

class WaitingRoom extends StatefulWidget {
  final String name;
  final dynamic game;
  final bool isHost;
  final String room;

  const WaitingRoom({
    super.key,
    required this.name,
    required this.game,
    required this.isHost,
    required this.room,
  });

  @override
  State<WaitingRoom> createState() => _WaitingRoomState();
}

class _WaitingRoomState extends State<WaitingRoom> {
  final SocketService _socketService = SocketService();
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  String name = FirebaseAuth.instance.currentUser!.displayName.toString();
  List<dynamic> players = [];
  List<dynamic> banned = [];
  bool isLocked = false;
  int time = 5;
  bool showCountDialog = false;

  final StreamController<int> _timeController = StreamController<int>();

  @override
  void initState() {
    super.initState();
    // Join chat room
    if (!widget.isHost) {
      channelService.joinGameChannel(widget.room);
    }
    _socketService.sendMessage(
        'uploadNames', channelService.unstandardize(widget.room));
    _socketService.listenToEvent('getUsers', (playersList) {
      setState(() {
        players = playersList;
      });
      if (players.length < 2 && isLocked) {
        _socketService.sendMessage('emitToggleLock', null);
      }
    });
    _socketService.listenToEvent('getBanned', (listBan) {
      setState(() {
        banned = listBan;
      });
    });
    _socketService.listenToEvent('lockToggled', (response) {
      setState(() {
        isLocked = response;
      });
    });
    _socketService.listenToEvent('gotBanned', (_) {
      _showBanDialog();
    });
    _socketService.listenToEvent('viewToHome', (hasOrgQuit) {
      if (hasOrgQuit && !widget.isHost) {
        showSnackBar(
            context,
            WaitingRoomScreenConsts.get(
                "organizerQuit", settingsService.language));
        ChannelService.selectedChannel = "KAM? PAF!";
        ChannelService.isDialogOpen = false;
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => HomeScreen(name: name),
          ),
        );
      }
    });
    _socketService.listenToEvent('timer', (data) {
      setState(() {
        time = data['time'];
        _timeController.sink.add(time);
      });
      if (time == 0) {
        if (widget.isHost) {
          _socketService.sendMessage(
              'beginGame', channelService.unstandardize(widget.room));
          _socketService.sendMessage('stopTimer', null);
        }
      } else if (!showCountDialog) {
        _showCountDialog();
      }
    });

    _socketService.listenToEvent('goToViews', (response) {
      _socketService.removeAllListeners();
      if (response) {
        ChannelService.isDialogOpen = false;
        resetChatScreenKey();
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => OrganizerScreen(
              title: widget.game['title'],
              questions: widget.game['questions'],
              duration: widget.game['duration'],
              room: widget.room,
            ),
          ),
        );
      } else {
        ChannelService.isDialogOpen = false;
        resetChatScreenKey();
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => GameScreen(
              questions: widget.game['questions'],
              room: widget.room,
            ),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _timeController.close();
    super.dispose();
  }

  void _showBanDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return MyDialog(
          text: WaitingRoomScreenConsts.get(
              "bannedByOrg", settingsService.language),
          positiveButtonAction: () {
            Navigator.of(context).pop();
          },
          positiveButtonText: 'OK!',
        );
      },
    ).then(
      (value) {
        ChannelService.isDialogOpen = false;
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => HomeScreen(name: name),
          ),
        );
      },
    );
  }

  void _showQuitDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return MyDialog(
            text: WaitingRoomScreenConsts.get(
                "confirmQuit", settingsService.language),
            negativeButtonAction: () {
              Navigator.of(context).pop();
            },
            negativeButtonText:
                WaitingRoomScreenConsts.get("cancel", settingsService.language),
            positiveButtonAction: () {
              FirebaseFirestore.instance
                  .collection("users")
                  .doc(FirebaseAuth.instance.currentUser!.uid)
                  .update({
                'wallet': FieldValue.increment(RoomService().price),
              });
              _socketService.sendMessage('quitGame', null);
              channelService.quitGameChannel(
                  context, widget.room, widget.isHost, true, false);
              ChannelService.isDialogOpen = false;
              resetChatScreenKey();
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(
                  builder: (context) => HomeScreen(name: name),
                ),
              );
            },
            positiveButtonText:
                WaitingRoomScreenConsts.get("quit", settingsService.language));
      },
    );
  }

  // Fonction pour afficher le compteur en tant que Dialog
  void _showCountDialog() {
    showCountDialog = true;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return StreamBuilder<int>(
          stream: _timeController
              .stream, // Écouter le stream pour les changements de `time`
          initialData: time, // Valeur initiale de `time`
          builder: (context, snapshot) {
            return Dialog(
              backgroundColor: Colors.transparent,
              child: Container(
                width: 200,
                height: 200,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                ),
                child: Center(
                  child: Text(
                    '${snapshot.data}s', // Utiliser la valeur `time` mise à jour
                    style: const TextStyle(
                      fontFamily: "Text",
                      fontSize: 80,
                      color: Colors.black,
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    ).then((_) {
      showCountDialog = false; // Remettre à false quand le dialog est fermé
    });
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context);
    double width = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;

    return Scaffold(
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
          if (isLocked)
            Container(
              height: height,
              width: width,
              decoration: const BoxDecoration(
                color: Colors.black38,
              ),
            ),
          Positioned(
            top: 0,
            width: width,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  ChatButton(
                    name: settingsService.username,
                    isInGame: true,
                    channel: widget.room,
                  ),
                  QuitButton(
                    name: settingsService.username,
                    onPressed: _showQuitDialog,
                  ),
                ],
              ),
            ),
          ),
          Positioned.fill(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  children: [
                    const SizedBox(height: 65),
                    Text(
                      WaitingRoomScreenConsts.get(
                          "invitePlayers", settingsService.language),
                      style: const TextStyle(
                        fontFamily: "Text",
                        fontSize: 40,
                        color: Colors.black,
                        shadows: [
                          Shadow(
                            color: Colors.white,
                            blurRadius: 20,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(
                      height: 10,
                    ),
                    Text(
                      "${WaitingRoomScreenConsts.get("game", settingsService.language)}${widget.game['title']}",
                      style: const TextStyle(
                        fontFamily: "Text",
                        fontSize: 30,
                        color: Colors.black,
                        shadows: [
                          Shadow(
                            color: Colors.white,
                            blurRadius: 20,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      "${WaitingRoomScreenConsts.get("roomsCode", settingsService.language)}${channelService.unstandardize(widget.room)}",
                      style: const TextStyle(
                        fontFamily: "Text",
                        fontSize: 25,
                        color: Colors.black,
                        shadows: [
                          Shadow(
                            color: Colors.white,
                            blurRadius: 20,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          "${WaitingRoomScreenConsts.get("entranceFee", settingsService.language)}${RoomService().price}",
                          style: const TextStyle(
                            fontFamily: "Text",
                            fontSize: 20,
                            color: Colors.black,
                            shadows: [
                              Shadow(
                                color: Colors.white,
                                blurRadius: 20,
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.only(bottom: 3, left: 5),
                          child: Image.asset(
                            "assets/michtoken.png",
                            height: 20,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(
                      height: 20,
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 40),
                      height: height * (isLocked ? 0.2 : 0.27),
                      decoration: const BoxDecoration(
                        boxShadow: [
                          BoxShadow(
                            color: Colors.white38,
                            blurRadius: 50,
                          ),
                        ],
                      ),
                      child: SingleChildScrollView(
                        child: Wrap(
                          spacing: 8.0, // Espacement entre les éléments
                          runSpacing: 8.0, // Espacement entre les lignes
                          alignment: WrapAlignment.center,
                          children: players.map((player) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 15, vertical: 8),
                              constraints: const BoxConstraints(
                                // minHeight: 50,
                                maxHeight:
                                    50, // Hauteur minimale fixe pour tous les blocs
                              ),
                              decoration: BoxDecoration(
                                color: player == 'Organisateur'
                                    ? Colors.black
                                    : ThemeConsts.get("shopHeaderBackground",
                                        settingsService.currentTheme),
                                border: Border.all(
                                  width: 2,
                                  color: player == 'Organisateur'
                                      ? const Color.fromARGB(255, 56, 56, 56)
                                      : ThemeConsts.get("shopHeaderBorder",
                                          settingsService.currentTheme),
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (player != 'Organisateur')
                                    FutureBuilder(
                                      future: settingsService.getAvatar(player),
                                      builder: (context, snapshot) {
                                        if (!snapshot.hasError &&
                                            snapshot.data != null) {
                                          return Padding(
                                            padding:
                                                const EdgeInsets.only(right: 8),
                                            child: Container(
                                              height: 20,
                                              width: 20,
                                              decoration: BoxDecoration(
                                                shape: BoxShape.circle,
                                                border: Border.all(
                                                  color: Colors.black,
                                                  width: 0.5,
                                                ),
                                                image: DecorationImage(
                                                    image: snapshot.data !=
                                                                "" &&
                                                            snapshot.data !=
                                                                null
                                                        ? NetworkImage(
                                                            snapshot.data!)
                                                        : const AssetImage(
                                                            "assets/noImage.jpg"),
                                                    fit: BoxFit.cover),
                                              ),
                                            ),
                                          );
                                        }
                                        return const SizedBox.shrink();
                                      },
                                    ),
                                  Text(
                                    player == 'Organisateur'
                                        ? WaitingRoomScreenConsts.get(
                                            "organizer",
                                            settingsService.language)
                                        : player,
                                    style: TextStyle(
                                      fontFamily: "Text",
                                      fontSize: 18,
                                      color: player == 'Organisateur'
                                          ? const Color.fromARGB(
                                              205, 255, 255, 255)
                                          : Colors.black,
                                    ),
                                  ),
                                  // Espacement entre le nom et l'icône de blocage
                                  if (widget.isHost &&
                                      player != 'Organisateur') ...[
                                    const SizedBox(width: 5),
                                    // Icône de blocage
                                    GestureDetector(
                                      // padding: const EdgeInsets.all(0),
                                      child: const Icon(
                                        Icons.block,
                                        color: Colors.red,
                                        size: 20,
                                      ),
                                      onTap: () {
                                        // Logique pour bloquer le joueur
                                        _socketService.sendMessage(
                                            'playerBan', player);
                                      },
                                    ),
                                  ],
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 15),
                Column(
                  children: [
                    if (isLocked)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 15),
                        child: Text(
                          WaitingRoomScreenConsts.get(
                              "roomIsLocked", settingsService.language),
                          style: const TextStyle(
                            fontFamily: "Text",
                            fontSize: 25,
                            color: Colors.black,
                            shadows: [
                              Shadow(
                                color: Colors.white,
                                blurRadius: 15,
                              ),
                            ],
                          ),
                        ),
                      ),
                    Text(
                      '${players.length - 1} participant${players.length > 2 ? "s" : ""}',
                      style: const TextStyle(
                        fontFamily: "Text",
                        fontSize: 20,
                        color: Colors.black,
                        shadows: [
                          Shadow(
                            color: Colors.white,
                            blurRadius: 15,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 5),

                    // Banned Names
                    Text(
                      WaitingRoomScreenConsts.get(
                          "bannedNames", settingsService.language),
                      style: const TextStyle(
                        fontFamily: "Text",
                        fontSize: 16,
                        color: Color.fromARGB(255, 139, 38, 31),
                        shadows: [
                          Shadow(
                            color: Colors.white,
                            blurRadius: 10,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 5),
                    // Liste des joueurs bannis
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 620),
                      height: height * 0.062,
                      child: SingleChildScrollView(
                        child: Wrap(
                          spacing: 8.0, // Espacement entre les éléments
                          runSpacing: 8.0, // Espacement entre les lignes
                          alignment: WrapAlignment.center,
                          children: banned.map((player) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              constraints: const BoxConstraints(
                                // minHeight: 40,
                                maxHeight:
                                    50, // Hauteur minimale fixe pour tous les blocs
                              ),
                              decoration: BoxDecoration(
                                color: const Color.fromARGB(255, 151, 41, 33),
                                border: Border.all(
                                  width: 2,
                                  color: const Color.fromARGB(205, 79, 0, 0),
                                ),
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Colors.white,
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize
                                    .min, // Pour ajuster la taille du Row
                                children: [
                                  // Nom du joueur banni
                                  Text(
                                    player,
                                    style: const TextStyle(
                                      fontFamily: "Text",
                                      fontSize: 16,
                                      color: Colors
                                          .white, // Texte blanc pour contraste
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                    if (widget.isHost)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          MyButton(
                            disabled: (players.length < 2),
                            onTab: () {
                              if (players.length >= 2) {
                                _socketService.sendMessage(
                                    'emitToggleLock', null);
                              }
                            },
                            shape: BoxShape.circle,
                            width: 100,
                            icon1: Icon(
                              isLocked
                                  ? FontAwesomeIcons.lock
                                  : FontAwesomeIcons.lockOpen,
                              color: players.length < 2
                                  ? Colors.black54
                                  : Colors.black,
                              size: 25,
                            ),
                          ),
                          MyButton(
                            text: WaitingRoomScreenConsts.get(
                                "begin", settingsService.language),
                            width: 225,
                            textColor:
                                !isLocked ? Colors.black54 : Colors.black,
                            disabled: !isLocked,
                            onTab: !isLocked
                                ? () {}
                                : () {
                                    _socketService.sendMessage('startTimer', {
                                      'startValue': time,
                                      'roomName': channelService
                                          .unstandardize(widget.room)
                                    });
                                  },
                          ),
                        ],
                      ),
                    const SizedBox(height: 30),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
