import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/home_screen.dart';
import 'package:mobile/Screen/result_screen_consts.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/room_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Sockets/socket_service.dart';
import 'package:mobile/Widget/button.dart';
import 'package:mobile/Widget/chat_button.dart';
import 'package:mobile/Widget/classement_joueurs.dart';
import 'package:mobile/Widget/histogram.dart';
import 'package:provider/provider.dart';

class ResultScreen extends StatefulWidget {
  final dynamic questions;
  final bool isHost;
  final num timePlayed;
  final String room;
  final String? title;
  const ResultScreen({
    required this.questions,
    super.key,
    required this.isHost,
    required this.timePlayed,
    required this.room,
    this.title,
  });

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  String name = FirebaseAuth.instance.currentUser!.displayName.toString();
  final SocketService _socketService = SocketService();
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  List<dynamic> histogram = [];
  List<dynamic> joueurs = [];
  int questionIndex = 0;
  num timePlayed = 0;
  List<dynamic> choices = [];
  bool isDone = false;

  @override
  void initState() {
    super.initState();
    choices = widget.questions?[questionIndex]['choices'];
    timePlayed = widget.timePlayed;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ChannelService.setIsMute(false);
    });

    _socketService.listenToEvent('getGameFinished', (response) {
      print('socket game finished: $response');
    });

    _socketService.listenToEvent('getPlayers', (data) {
      if (data != null) {
        setState(() {
          joueurs = data;
        });
        if (widget.isHost && !isDone) {
          isDone = true;
          List<dynamic> listJoueurs = joueurs;
          print('Joueurs liste dans gamefinish: $listJoueurs');

          listJoueurs.sort((a, b) {
            return (b['score'] as int).compareTo(a['score'] as int);
          });

          int scoreMax = listJoueurs.first['score'];

          List<dynamic> joueursAvecScoreMax = listJoueurs
              .where((joueur) =>
                  joueur['score'] == scoreMax &&
                  joueur['name'] != 'Organisateur')
              .toList();

          List<dynamic> joueursAvecScoreInferieur = listJoueurs
              .where((joueur) =>
                  joueur['score'] != scoreMax &&
                  joueur['name'] != 'Organisateur')
              .toList();

          listJoueurs.forEach((joueur) {
            if (joueur['name'] != 'Organisateur') {
              bool hasWon = joueur['score'] == scoreMax;
              updatePlayerStatistics(
                  joueur['name'],
                  hasWon,
                  joueur['nbGoodAnswersPlayer'] ?? 0,
                  widget.questions.length,
                  joueur['isSurrender'],
                  joueursAvecScoreMax.length,
                  joueursAvecScoreInferieur.length);
            }
          });
        }
      }
    });

    _socketService.listenToEvent('sendHistogram', (data) {
      histogram = data;
    });
  }

  void updatePlayerStatistics(
    String username,
    bool hasWon,
    int nbGoodAnswersPlayer,
    int totalQuestions,
    bool isSurrender,
    int nbWinners,
    int nbLosers,
  ) {
    FirebaseFirestore.instance
        .collection('users')
        .where('username', isEqualTo: username)
        .get()
        .then((query) {
      if (query.docs.isNotEmpty) {
        var doc = query.docs.first;
        var data = doc.data();

        int gamesPlayed = data['statistics']['gamesP'] ?? 0;
        num currentAverage = data['statistics']['averageGoodAnsPerGame'] ?? 0.0;

        num ratioGoodAnswers = nbGoodAnswersPlayer / totalQuestions;
        num newAverage = (currentAverage * gamesPlayed + ratioGoodAnswers) /
            (gamesPlayed + 1);

        num newTime = data['statistics']['averageTimePerGame'] ?? 0;
        num averageTime =
            (newTime * gamesPlayed + timePlayed) / (gamesPlayed + 1);

        Map<String, dynamic> game = {
          'date': Timestamp.now(),
          'gameName': widget.title,
          'isWinner': hasWon,
        };

        final price = RoomService().price;
        int newWallet = 0;
        if (price == 0) {
          if (isSurrender) {
            return;
          } else if (hasWon) {
            newWallet = 30;
          } else {
            newWallet = 10;
          }
        } else {
          int totalCash = price * (joueurs.length - 1);
          if (isSurrender)
            return;
          else if (hasWon) {
            newWallet = ((totalCash * (2 / 3)) / nbWinners).round();
          } else {
            newWallet = ((totalCash * (1 / 3)) / nbLosers).round();
          }
        }

        bool isDraw = false;
        int newRankingPoint = data['rankingPoints'];
        if (RoomService().mode == 'fa-trophy') {
          if (nbWinners == 1) {
            newRankingPoint =
                hasWon ? newRankingPoint + 10 : newRankingPoint - 10;
          } else {
            isDraw = true;
          }
        }

        // Mise à jour des statistiques
        doc.reference.update({
          if (hasWon && RoomService().mode != 'fa-trophy')
            'statistics.gamesW': FieldValue.increment(1),
          if (!hasWon && RoomService().mode != 'fa-trophy')
            'statistics.gamesL': FieldValue.increment(1),
          if (RoomService().mode == 'fa-trophy' && hasWon && isDraw)
            'rankingD': FieldValue.increment(1),
          if (RoomService().mode == 'fa-trophy' && hasWon && !isDraw)
            'rankingW': FieldValue.increment(1),
          if (RoomService().mode == 'fa-trophy' && !hasWon)
            'rankingL': FieldValue.increment(1),
          if (RoomService().mode == 'fa-trophy')
            'rankingPoints': newRankingPoint,
          'statistics.gamesP': FieldValue.increment(1),
          'statistics.averageGoodAnsPerGame': newAverage,
          'statistics.averageTimePerGame': averageTime,
          'gamesHistoric': FieldValue.arrayUnion([game]),
          'experience': FieldValue.increment(hasWon ? 40 : 20),
          'wallet': FieldValue.increment(newWallet),
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context);
    double width = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;
    bool isPortrait =
        MediaQuery.of(context).orientation == Orientation.portrait;

    List<Widget> children = [
      // Contenu principal à gauche
      Expanded(
        // Décomposer
        flex: isPortrait ? 4 : 6,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 10,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Question en haut
              Padding(
                padding: EdgeInsets.only(
                  left: 90,
                  bottom: 10,
                  top: isPortrait ? 50 : 40,
                  right: isPortrait ? 90 : 0,
                ),
                child: Text(
                  "${questionIndex + 1}. ${widget.questions[questionIndex]['text']} (${widget.questions[questionIndex]['points']} points)",
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: "Text",
                    fontSize: 18,
                    color: Colors.black,
                    shadows: [
                      Shadow(
                        color: Colors.white,
                        blurRadius: 20,
                      ),
                    ],
                  ),
                ),
              ),
              // Graphique
              if (histogram.isNotEmpty)
                Container(
                  margin:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  height: height * (isPortrait ? 0.15 : 0.30),
                  width: double.infinity,
                  child: Center(
                      child: Histogram(
                    question: widget.questions[questionIndex],
                    realData: histogram[questionIndex]['realData'],
                    disable: true,
                  )),
                ),
              // Les réponses
              if (widget.questions[questionIndex]['type'] == 'QCM')
                Container(
                  height: height * (isPortrait ? 0.15 : 0.22),
                  padding: const EdgeInsets.only(bottom: 10),
                  decoration: const BoxDecoration(
                    border: Border(
                      bottom: BorderSide(
                        color: Colors.black,
                        width: 3,
                      ),
                    ),
                    borderRadius: BorderRadius.vertical(
                      bottom: Radius.circular(20),
                    ),
                  ),
                  child: ScrollbarTheme(
                    data: ScrollbarThemeData(
                      thumbColor: WidgetStateProperty.all(Colors.black),
                      thickness: WidgetStateProperty.all(8),
                      radius: const Radius.circular(10),
                    ),
                    child: Scrollbar(
                      thumbVisibility: true,
                      child: SingleChildScrollView(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Column(
                            children: choices.asMap().entries.map((entry) {
                              int index = entry.key;
                              dynamic choice = entry.value;
                              return Container(
                                padding: const EdgeInsets.all(12),
                                margin: const EdgeInsets.only(bottom: 8),
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  color: choice['isCorrect']
                                      ? const Color.fromRGBO(
                                          12, 230, 164, 0.821)
                                      : const Color.fromRGBO(
                                          252, 76, 111, 0.771),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    width: 3,
                                    color: choice['isCorrect']
                                        ? const Color.fromRGBO(
                                            10, 184, 132, 0.82)
                                        : const Color.fromARGB(
                                            196, 186, 57, 83),
                                  ),
                                  boxShadow: const [
                                    BoxShadow(
                                      color: Colors.black45,
                                      blurRadius: 10,
                                    )
                                  ],
                                ),
                                child: Text(
                                  "${index + 1}. ${choice['text']}",
                                  style: const TextStyle(
                                    fontFamily: "Text",
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              // const Spacer(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  MyButton(
                    onTab: questionIndex > 0
                        ? () {
                            setState(() {
                              questionIndex--;
                              choices =
                                  widget.questions[questionIndex]['choices'];
                            });
                          }
                        : () {},
                    disabled: questionIndex == 0,
                    fontSize: 20,
                    text: ResultScreenConsts.get(
                        "previous", settingsService.language),
                  ),
                  MyButton(
                    onTab: questionIndex < widget.questions.length - 1
                        ? () {
                            setState(() {
                              questionIndex++;
                              choices =
                                  widget.questions[questionIndex]['choices'];
                            });
                          }
                        : () {},
                    disabled: questionIndex == widget.questions.length - 1,
                    fontSize: 20,
                    text: ResultScreenConsts.get(
                        "next", settingsService.language),
                  ),
                ],
              ),
              // const Spacer(),
            ],
          ),
        ),
      ),
      // Classement à droite
      Expanded(
        flex: 3,
        child: Container(
          // width: 480,
          decoration: const BoxDecoration(
            color: Color.fromARGB(44, 0, 0, 0),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              ClassementWidget(
                joueurs: joueurs,
                isResult: true,
                isObserver: false,
              ),
              Padding(
                padding: const EdgeInsets.all(10),
                child: MyButton(
                  onTab: () {
                    _socketService.disconnect();
                    ChannelService.isDialogOpen = false;
                    // resetChatScreenKey();
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (context) => HomeScreen(
                          name: name,
                        ),
                      ),
                    );
                    channelService.quitGameChannel(
                        context, widget.room, widget.isHost, false, true);
                  },
                  text: ResultScreenConsts.get(
                      "mainMenu", settingsService.language),
                  fontSize: 20,
                ),
              ),
            ],
          ),
        ),
      ),
    ];

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.network(
              settingsService.currentThemeUrl,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Image.asset(
                  "assets/noImage.jpg",
                  fit: BoxFit.cover,
                );
              },
            ),
          ),
          Positioned.fill(
            child: isPortrait
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: children,
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: children,
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
                    channel: widget.room,
                    isInGame: true,
                  ),
                  // QuitButton(
                  //   name: settingsService.username,
                  //   onPressed: () {
                  //     _socketService.disconnect();
                  //     ChannelService.isDialogOpen = false;
                  //     // resetChatScreenKey();
                  //     Navigator.of(context).pushReplacement(
                  //       MaterialPageRoute(
                  //         builder: (context) => HomeScreen(
                  //           name: name,
                  //         ),
                  //       ),
                  //     );
                  //     channelService.quitGameChannel(
                  //         context, widget.room, widget.isHost, false, true);
                  //   },
                  // ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
