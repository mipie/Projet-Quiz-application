import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/create_session_screen_consts.dart';
import 'package:mobile/Screen/waiting_room_screen.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/http_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Sockets/socket_service.dart';
import 'package:mobile/Widget/button.dart';
import 'package:mobile/Widget/chat_button.dart';
import 'package:mobile/Widget/game_mode.dart';
import 'package:mobile/Widget/home_button.dart';
import 'package:provider/provider.dart';

class SessionScreen extends StatefulWidget {
  final String name;
  static const route = "/session-screen";

  const SessionScreen({super.key, required this.name});

  @override
  State<SessionScreen> createState() => _SessionScreenState();
}

class _SessionScreenState extends State<SessionScreen> {
  final SocketService _socketService = SocketService();
  final HttpService _httpService = HttpService();
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  dynamic games = [];
  String name = FirebaseAuth.instance.currentUser!.displayName.toString();
  dynamic selectedGame;

  @override
  void initState() {
    super.initState();
    _fetchData();
    _socketService.reconnect();
    _socketService.listenToEvent('gameCreate', (data) {
      // Créer chat room
      String room = channelService.standardize(data);
      channelService.createGameChannel(room, settingsService.username);
      ChannelService.isDialogOpen = false;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => WaitingRoom(
            name: settingsService.username,
            game: selectedGame['game'],
            isHost: true,
            room: room,
          ),
        ),
      );
    });
    // channelService.setupFirebaseMessaging(context);
  }

  Future<void> _fetchData() async {
    try {
      var data = await _httpService.get('');
      setState(() {
        games = data;
      });
    } catch (e) {
      print('Error: $e');
    }
  }

  void _selectGame(dynamic game) {
    setState(() {
      selectedGame = game == selectedGame ? null : game;
    });
    // _socketService.sendMessage('createRoom', game['id']);
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context);
    double width = MediaQuery.of(context).size.width;
    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          // Background theme image
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
          Positioned.fill(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Padding(
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
                      Padding(
                        padding: const EdgeInsets.only(top: 10),
                        child: MyButton(
                          text: SessionScreenConsts.get(
                              "createGame", settingsService.language),
                          fontSize: 20,
                          disabled: selectedGame == null,
                          onTab: () {
                            if (selectedGame != null) {
                              bool containsQRL = selectedGame['game']
                                      ['questions']
                                  .any((question) => question['type'] == 'QRL');
                              showDialog(
                                context: context,
                                builder: (BuildContext context) {
                                  return GameModeDialog(
                                    gameID: selectedGame['id'],
                                    containsQRL: containsQRL,
                                  );
                                },
                              );
                            }
                          },
                        ),
                      ),
                      HomeButton(name: settingsService.username),
                    ],
                  ),
                ),
                const SizedBox(
                  height: 50,
                ),
                Expanded(
                  child: Container(
                    width: width * 0.7,
                    decoration: const BoxDecoration(
                      borderRadius:
                          BorderRadius.vertical(top: Radius.circular(20)),
                      boxShadow: [
                        BoxShadow(
                          blurStyle: BlurStyle.outer,
                          blurRadius: 40,
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: width * 0.65,
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
                                // Contour du texte
                                Text(
                                  SessionScreenConsts.get(
                                      "listGames", settingsService.language),
                                  style: TextStyle(
                                    fontFamily: "Text",
                                    fontSize: 30,
                                    fontWeight: FontWeight.bold,
                                    foreground: Paint()
                                      ..style = PaintingStyle.stroke
                                      ..strokeWidth = 1
                                      ..color = Colors.black,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                Text(
                                  SessionScreenConsts.get(
                                      "listGames", settingsService.language),
                                  style: const TextStyle(
                                    fontFamily: "Text",
                                    fontSize: 30,
                                    color: Colors.white,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        ),
                        Flexible(
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 10),
                            itemCount: games.length,
                            itemBuilder: (context, index) {
                              return GameItem(
                                game: games[index],
                                selectGame: _selectGame,
                                isSelected: games[index] == selectedGame,
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class GameItem extends StatelessWidget {
  final dynamic game;
  final Function(dynamic) selectGame;
  final bool isSelected;
  final SettingsService? settingsService;

  GameItem({
    required this.game,
    required this.selectGame,
    required this.isSelected,
    this.settingsService,
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    SettingsService settingsService = Provider.of<SettingsService>(context);

    return GestureDetector(
      onTap: () => selectGame(game),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
        padding: EdgeInsets.symmetric(
          vertical: isSelected ? 20 : 10,
          horizontal: 25,
        ),
        decoration: BoxDecoration(
          border: Border.all(width: isSelected ? 5 : 1),
          color: const Color.fromARGB(198, 255, 255, 255),
          borderRadius: BorderRadius.circular(15),
          boxShadow: isSelected
              ? []
              : const [
                  BoxShadow(
                    color: Colors.black87,
                    blurStyle: BlurStyle.outer,
                    blurRadius: 7,
                  ),
                ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              game['game']['title'],
              style: const TextStyle(
                fontSize: 20,
                fontFamily: "Text",
              ),
            ),
            if (isSelected) const Divider(color: Colors.black, thickness: 2),
            if (isSelected)
              Padding(
                padding: const EdgeInsets.only(top: 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          "${SessionScreenConsts.get("description", settingsService.language)}:",
                          style: const TextStyle(
                            fontFamily: "Text",
                            decoration: TextDecoration.underline,
                          ),
                        ),
                        Text(
                          ' ${game['game']['description']}',
                          style: const TextStyle(
                            color: Color.fromARGB(184, 0, 0, 0),
                            fontFamily: "Text",
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          "${SessionScreenConsts.get("questionsDuration", settingsService.language)}:",
                          style: const TextStyle(
                            fontFamily: "Text",
                            decoration: TextDecoration.underline,
                          ),
                        ),
                        Text(
                          ' ${game['game']['duration']} secondes',
                          style: const TextStyle(
                            color: Color.fromARGB(184, 0, 0, 0),
                            fontFamily: "Text",
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          '${SessionScreenConsts.get("questions", settingsService.language)}:',
                          style: const TextStyle(
                            fontFamily: "Text",
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children:
                          game['game']['questions'].map<Widget>((question) {
                        int index =
                            game['game']['questions'].indexOf(question) + 1;
                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              width: 60,
                              child: Align(
                                alignment: Alignment.centerRight,
                                child: Text(
                                  '$index | ',
                                  style: const TextStyle(
                                    color: Color.fromARGB(184, 0, 0, 0),
                                    fontFamily: "Text",
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              child: Text(
                                '${question['type']} : ${question['text']}',
                                style: const TextStyle(
                                  color: Color.fromARGB(184, 0, 0, 0),
                                  fontFamily: "Text",
                                ),
                              ),
                            ),
                          ],
                        );
                      }).toList(),
                    ),
                  ],
                ),
              )
          ],
        ),
      ),
    );
  }
}
