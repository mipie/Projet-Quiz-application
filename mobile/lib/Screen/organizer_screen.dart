import 'package:audioplayers/audioplayers.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:mobile/Screen/chat_screen.dart';
import 'package:mobile/Screen/home_screen.dart';
import 'package:mobile/Screen/organizer_consts.dart';
import 'package:mobile/Screen/result_screen.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Services/voice_service.dart';
import 'package:mobile/Sockets/socket_service.dart';
import 'package:mobile/Widget/button.dart';
import 'package:mobile/Widget/chat_button.dart';
import 'package:mobile/Widget/classement_joueurs.dart';
import 'package:mobile/Widget/dialog.dart';
import 'package:mobile/Widget/histogram.dart';
import 'package:mobile/Widget/quit_button.dart';
import 'package:mobile/Widget/snack_bar.dart';
import 'package:provider/provider.dart';

class OrganizerScreen extends StatefulWidget {
  final dynamic questions;
  final int duration;
  final String room;
  final String title;
  const OrganizerScreen(
      {required this.questions,
      required this.duration,
      required this.room,
      required this.title,
      super.key});

  @override
  State<OrganizerScreen> createState() => _OrganizerScreenState();
}

class _OrganizerScreenState extends State<OrganizerScreen> {
  String name = FirebaseAuth.instance.currentUser!.displayName.toString();
  final SocketService _socketService = SocketService();
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  VoiceService _voiceService = VoiceService();
  List<dynamic> joueurs = [];
  List<dynamic> choices = [];
  List<dynamic> playerAnswer = [];
  int questionIndex = 0;
  int time = 60;
  num startTimer = 0;
  bool disable = true;
  bool isAllFinish = false;
  bool isNext = false;
  bool responseQRL = false;
  bool isLast = false;
  bool isPaused = false;
  bool isPanicMode = false;
  bool isVocal = false;
  String title = '';
  String typeQuestion = '';
  List<dynamic> realData = [0, 0, 0, 0];
  List<dynamic> gradeCount = [0, 0, 0];
  final audioPlayer = AudioPlayer();

