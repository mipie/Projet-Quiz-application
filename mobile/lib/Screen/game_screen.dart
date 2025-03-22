import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:mobile/Screen/chat_screen.dart';
import 'package:mobile/Screen/game_screen_consts.dart';
import 'package:mobile/Screen/home_screen.dart';
import 'package:mobile/Screen/result_screen.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/game_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Sockets/socket_service.dart';
import 'package:mobile/Widget/button.dart';
import 'package:mobile/Widget/chat_button.dart';
import 'package:mobile/Widget/dialog.dart';
import 'package:mobile/Widget/quit_button.dart';
import 'package:mobile/Widget/snack_bar.dart';
import 'package:provider/provider.dart';

class GameScreen extends StatefulWidget {
  final dynamic questions;
  final String room;

  const GameScreen({super.key, required this.questions, required this.room});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  final SocketService _socketService = SocketService();
  late GameService _gameService;
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  TextEditingController _textController = TextEditingController();
  String typeQuestion = '';
  List<dynamic> choices = [];
  int lastInteractionTime = 0;
  int totalPoints = 0;
  bool needBonus = false;
  bool interactif = false;
  double selectedValue = 0.0;
  int gainedPoints = 0;
  final audioPlayer = AudioPlayer();

  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _gameService = Provider.of<GameService>(context, listen: false);
    _initializeGame();

    _socketService.listenToEvent('timer', (data) {
      _handleTimerEvent(data);
    });

    _socketService.listenToEvent('showQuestion', (_) {
      _handleShowQuestion();
    });

    _socketService.listenToEvent('isBonus', (_) {
      needBonus = true;
      _gameService.needBonus = needBonus;
    });

    _socketService.listenToEvent('timerShowQuestion', (_) {
      _gameService.isNext = true;
      _gameService.isWaitingOrg = false;
    });

    _socketService.listenToEvent('showNextQuestion', (_) {
      _gameService.resetForNextQuestion();
      _textController.clear();
      gainedPoints = 0;
      needBonus = false;
      lastInteractionTime = 0;
      interactif = false;
      _loadNextQuestion();
    });

    _socketService.listenToEvent('isMute', (isMute) {
      print("isMute : $isMute");
      ChannelService.setIsMute(isMute);
    });

    _socketService.listenToEvent('waitPlayer', (_) {
      _gameService.isWaiting = true;
    });

    _socketService.listenToEvent('stopWaiting', (_) {
      _gameService.isWaiting = false;
    });

    _socketService.listenToEvent('answersGrade', (grade) {
      _gameService.pointGrade = grade;
    });