  @override
  void initState() {
    super.initState();
    title = widget.title;
    startTimer = Timestamp.now().seconds;
    typeQuestion = widget.questions[questionIndex]['type'];
    choices = widget.questions[questionIndex]['choices'];
    isLast = questionIndex == (widget.questions.length - 1);
    if (typeQuestion == 'QRL') {
      _socketService.sendMessage('startTimer', {
        'startValue': 60,
        'roomName': channelService.unstandardize(widget.room)
      });
    } else {
      _socketService.sendMessage('startTimer', {
        'startValue': widget.duration,
        'roomName': channelService.unstandardize(widget.room)
      });
    }
    _socketService.sendMessage(
        'uploadPlayers', channelService.unstandardize(widget.room));
    _socketService.sendMessage('startedGame', null);
    _socketService.sendMessage('didAllGiveUp', null);

    // TIME
    _socketService.listenToEvent('timer', (data) {
      if (data['time'] == 0 && isNext) {
        _socketService.sendMessage('nextQuestion', null);
        isNext = false;
        isAllFinish = false;
        questionIndex += 1;
        isLast = questionIndex == (widget.questions.length - 1);
        typeQuestion = widget.questions[questionIndex]['type'];
        choices = widget.questions[questionIndex]['choices'];
        speak();
        if (typeQuestion == 'QRL') {
          _socketService.sendMessage('startTimer', {
            'startValue': 60,
            'roomName': channelService.unstandardize(widget.room)
          });
        } else {
          _socketService.sendMessage('startTimer', {
            'startValue': widget.duration,
            'roomName': channelService.unstandardize(widget.room)
          });
        }
      } else if (data['time'] == 0 && !isAllFinish) {
        // if (isPanicMode) audioPlayer.stop();
        _voiceService.stop();

        setState(() {
          isAllFinish = true;
          disable = false;
          isNext = true;
        });
        if (typeQuestion == 'QRL') {
          setState(() {
            responseQRL = true;
          });
          disable = true;
        } else if (typeQuestion == 'QCM') {
          _socketService.sendMessage('showResult', null);
          _socketService.sendMessage('addHistogram', {
            'labelData':
                choices.asMap().keys.map((index) => index + 1).toList(),
            'realData': realData.sublist(0, choices.length),
            'colorData': choices
                .map((choice) => choice['isCorrect']
                    ? 'rgba(12, 230, 164, 0.821)'
                    : 'rgba(252, 76, 111, 0.771)')
                .toList(),
          });
        } else if (typeQuestion == 'QRE') {
          double margin =
              widget.questions[questionIndex]['qre']['margin'] / 100;
          int upper = widget.questions[questionIndex]['qre']['upperBound'];
          int lower = widget.questions[questionIndex]['qre']['lowerBound'];
          int interval = upper - lower;
          int goodAnswer = widget.questions[questionIndex]['qre']['goodAnswer'];

          double upperMargin = (goodAnswer + (margin * interval)) > upper
              ? upper.toDouble()
              : (goodAnswer + (margin * interval));

          double lowerMargin = (goodAnswer + (margin * interval * -1)) < lower
              ? lower.toDouble()
              : (goodAnswer + (margin * interval * -1));

          String acceptedValues = upperMargin != 0.0 || lowerMargin != 0.0
              ? "Valeurs acceptées: [${lowerMargin.round()}, ${upperMargin.round()}]"
              : 'Aucune marge acceptée';

          String badAnswer = upperMargin != 0 || lowerMargin != 0
              ? "Mauvaise Réponse: ]${lowerMargin.round()}, ${upperMargin.round()}["
              : 'Mauvaise Réponse';
          _socketService.sendMessage('showResult', null);
          _socketService.sendMessage('addHistogram', {
            'labelData': [
              acceptedValues,
              "Bonne Réponse: $goodAnswer",
              badAnswer
            ],
            'realData': realData,
            'colorData': [
              'rgba(255, 255, 255, 0.5)',
              'rgba(12, 230, 164, 0.821)',
              'rgba(252, 76, 111, 0.771)'
            ],
          });
          // realData = [0, 0, 0];
        }
      }
      setState(() {
        time = data['time'];
      });
    });

    _socketService.listenToEvent('getPlayers', (data) {
      setState(() {
        joueurs = data;
      });
    });

    _socketService.listenToEvent('allFinish', (_) {
      _voiceService.stop();
      setState(() {
        isAllFinish = true;
        if (typeQuestion != 'QRL') {
          disable = false;
        } else if (typeQuestion == 'QRL') {
          responseQRL = true;
        }
        isNext = true;
      });
      _socketService.sendMessage('stopTimer', null);
      if (typeQuestion == 'QCM') {
        _socketService.sendMessage('showResult', null);
        _socketService.sendMessage('addHistogram', {
          'labelData': choices.asMap().keys.map((index) => index + 1).toList(),
          'realData': realData.sublist(0, choices.length),
          'colorData': choices
              .map((choice) => choice['isCorrect']
                  ? 'rgba(12, 230, 164, 0.821)'
                  : 'rgba(252, 76, 111, 0.771)')
              .toList(),
        });
      } else if (typeQuestion == 'QRE') {
        double margin = widget.questions[questionIndex]['qre']['margin'] / 100;
        int upper = widget.questions[questionIndex]['qre']['upperBound'];
        int lower = widget.questions[questionIndex]['qre']['lowerBound'];
        int interval = upper - lower;
        int goodAnswer = widget.questions[questionIndex]['qre']['goodAnswer'];

        double upperMargin = (goodAnswer + (margin * interval)) > upper
            ? upper.toDouble()
            : (goodAnswer + (margin * interval));

        double lowerMargin = (goodAnswer + (margin * interval * -1)) < lower
            ? lower.toDouble()
            : (goodAnswer + (margin * interval * -1));

        String acceptedValues = upperMargin != 0.0 || lowerMargin != 0.0
            ? "Valeurs acceptées: [${lowerMargin.round()}, ${upperMargin.round()}]"
            : 'Aucune marge acceptée';

        String badAnswer = upperMargin != 0 || lowerMargin != 0
            ? "Mauvaise Réponse: ]${lowerMargin.round()}, ${upperMargin.round()}["
            : 'Mauvaise Réponse';
        _socketService.sendMessage('showResult', null);
        _socketService.sendMessage('addHistogram', {
          'labelData': [
            acceptedValues,
            "Bonne Réponse: $goodAnswer",
            badAnswer
          ],
          'realData': realData,
          'colorData': [
            'rgba(255, 255, 255, 0.5)',
            'rgba(12, 230, 164, 0.821)',
            'rgba(252, 76, 111, 0.771)'
          ],
        });
        // realData = [0, 0, 0];
      } else {
        _socketService.sendMessage('stopWaiting', null);
      }
    });

    _socketService.listenToEvent('newOpenEndedAnswer', (data) {
      if (typeQuestion == 'QRL') {
        playerAnswer.add(data);
        setState(() {
          playerAnswer.sort((a, b) =>
              (a['playerName'] as String).compareTo(b['playerName'] as String));
        });
      }
    });

    _socketService.listenToEvent('allGaveUp', (_) {
      //Lang
      showSnackBar(context, 'Tous les joueurs ont abandonné la partie.');
      _socketService.sendMessage('quitGame', null);
      channelService.quitGameChannel(context, widget.room, true, false, false);
    });

    _socketService.listenToEvent('viewToHome', (hasOrgQuit) {
      print("hasOrgQuit : $hasOrgQuit"); // N'entre jamais
      _socketService.disconnect();
      ChannelService.isDialogOpen = false;
      resetChatScreenKey();
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => HomeScreen(name: name),
        ),
      );
    });

    _socketService.listenToEvent('resultChoice', (result) {
      if (typeQuestion == 'QCM') {
        setState(() {
          realData = result;
        });
      }
    });

    _socketService.listenToEvent('resultInteractions', (result) {
      if (typeQuestion == 'QRL' && disable) {
        setState(() {
          realData = result;
        });
      }
    });

    _socketService.listenToEvent('resultatGrade', (result) {
      if (typeQuestion == 'QRL' && !disable) {
        setState(() {
          realData = result['realData'];
        });
      }
    });

    _socketService.listenToEvent('resultEstimateResponse', (result) {
      if (typeQuestion == 'QRE') {
        setState(() {
          realData = result;
        });
      }
    });
  }

  void speak() {
    if (isVocal) {
      _voiceService.speak(
          "${questionIndex + 1}. ${widget.questions[questionIndex]['text']} (${widget.questions[questionIndex]['points']} points)");

      if (typeQuestion == "QCM") {
        int index = 1;
        choices.forEach((choice) {
          _voiceService.speak("$index. ${choice["text"]}");
          index += 1;
        });
      }
    }
  }

  void _showQuitDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return MyDialog(
          text: OrganizerScreenConsts.get(
              "wantToAbandon", settingsService.language),
          negativeButtonAction: () => Navigator.of(context).pop(),
          negativeButtonText:
              OrganizerScreenConsts.get("cancel", settingsService.language),
          positiveButtonAction: () {
            _socketService.sendMessage('quitGame', null);
            channelService.quitGameChannel(
                context, widget.room, true, false, false);
          },
          positiveButtonText:
              OrganizerScreenConsts.get("confirm", settingsService.language),
        );
      },
    );
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context);
    double width = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;
    bool isPortrait =
        MediaQuery.of(context).orientation == Orientation.portrait;

    Widget leaderboard = ClassementWidget(
      joueurs: joueurs,
      isResult: false,
      isObserver: false,
    );

    Widget image = widget.questions[questionIndex]['imageUrl'].isNotEmpty
        ? Container(
            decoration: BoxDecoration(
                borderRadius: const BorderRadius.all(Radius.circular(20)),
                border: Border.all(
                  color: Colors.white70,
                  width: 5,
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.white12,
                    blurRadius: 10,
                  ),
                ]),
            padding: const EdgeInsets.all(15),
            margin: const EdgeInsets.all(15),
            child: Image.network(
              widget.questions[questionIndex]['imageUrl'][0],
              height: isPortrait ? 275 : 150,
              fit: BoxFit.cover,
              errorBuilder:
                  (BuildContext context, Object error, StackTrace? stackTrace) {
                return Image.asset(
                  height: isPortrait ? 275 : 150,
                  'assets/noImage.jpg', // Path to your default image
                  fit: BoxFit.cover,
                );
              },
            ))
        : SizedBox(
            height: isPortrait ? 375 : 0,
          );

    Widget timerGroup = Container(
      // color: Colors.black26,
      padding: const EdgeInsets.all(5),
      width: width * (isPortrait ? 0.5 : 0.375),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.max,
        children: [
          MyButton(
            icon1: Icon(
              isPaused ? FontAwesomeIcons.play : FontAwesomeIcons.pause,
              size: 35,
              color: Colors.black,
            ),
            width: isPortrait ? 80 : 110,
            backgroundColor: isPaused
                ? const Color.fromRGBO(114, 232, 247, 1)
                : Colors.white70,
            shape: BoxShape.circle,
            disabled: !(time != 0 && !isAllFinish),
            onTab: () {
              setState(() {
                isPaused = !isPaused;
              });
              _socketService.sendMessage('pauseTimer', null);
            },
          ),
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: Text(
              OrganizerScreenConsts.get("timeLeft", settingsService.language),
              style: const TextStyle(
                fontFamily: "Text",
                fontSize: 20,
                shadows: [
                  Shadow(
                    color: Colors.white,
                    blurRadius: 20,
                  ),
                ],
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color:
                      isNext // À set correctement, c'est pas exactement comme dans GameScreen
                          ? Colors.transparent
                          : isAllFinish
                              ? Colors.transparent
                              : isPaused
                                  ? const Color.fromRGBO(114, 232, 247, 1)
                                  : isPanicMode
                                      ? const Color.fromARGB(149, 144, 28, 51)
                                      : Colors.transparent,
                  blurRadius: 50,
                  spreadRadius: 5,
                ),
                BoxShadow(
                  color: isPaused || isPanicMode
                      ? Colors.black12
                      : Colors.transparent,
                  blurRadius: 50,
                  spreadRadius: 15,
                ),
              ],
            ),
            child: SizedBox(
              width: 100,
              child: Text(
                '${time}s',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: "Text",
                  fontSize: 55,
                  color: isAllFinish
                      ? Colors.black54
                      : isPaused
                          ? const Color.fromRGBO(114, 232, 247, 1)
                          : isPanicMode
                              ? const Color.fromARGB(255, 194, 21, 56)
                              : time <= 10
                                  ? const Color.fromRGBO(144, 28, 51, 1)
                                  : Colors.black,
                  shadows: [
                    Shadow(
                      color: isPaused ? Colors.black54 : Colors.white70,
                      blurRadius: isPaused || isPanicMode ? 5 : 10,
                    ),
                  ],
                ),
              ),
            ),
          ),
          ((typeQuestion == 'QCM' && time <= 10) ||
                      (typeQuestion == 'QRL' && time <= 20)) &&
                  !isNext
              ? MyButton(
                  text: "!!",
                  fontSize: 43,
                  width: 80,
                  backgroundColor: isPanicMode
                      ? const Color.fromARGB(255, 194, 21, 56)
                      : Colors.white70,
                  shape: BoxShape.circle,
                  disabled: isPanicMode ||
                      !(((typeQuestion == 'QCM' && time <= 10) ||
                              (typeQuestion == 'QRL' && time <= 20)) &&
                          !isNext &&
                          time != 0 &&
                          !isAllFinish),
                  onTab: () {
                    if (!isPanicMode) {
                      isPanicMode = true;
                      _socketService.sendMessage('panicTimer', time);
                      // audioPlayer.play(AssetSource('panicBouton.mp3'));
                    }
                  },
                )
              : const SizedBox(
                  width: 100,
                ),
        ],
      ),
    );

    List<Widget> children = [
      // Contenu principal à gauche
      Expanded(
        flex: 5,
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
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      isVocal = !isVocal;
                    });
                    if (isVocal) {
                      speak();
                    } else {
                      _voiceService.stop();
                    }

                    //toggle mode vocal
                  },
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Flexible(
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
                      Container(
                        width: 40,
                        height: 23,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.transparent,
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.white24,
                              blurRadius: 5,
                            )
                          ],
                        ),
                        child: Icon(
                          !isVocal
                              ? FontAwesomeIcons.volumeXmark
                              : FontAwesomeIcons.volumeHigh,
                          size: 15,
                          color: Colors.black,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // affichage conditionnel du graphique ou des réponses des joueurs
              if (responseQRL)
                Column(
                  children: [
                    Container(
                      height: isPortrait ? 250 : 400,
                      padding: const EdgeInsets.symmetric(horizontal: 15),
                      child: ScrollbarTheme(
                        data: ScrollbarThemeData(
                          thumbColor: WidgetStateProperty.all(Colors.black),
                          thickness: WidgetStateProperty.all(8),
                          radius: const Radius.circular(10),
                        ),
                        child: Scrollbar(
                          thumbVisibility: true,
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.symmetric(horizontal: 15),
                            child: Column(
                              children: playerAnswer.map((answer) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 15,
                                    vertical: 10,
                                  ),
                                  margin: const EdgeInsets.only(bottom: 10),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(width: 1),
                                    boxShadow: const [
                                      BoxShadow(
                                        color: Colors.black26,
                                        blurRadius: 10,
                                      ),
                                    ],
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        "${answer['playerName']}",
                                        style: const TextStyle(
                                          fontFamily: "Text",
                                          color: Colors.grey,
                                        ),
                                      ),
                                      Text(
                                        "${answer['answer']}", // À vérifier quand c'est vide
                                        style: TextStyle(
                                          fontFamily: "Text",
                                          fontSize: 18,
                                          color: answer['answer'] ==
                                                  "(Aucune réponse)"
                                              ? const Color.fromARGB(
                                                  137, 7, 5, 5)
                                              : Colors.black,
                                        ),
                                      ),
                                      const SizedBox(
                                        height: 10,
                                      ),
                                      Row(
                                        mainAxisSize: MainAxisSize.max,
                                        children: [0, 50, 100].map((value) {
                                          return Expanded(
                                            child: ElevatedButton(
                                              onPressed: () {
                                                // Action pour noter la réponse du joueur
                                                gradeCount[(value ~/ 50)]++;
                                                _socketService.sendMessage(
                                                    'answerEvaluated', {
                                                  "playersName":
                                                      answer['playerName'],
                                                  "room": channelService
                                                      .unstandardize(
                                                          widget.room),
                                                  "grade": value
                                                });
                                                setState(() {
                                                  playerAnswer.removeWhere(
                                                      (element) =>
                                                          element[
                                                              'playerName'] ==
                                                          answer['playerName']);
                                                });
                                                if (playerAnswer.isEmpty) {
                                                  responseQRL = false;
                                                  disable = false;
                                                  _socketService.sendMessage(
                                                      'showResult', null);
                                                  _socketService.sendMessage(
                                                      'addGradeCount',
                                                      gradeCount);
                                                  gradeCount = [0, 0, 0];
                                                }
                                              },
                                              style: ElevatedButton.styleFrom(
                                                elevation: 0,
                                                shape: RoundedRectangleBorder(
                                                  side: const BorderSide(
                                                    color: Colors.black12,
                                                    width: 1,
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.horizontal(
                                                    left: Radius.circular(
                                                        value == 0 ? 15 : 0),
                                                    right: Radius.circular(
                                                        value == 100 ? 15 : 0),
                                                  ),
                                                ),
                                                backgroundColor: value == 0
                                                    ? const Color.fromARGB(
                                                        150, 255, 139, 162)
                                                    : value == 50
                                                        ? const Color.fromARGB(
                                                            129, 255, 255, 111)
                                                        : const Color.fromARGB(
                                                            159, 108, 255, 211),
                                              ),
                                              child: Text(
                                                '$value%',
                                                style: TextStyle(
                                                  fontFamily: "Text",
                                                  fontSize: 25,
                                                  color: value == 0
                                                      ? const Color.fromARGB(
                                                          255, 132, 41, 59)
                                                      : value == 50
                                                          ? const Color
                                                              .fromARGB(
                                                              197, 145, 145, 0)
                                                          : const Color
                                                              .fromARGB(
                                                              255, 11, 133, 96),
                                                ),
                                              ),
                                            ),
                                          );
                                        }).toList(),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                        ),
                      ),
                    ),
                    if (responseQRL)
                      Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Text(
                          "${OrganizerScreenConsts.get("nbAnswersLeft", settingsService.language)}${playerAnswer.length}",
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontFamily: "Text",
                            fontSize: 18,
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
                  ],
                )
              else
                // Graphique fictif
                Container(
                  margin:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  height: height * (isPortrait ? 0.15 : 0.30),
                  width: double.infinity,
                  child: Center(
                    child: Histogram(
                      question: widget.questions[questionIndex],
                      realData: realData,
                      disable: isAllFinish,
                    ),
                  ),
                ),
              // Les réponses
              if (typeQuestion == 'QCM')
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
              const SizedBox(height: 0.1),
              // la question est fini
              if (isAllFinish &&
                  !isNext) // À ajuster car c'est pas comme dans GameScreen
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Text(
                    OrganizerScreenConsts.get(
                        "allPlayersAnswered", settingsService.language),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontFamily: "Text",
                      fontSize: 18,
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
              // Bouton "Question suivante"
              if (!disable && !isLast)
                Center(
                  child: MyButton(
                    onTab: () {
                      // Action pour passer à la question suivante
                      disable = true;
                      isNext = true;
                      isPaused = false;
                      isPanicMode = false;
                      _socketService.sendMessage('startTimer', {
                        'startValue': 3,
                        'roomName': channelService.unstandardize(widget.room)
                      });
                      _socketService.sendMessage('timerNextQuestion', null);
                    },
                    text: OrganizerScreenConsts.get(
                        "nextQuestion", settingsService.language),
                    fontSize: 20,
                  ),
                ),
              // derniere question presenter resultat
              if (!disable && isLast)
                Center(
                  child: MyButton(
                    onTab: () {
                      num endTimer = Timestamp.now().seconds;
                      num averageTime = endTimer - startTimer;
                      _socketService.sendMessage('resultEndingGame', null);
                      ChannelService.isDialogOpen = false;
                      resetChatScreenKey();
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(
                          builder: (context) => ResultScreen(
                            questions: widget.questions,
                            isHost: true,
                            timePlayed: averageTime,
                            title: title,
                            room: widget.room,
                          ),
                        ),
                      );
                    },
                    text: OrganizerScreenConsts.get(
                        "showResults", settingsService.language),
                    fontSize: 20,
                  ),
                ),
            ],
          ),
        ),
      ),
      // Classement à droite
      Container(
        // constraints:
        //     BoxConstraints(maxHeight: isPortrait ? height * 0.5 : height),
        width: width * (isPortrait ? 1 : 0.337),
        decoration: const BoxDecoration(
          color: Color.fromARGB(44, 0, 0, 0),
        ),
        child: isPortrait
            ? Row(
                children: [
                  leaderboard,
                  SizedBox(
                    height: height * 0.5,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const SizedBox(
                          height: 50,
                        ),
                        image,
                        timerGroup,
                      ],
                    ),
                  ),
                ],
              )
            : Padding(
                padding: const EdgeInsets.only(top: 25),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    image,
                    leaderboard,
                    timerGroup,
                  ],
                ),
              ),
      ),
    ];

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
          Positioned.fill(
            child: isPortrait
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
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
                  QuitButton(
                    name: settingsService.username,
                    onPressed: _showQuitDialog,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