    _socketService.listenToEvent('redirectResult', (response) {
      if (response) {
        _socketService.sendMessage(
            'nbGoodAnswersPlayer', _gameService.goodAnswers);
        _gameService.resetGame();
        _socketService.removeAllListeners();
        ChannelService.isDialogOpen = false;
        resetChatScreenKey();
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => ResultScreen(
              questions: widget.questions,
              isHost: false,
              timePlayed: 0,
              room: widget.room,
            ),
          ),
        );
      }
    });

    _socketService.listenToEvent('viewToHome', (hasOrgQuit) {
      _socketService.disconnect();
      // À vérifier
      showSnackBar(context,
          GameScreenConsts.get("organizerQuit", settingsService.language));
      _gameService.resetGame();
      _socketService.removeAllListeners();

      // print("settingsService.username : ${settingsService.username}");
      // updatePlayerStatistics(settingsService.username, );

      channelService.quitGameChannel(context, widget.room, false, false, false);
      ChannelService.isDialogOpen = false;
      resetChatScreenKey();
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => HomeScreen(
              name: FirebaseAuth.instance.currentUser!.displayName.toString()),
        ),
      );
    });

    _startInteractionTimer();
  }

  void _initializeGame() {
    totalPoints = _gameService.totalPoints;
    needBonus = _gameService.needBonus;
    interactif = _gameService.interactif;
    typeQuestion = widget.questions[_gameService.questionIndex]['type'];
    choices = widget.questions[_gameService.questionIndex]['choices'];
    if (typeQuestion == 'QRE' && _gameService.selectedValue == 0.0) {
      selectedValue = (widget.questions[_gameService.questionIndex]['qre']
              ['lowerBound'])
          .toDouble();
    } else if (typeQuestion == 'QRE') {
      selectedValue = _gameService.selectedValue;
    }
  }

  void _handleTimerEvent(Map<String, dynamic> data) {
    if (data['time'] == 0 && _gameService.isNext) {
      _gameService.rightAnswer = true;
      _gameService.isNext = false;
    } else if (data['time'] == 0 && !_gameService.isNext) {
      _gameService.isPanicMode = false;
      // audioPlayer.stop;

      if (!_gameService.isWaiting &&
          typeQuestion == 'QRL' &&
          !_gameService.disable) {
        if (_gameService.userAnswer.isEmpty) {
          _gameService.userAnswer = '(Aucune réponse)';
        }
        _socketService.sendMessage('answerSend', _gameService.userAnswer);
      }
      _gameService.disable = true;
      interactif = false;
      _gameService.interactif = interactif;
      lastInteractionTime = 0;
    }

    _gameService.time = data['time'];
    _gameService.isPaused = data['pauseState'];
    if (!(data['time'] == 0 && !_gameService.isNext)) {
      _gameService.isPanicMode = data['panicState'];
      // if (_gameService.isPanicMode == true) {
      //   audioPlayer.play(AssetSource('panicButton.mp3'));
      // }
    }
  }

  void _handleShowQuestion() {
    final gameService = Provider.of<GameService>(context, listen: false);
    if (typeQuestion == "QRL") {
      int point = widget.questions[_gameService.questionIndex]['points'];
      gainedPoints = (point * (_gameService.pointGrade / 100)).round();
      totalPoints += (point * (_gameService.pointGrade / 100)).round();
      _gameService.totalPoints = totalPoints;
      if (_gameService.pointGrade == 100) {
        _gameService.goodAnswers++;
      }
      _socketService.sendMessage('scorePlayer', totalPoints);
    } else if (typeQuestion == 'QCM') {
      if (gameService.selectedChoices.isNotEmpty) {
        List<int> correctAnswers = [];
        for (int i = 0; i < choices.length; i++) {
          if (choices[i]['isCorrect']) {
            correctAnswers.add(i);
          }
        }

        bool isCorrect =
            gameService.selectedChoices.length == correctAnswers.length &&
                gameService.selectedChoices
                    .every((choice) => correctAnswers.contains(choice));

        if (isCorrect) {
          int point = widget.questions[gameService.questionIndex]['points'];
          gainedPoints = needBonus ? (point * 1.2).round() : point;
          totalPoints += needBonus ? (point * 1.2).round() : point;
          gameService.isPointGived = true;
          _gameService.totalPoints = totalPoints;
          _gameService.goodAnswers++;
        }
        _socketService.sendMessage('scorePlayer', totalPoints);
      }
    } else if (typeQuestion == 'QRE') {
      int point = widget.questions[gameService.questionIndex]['points'];
      if (widget.questions[_gameService.questionIndex]['qre']['goodAnswer'] ==
          selectedValue.toInt()) {
        if (!needBonus) _socketService.sendMessage('exactAnswer', null);
        gainedPoints = (point * 1.2).round();

        totalPoints += (point * 1.2).round();
        _gameService.goodAnswers++;
      } else {
        double margin =
            widget.questions[_gameService.questionIndex]['qre']['margin'] / 100;
        int upper =
            widget.questions[_gameService.questionIndex]['qre']['upperBound'];
        int lower =
            widget.questions[_gameService.questionIndex]['qre']['lowerBound'];
        int interval = upper - lower;
        int goodAnswer =
            widget.questions[_gameService.questionIndex]['qre']['goodAnswer'];

        double upperMargin = (goodAnswer + (margin * interval)) > upper
            ? upper.toDouble()
            : (goodAnswer + (margin * interval));

        double lowerMargin = (goodAnswer + (margin * interval * -1)) < lower
            ? lower.toDouble()
            : (goodAnswer + (margin * interval * -1));

        if (selectedValue >= lowerMargin &&
            selectedValue <= upperMargin &&
            margin != 0) {
          gainedPoints = (point * 1.2).round();
          totalPoints += point;
        }
      }
      _gameService.totalPoints = totalPoints;
      _socketService.sendMessage('scorePlayer', totalPoints);
    }
    _gameService.isWaiting = false;
    _gameService.isWaitingOrg = true;
    _gameService.isAlreadyAns = false;
    _gameService.isShowResult = true;
    _gameService.disable = true;
  }

  void _loadNextQuestion() {
    _gameService.questionIndex += 1;
    typeQuestion = widget.questions[_gameService.questionIndex]['type'];
    choices = widget.questions[_gameService.questionIndex]['choices'];
    if (typeQuestion == 'QRE') {
      selectedValue = (widget.questions[_gameService.questionIndex]['qre']
              ['lowerBound'])
          .toDouble();
      _gameService.selectedValue = selectedValue;
    }
  }

  void _startInteractionTimer() {
    Timer.periodic(const Duration(milliseconds: 1000), (timer) {
      if (interactif) {
        lastInteractionTime++;
        if (lastInteractionTime >= 5) {
          interactif = false;
          _gameService.interactif = interactif;
          lastInteractionTime = 0;
          if (typeQuestion == 'QRL') {
            _socketService.sendMessage('interactif', false);
          }
        }
      } else {
        lastInteractionTime = 0;
      }
    });
  }

  bool isPortrait(BuildContext context) {
    return MediaQuery.of(context).orientation == Orientation.portrait;
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context);
    double width = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;

    return Consumer<GameService>(
      builder: (context, gameService, child) {
        bool hasImage =
            widget.questions[gameService.questionIndex]['imageUrl'].isNotEmpty;
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
              Positioned.fill(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: width * 0.2,
                      padding: const EdgeInsets.symmetric(horizontal: 15),
                      child: Column(
                        children: [
                          const Spacer(),
                          if (needBonus && gameService.isShowResult)
                            Text(
                              GameScreenConsts.get(
                                  typeQuestion == "QRE"
                                      ? "bonusQRE"
                                      : "bonusQCM",
                                  settingsService.language),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 18,
                                fontFamily: "Text",
                                color: Color.fromRGBO(44, 113, 169, 1),
                                shadows: const [
                                  Shadow(
                                    color: Colors.white70,
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                            ),
                          if (gameService.isShowResult)
                            Text(
                              '+$gainedPoints ${isPortrait(context) ? "pt" : "point"}${gainedPoints > 1 ? "s" : ""}!',
                              style: TextStyle(
                                fontSize: 30,
                                fontFamily: "Text",
                                color: (gainedPoints != 0 &&
                                            (typeQuestion == 'QCM' ||
                                                typeQuestion == "QRE") ||
                                        _gameService.pointGrade == 100)
                                    ? const Color.fromRGBO(9, 121, 87, 1)
                                    : _gameService.pointGrade == 50
                                        ? Color.fromRGBO(255, 255, 0, 0.785)
                                        : const Color.fromRGBO(147, 45, 66, 1),
                                shadows: const [
                                  Shadow(
                                    color: Colors.white70,
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                            ),
                          Text(
                            '${gameService.totalPoints} ${isPortrait(context) ? "pt" : "point"}${gameService.totalPoints > 1 ? "s" : ""}',
                            style: const TextStyle(
                              fontSize: 45,
                              fontFamily: "Text",
                              shadows: [
                                Shadow(
                                  color: Colors.white70,
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(
                            height: 150,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: width * 0.5,
                      padding: const EdgeInsets.symmetric(
                          vertical: 30, horizontal: 10),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 0, vertical: 40),
                            child: GestureDetector(
                              onTap: () {
                                //toggle mode vocal
                              },
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Flexible(
                                    child: Text(
                                      "${gameService.questionIndex + 1}. ${widget.questions[gameService.questionIndex]['text']} (${widget.questions[gameService.questionIndex]['points']} points)",
                                      softWrap: true,
                                      style: const TextStyle(
                                        fontFamily: "Text",
                                        fontSize: 30,
                                        shadows: [
                                          Shadow(
                                            color: Colors.white70,
                                            blurRadius: 10,
                                          ),
                                        ],
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                  Container(
                                    width: 60,
                                    height: 40,
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
                                    child: const Icon(
                                      // FontAwesomeIcons.volumeXmark,
                                      FontAwesomeIcons.volumeHigh,
                                      size: 25,
                                      color: Colors.black,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const Spacer(flex: 1),
                          if (typeQuestion == 'QCM')
                            Flexible(
                              flex: 10,
                              child: ConstrainedBox(
                                constraints: BoxConstraints(
                                  maxHeight: height * 0.45,
                                ),
                                child: ScrollbarTheme(
                                  data: ScrollbarThemeData(
                                    thumbColor:
                                        WidgetStateProperty.all(Colors.white),
                                    thickness: WidgetStateProperty.all(8),
                                    radius: const Radius.circular(10),
                                  ),
                                  child: Scrollbar(
                                    thumbVisibility: true,
                                    child: SingleChildScrollView(
                                      child: Padding(
                                        padding: const EdgeInsets.all(
                                            8.0), // Add padding around the Column
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.center,
                                          children: choices
                                              .asMap()
                                              .entries
                                              .map((entry) {
                                            int index = entry.key;
                                            dynamic choice = entry.value;
                                            return buildAnswerButton(
                                                choice['text'], index);
                                          }).toList(),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          if (typeQuestion == 'QRL') buildTextInput(),
                          if (typeQuestion == 'QRE') buildSliderQRE(),
                          const Spacer(flex: 1),
                          MyButton(
                            onTab: gameService.disable ? () {} : _handleConfirm,
                            disabled: gameService.disable,
                            backgroundColor:
                                const Color.fromARGB(255, 95, 176, 242),
                            text: GameScreenConsts.get(
                                "confirm", settingsService.language),
                            textColor: Colors.white,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: width * 0.25,
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const SizedBox(
                            height: 100,
                          ),
                          if (hasImage)
                            Container(
                              decoration: BoxDecoration(
                                borderRadius:
                                    const BorderRadius.all(Radius.circular(20)),
                                border: Border.all(
                                  color: Colors.white70,
                                  width: 5,
                                ),
                              ),
                              padding: const EdgeInsets.all(15),
                              child: hasImage
                                  ? Image.network(
                                      widget.questions[gameService
                                          .questionIndex]['imageUrl'][0],
                                      height: 225,
                                    )
                                  : Image.asset(
                                      "assets/noImage.jpg",
                                      height: 150,
                                    ),
                            ),
                          hasImage
                              ? const SizedBox(
                                  height: 25,
                                )
                              : const Spacer(),
                          if (gameService.isWaiting)
                            Text(
                              GameScreenConsts.get(
                                  "waitingOnOthers", settingsService.language),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontFamily: "Text",
                                fontSize: 20,
                                shadows: [
                                  Shadow(
                                    color: Colors.white70,
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                            ),
                          if (gameService.isWaitingOrg)
                            Text(
                              GameScreenConsts.get("organizerMovingOn",
                                  settingsService.language),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontFamily: "Text",
                                fontSize: 20,
                                shadows: [
                                  Shadow(
                                    color: Colors.white70,
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                            ),
                          if (!gameService.isWaitingOrg &&
                              !gameService.isWaiting &&
                              !gameService.isNext &&
                              gameService.disable)
                            Text(
                              GameScreenConsts.get(
                                  "organizerGrading", settingsService.language),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontFamily: "Text",
                                fontSize: 20,
                                shadows: [
                                  Shadow(
                                    color: Colors.white70,
                                    blurRadius: 5,
                                  ),
                                ],
                              ),
                            ),
                          if (gameService.isPanicMode &&
                              !gameService.isWaitingOrg &&
                              !gameService.isWaiting)
                            Text(
                              GameScreenConsts.get("organizerActivatedPanic",
                                  settingsService.language),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontFamily: "Text",
                                fontSize: 20,
                                color: const Color.fromARGB(255, 194, 21, 56),
                                shadows: [
                                  Shadow(
                                    color:
                                        const Color.fromARGB(151, 194, 21, 56),
                                    blurRadius: 10,
                                  ),
                                  Shadow(
                                    color: Colors.white70,
                                    blurRadius: 5,
                                  ),
                                ],
                              ),
                            ),
                          if (gameService.isPaused &&
                              !gameService.isWaitingOrg &&
                              !gameService.isWaiting)
                            Text(
                              GameScreenConsts.get("organizerFrozeTime",
                                  settingsService.language),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontFamily: "Text",
                                fontSize: 20,
                                color: const Color.fromRGBO(114, 232, 247, 1),
                                shadows: [
                                  Shadow(
                                    color:
                                        const Color.fromRGBO(114, 232, 247, 1),
                                    blurRadius: 10,
                                  ),
                                  Shadow(
                                    color: Colors.black54,
                                    blurRadius: 5,
                                  ),
                                ],
                              ),
                            ),
                          const SizedBox(
                            height: 25,
                          ),
                          if (!gameService.isNext)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 90),
                              child: Container(
                                decoration: BoxDecoration(
                                  boxShadow: [
                                    BoxShadow(
                                      color: gameService.isWaitingOrg ||
                                              gameService.isWaiting ||
                                              (!gameService.isWaitingOrg &&
                                                  !gameService.isWaiting &&
                                                  !gameService.isNext &&
                                                  gameService.disable)
                                          ? Colors.transparent
                                          : gameService.isPaused
                                              ? const Color.fromRGBO(
                                                  114, 232, 247, 1)
                                              : gameService.isPanicMode
                                                  ? const Color.fromARGB(
                                                      149, 144, 28, 51)
                                                  : gameService.time <= 10
                                                      ? const Color.fromARGB(
                                                          151, 194, 21, 56)
                                                      : Colors.transparent,
                                      blurRadius: 100,
                                      spreadRadius: 30,
                                    ),
                                    BoxShadow(
                                      color: gameService.isPaused ||
                                              gameService.isPanicMode
                                          ? Colors.black12
                                          : Colors.transparent,
                                      blurRadius: 50,
                                      spreadRadius: 15,
                                    ),
                                  ],
                                ),
                                child: Text(
                                  '${gameService.time}s',
                                  style: TextStyle(
                                    fontFamily: "Text",
                                    fontSize: 80,
                                    color: gameService.isWaitingOrg ||
                                            gameService.isWaiting ||
                                            (!gameService.isWaitingOrg &&
                                                !gameService.isWaiting &&
                                                !gameService.isNext &&
                                                gameService.disable)
                                        ? Colors.black54
                                        : gameService.isPaused
                                            ? const Color.fromRGBO(
                                                114, 232, 247, 1)
                                            : gameService.isPanicMode
                                                ? const Color.fromARGB(
                                                    255, 194, 21, 56)
                                                : gameService.time <= 10
                                                    ? const Color.fromRGBO(
                                                        144, 28, 51, 1)
                                                    : Colors.black,
                                    shadows: [
                                      Shadow(
                                        color: gameService.isWaitingOrg ||
                                                gameService.isWaiting
                                            ? Colors.white70
                                            : gameService.isPaused
                                                ? Colors.black54
                                                : Colors.white70,
                                        blurRadius: gameService.isWaitingOrg ||
                                                gameService.isWaiting
                                            ? 10
                                            : gameService.isPaused
                                                ? 5
                                                : 10,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          // const Spacer(
                          //   flex: 1,
                          // ),
                          // SizedBox(
                          //   height: hasImage ? 80 : 100,
                          // ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _handleConfirm() {
    final gameService = Provider.of<GameService>(context, listen: false);
    if (typeQuestion == 'QCM') {
      if (gameService.selectedChoices.isNotEmpty) {
        _socketService.sendMessage('isFinish', null);

        List<int> correctAnswers = [];
        for (int i = 0; i < choices.length; i++) {
          if (choices[i]['isCorrect']) {
            correctAnswers.add(i);
          }
        }

        bool isCorrect =
            gameService.selectedChoices.length == correctAnswers.length &&
                gameService.selectedChoices
                    .every((choice) => correctAnswers.contains(choice));

        if (isCorrect) {
          _socketService.sendMessage('playerFirst', null);
        }
        gameService.disable = true;
      }
    } else if (typeQuestion == 'QRL' && gameService.userAnswer.trim() != '') {
      _socketService.sendMessage('isFinish', gameService.userAnswer.trim());
      gameService.isAlreadyAns = true;
      gameService.disable = true;
    } else if (typeQuestion == 'QRE') {
      _socketService.sendMessage('isFinish', null);
      if (widget.questions[_gameService.questionIndex]['qre']['goodAnswer'] ==
          selectedValue.toInt()) {
        _socketService.sendMessage('exactAnswer', null);
      }
      gameService.disable = true;
    }
  }

  Widget buildAnswerButton(String text, int index) {
    final gameService = Provider.of<GameService>(context, listen: false);
    double width = MediaQuery.of(context).size.width;

    Color buttonColor = const Color.fromARGB(215, 255, 255, 255);
    Color borderColor = Colors.black87;
    Color textColor = Colors.black87;

    if (gameService.isShowResult) {
      if (choices[index]['isCorrect']) {
        buttonColor = const Color.fromRGBO(12, 230, 164, 0.821);
        borderColor = const Color.fromRGBO(10, 184, 132, 0.82);
      } else {
        bool displayRed = gameService.selectedChoices.any((idx) {
          return !choices[idx]["isCorrect"];
        });
        if (displayRed) {
          buttonColor = const Color.fromRGBO(252, 76, 111, 0.771);
          borderColor = const Color.fromARGB(196, 186, 57, 83);
        }
      }
      if (gameService.selectedChoices.contains(index)) {
        borderColor = const Color.fromRGBO(79, 129, 216, 1);
      }
    } else {
      if (gameService.selectedChoices.contains(index)) {
        buttonColor = const Color.fromRGBO(79, 129, 216, 1);
        borderColor = Colors.white;
        textColor = Colors.white;
      }
    }

    return SizedBox(
      width: width * 0.5,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 5.0),
        child: ElevatedButton(
          onPressed: gameService.disable
              ? null
              : () {
                  gameService.updateSelectedChoices(index);
                  _socketService.sendMessage('setChoice', index + 1);
                },
          style: ButtonStyle(
            foregroundColor: WidgetStateProperty.all(Colors.black),
            backgroundColor: WidgetStateProperty.all(
              buttonColor,
            ),
            padding: const WidgetStatePropertyAll(
              EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            ),
            side: WidgetStateProperty.all(
              BorderSide(
                color: borderColor,
                width: !gameService.isShowResult ||
                        buttonColor == const Color.fromARGB(215, 255, 255, 255)
                    ? 1
                    : 4,
              ),
            ),
            shape: WidgetStateProperty.all(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
              ),
            ),
          ),
          child: Text(
            "${index + 1}. $text",
            style: TextStyle(
              fontFamily: "Text",
              fontSize: 20,
              color: textColor,
            ),
          ),
        ),
      ),
    );
  }

  Widget buildTextInput() {
    final gameService = Provider.of<GameService>(context, listen: false);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(width: 2),
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: 15,
        vertical: 5,
      ),
      child: Column(
        children: [
          TextField(
            controller: _textController,
            onChanged: (value) {
              if (!gameService.disable) {
                lastInteractionTime = 0;
                gameService.userAnswer = value;
                _socketService.sendMessage('userAnswer', value);
                _socketService.sendMessage('interactif', true);
                interactif = true;
                gameService.interactif = interactif;
              }
            },
            maxLength: 200,
            decoration: InputDecoration(
              hintText:
                  GameScreenConsts.get("enterAnswer", settingsService.language),
              border: InputBorder.none,
              counterText: '',
            ),
            enabled: !gameService.disable,
            style: const TextStyle(
              fontFamily: "Text",
              fontSize: 20,
            ),
          ),
          Align(
            alignment: Alignment.bottomRight,
            child: Text(
              '${200 - gameService.userAnswer.length}',
              style: const TextStyle(
                fontFamily: "Text",
                fontSize: 16,
                color: Color.fromARGB(255, 182, 50, 40),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildSliderQRE() {
    final gameService = Provider.of<GameService>(context, listen: false);
    int min =
        widget.questions[_gameService.questionIndex]['qre']?['lowerBound'] ?? 0;
    int max = widget.questions[_gameService.questionIndex]['qre']
            ?['upperBound'] ??
        10;
    double marg =
        (widget.questions[_gameService.questionIndex]['qre']?['margin'] ?? 0) /
            100;
    int margin = ((marg / 100) * (max - min)).round();
    int interval = max - min;
    int goodAnswer =
        widget.questions[_gameService.questionIndex]['qre']?['goodAnswer'] ?? 0;

    double upperMargin = (goodAnswer + (marg * interval)) > max
        ? max.toDouble()
        : (goodAnswer + (marg * interval));

    double lowerMargin = (goodAnswer + (marg * interval * -1)) < min
        ? min.toDouble()
        : (goodAnswer + (marg * interval * -1));

    int divisions = (max - min);

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          "${GameScreenConsts.get("valueSelected", settingsService.language)}${selectedValue.round()}",
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontFamily: "Text",
            fontSize: 20,
            shadows: [
              Shadow(
                color: Colors.white70,
                blurRadius: 5,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              min.toString(),
              style: const TextStyle(
                fontFamily: "Text",
                fontSize: 20,
                shadows: [
                  Shadow(
                    color: Colors.white70,
                    blurRadius: 5,
                  ),
                ],
              ),
            ),
            Expanded(
              child: Container(
                decoration: const BoxDecoration(
                  boxShadow: [
                    BoxShadow(
                      color: Colors.white38,
                      blurRadius: 30,
                    ),
                  ],
                ),
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    valueIndicatorTextStyle: const TextStyle(
                      fontFamily: "Text",
                      color: Colors.black, // Color for the value text
                      fontSize: 20, // Font size for the value text
                    ),
                  ),
                  child: Slider(
                    value: selectedValue < min || selectedValue > max
                        ? min.toDouble()
                        : selectedValue,
                    min: min.toDouble(),
                    max: max.toDouble(),
                    divisions: divisions,
                    label: selectedValue.toStringAsFixed(0),
                    onChanged: gameService.disable
                        ? null
                        : (value) {
                            setState(() {
                              selectedValue = value;
                              _gameService.selectedValue = selectedValue;
                            });

                            if (_debounce?.isActive ?? false)
                              _debounce?.cancel();
                            _debounce =
                                Timer(const Duration(milliseconds: 500), () {
                              _socketService.sendMessage('setQreValue', {
                                'value': selectedValue,
                                'lowerMargin': lowerMargin,
                                'upperMargin': upperMargin,
                                'goodAnswer': goodAnswer,
                              });
                            });
                          },
                    thumbColor: const Color.fromRGBO(12, 230, 164, 0.82),
                    activeColor: const Color.fromRGBO(211, 211, 211, 1),
                    inactiveColor: const Color.fromRGBO(211, 211, 211, 1),
                  ),
                ),
              ),
            ),
            Text(
              max.toString(), // Max
              style: const TextStyle(
                fontFamily: "Text",
                fontSize: 20,
                shadows: [
                  Shadow(
                    color: Colors.white70,
                    blurRadius: 5,
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          "${GameScreenConsts.get("toleranceMargin", settingsService.language)}$margin",
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontFamily: "Text",
            fontSize: 20,
            shadows: [
              Shadow(
                color: Colors.white70,
                blurRadius: 5,
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showQuitDialog() {
    showDialog(
      context: context,
      builder: (context) => MyDialog(
        text: GameScreenConsts.get("wantToAbandon", settingsService.language),
        negativeButtonAction: () => Navigator.of(context).pop(),
        negativeButtonText:
            GameScreenConsts.get("cancel", settingsService.language),
        positiveButtonAction: () {
          _socketService.sendMessage('giveUp', null);
          _socketService.disconnect();
          _gameService.resetGame();
          _socketService.removeAllListeners();
          channelService.quitGameChannel(
              context, widget.room, false, false, false);
          ChannelService.isDialogOpen = false;
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => HomeScreen(
                  name: FirebaseAuth.instance.currentUser!.displayName
                      .toString()),
            ),
          );
        },
        positiveButtonText:
            GameScreenConsts.get("confirm", settingsService.language),
      ),
    );
  }
}
