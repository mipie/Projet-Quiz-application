import 'package:audioplayers/audioplayers.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:mobile/Screen/game_screen_consts.dart';
import 'package:mobile/Screen/home_screen.dart';
import 'package:mobile/Screen/observer_screen_consts.dart';
import 'package:mobile/Screen/organizer_consts.dart';
import 'package:mobile/Screen/result_screen.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/observer_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Sockets/socket_service.dart';
import 'package:mobile/Widget/button.dart';
import 'package:mobile/Widget/chat_button.dart';
import 'package:mobile/Widget/classement_joueurs.dart';
import 'package:mobile/Widget/histogram.dart';
import 'package:mobile/Widget/quit_button.dart';
import 'package:mobile/Widget/snack_bar.dart';
import 'package:provider/provider.dart';

class ObserverScreen extends StatefulWidget {
  final dynamic questions;
  final String room;
  const ObserverScreen({
    required this.questions,
    required this.room,
    super.key,
  });

  @override
  State<ObserverScreen> createState() => _ObserverScreenState();
}

class _ObserverScreenState extends State<ObserverScreen> {
  final SocketService _socketService = SocketService();
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  TextEditingController _textController = TextEditingController();
  ObserverService _observerService = ObserverService();
  // variable global
  bool isOrg = true;

  // variable semblable
  String typeQuestion = '';
  List<dynamic> choices = [];
  int questionIndex = 0;
  int time = 60;
  bool disable = true;
  bool isNext = false;
  bool isPaused = false;
  bool isPanicMode = false;

  // variable Organisateur
  bool isAllFinish = false;
  bool isLast = false;
  bool responseQRL = false;
  List<dynamic> realData = [0, 0, 0, 0];
  List<dynamic> joueurs = [];
  List<dynamic> playerAnswer = [];

  // variable joueurs
  int totalPoints = 0;
  bool needBonus = false;
  double selectedValue = 0.0;
  int gainedPoints = 0;
  final audioPlayer = AudioPlayer();
  bool isShowResult = false;
  int pointGrade = 0;
  bool isWaiting = false;
  bool isWaitingOrg = false;
  List<int> selectedChoices = [];

  @override
  void initState() {
    super.initState();
    channelService.joinGameChannel(widget.room);
    _socketService.sendMessage(
        'observerSet', channelService.unstandardize(widget.room));
    typeQuestion = widget.questions[questionIndex]['type'];
    choices = widget.questions[questionIndex]['choices'];
    isLast = questionIndex == (widget.questions.length - 1);

    _socketService.listenToEvent('setObserver', (attribut) {
      questionIndex = attribut['questionIndex'];
      typeQuestion = widget.questions[questionIndex]['type'];
      choices = widget.questions[questionIndex]['choices'];
      isLast = questionIndex == (widget.questions.length - 1);
      isAllFinish = attribut['isAllFinish'];
      disable = attribut['disable'];
      isNext = attribut['isNext'];
      playerAnswer = attribut['answers'];
      print('answers pour org: $playerAnswer');
      print('responseQRL $responseQRL');
      _observerService.isLoading = false;
      setState(() {});
    });

    _socketService.listenToEvent('setObsPlayer', (attribut) {
      print('1');
      questionIndex = attribut['questionIndex'];
      print('2');
      typeQuestion = widget.questions[questionIndex]['type'];
      print('3');
      choices = widget.questions[questionIndex]['choices'];
      print('4');
      isLast = questionIndex == (widget.questions.length - 1);
      print('5');
      disable = attribut['disable'];
      print('6');
      isNext = attribut['isNext'];
      print('7');
      totalPoints = attribut['score'];
      print('8');
      needBonus = attribut['needBonus'];
      print('9');
      selectedValue = attribut['selectedValue'].toDouble();
      print('10');
      gainedPoints = attribut['gainedPoints'];
      print('11');
      isShowResult = attribut['isShowResult'];
      print('12');
      pointGrade = attribut['pointGrade'];
      print('13');
      isWaiting = attribut['isWaiting'];
      print('14');
      isWaitingOrg = attribut['isWaitingOrg'];
      print('15');
      if (attribut['selectedChoices'].isNotEmpty) {
        print('16');
        attribut['selectedChoices'].forEach((value) {
          selectedChoices.add(value);
        });
        print('17');
      }
      print('18');
      _textController.text = attribut['answer'];
      print('19');
      _observerService.isLoading = false;
      print('20');
      setState(() {});
      print('21');
    });

    _socketService.sendMessage(
        'timerGame', channelService.unstandardize(widget.room));
    _socketService.sendMessage(
        'uploadPlayers', channelService.unstandardize(widget.room));

    _socketService.listenToEvent('timer', (data) {
      if (_observerService.isOrg) {
        if (data['time'] == 0 && !isAllFinish) {
          // if (isPanicMode) audioPlayer.stop();
          setState(() {
            isAllFinish = true;
            disable = false; // joueur doit etre true
            isNext = true;
          });
          if (typeQuestion == 'QRL') {
            setState(() {
              responseQRL = true;
            });
            disable = true;
          } else {
            responseQRL = false;
          }
        }
      } else {
        if (data['time'] == 0 && isNext) {
          isNext = false;
        } else if (data['time'] == 0 && !isNext) {
          isPanicMode = false;
          disable = true;
        }
      }
      setState(() {
        time = data['time'];
        isPaused = data['pauseState'];
        if (data['time'] != 0) {
          isPanicMode = data['panicState'];
        }
      });
      print('je suis responseQRL: $responseQRL');
    });

    _socketService.listenToEvent('getPlayers', (data) {
      setState(() {
        joueurs = data;
      });
    });

    _socketService.listenToEvent('showNextQuestion', (_) {
      needBonus = false;
      isShowResult = false;
      selectedChoices.clear();
      gainedPoints = 0;
      _textController.clear();

      isNext = false;
      isAllFinish = false;
      if (_observerService.isOrg) {
        disable = true;
      } else {
        disable = false;
      }
      questionIndex++;
      typeQuestion = widget.questions[questionIndex]['type'];
      choices = widget.questions[questionIndex]['choices'];
      isLast = questionIndex == (widget.questions.length - 1);
      setState(() {});
    });

    _socketService.listenToEvent('redirectResult', (response) {
      if (response) {
        _socketService.removeAllListeners();
        _observerService.resetObs();
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
      // à vérifier
      showSnackBar(context,
          ObserverScreenConsts.get("organizerQuit", settingsService.language));
      _socketService.removeAllListeners();
      _observerService.resetObs();
      // quit channel
      channelService.quitGameChannel(context, widget.room, false, false, false);
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => HomeScreen(
              name: FirebaseAuth.instance.currentUser!.displayName.toString()),
        ),
      );
    });

    // for organizer //
    _socketService.listenToEvent('allFinish', (_) {
      setState(() {
        isAllFinish = true;
        if (typeQuestion != 'QRL') {
          disable = false;
        } else if (typeQuestion == 'QRL') {
          responseQRL = true;
        }
        isNext = true;
      });
    });

    _socketService.listenToEvent('newOpenEndedAnswer', (data) {
      print('je suis dans le newOpenEndedAnswer: $data');
      if (typeQuestion == 'QRL') {
        playerAnswer.add(data);
        setState(() {
          playerAnswer.sort((a, b) =>
              (a['playerName'] as String).compareTo(b['playerName'] as String));
        });
      }
    });

    _socketService.listenToEvent('orgGiveGrade', (name) {
      playerAnswer.removeWhere((element) => element['playerName'] == name);
      if (playerAnswer.isEmpty) {
        responseQRL = false;
        disable = false;
      }
      setState(() {});
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

    // for player game //
    _socketService.listenToEvent('timerShowQuestion', (_) {
      if (_observerService.isOrg) {
        disable = true;
        isPaused = false;
        isPanicMode = false;
      }
      isNext = true;
      isWaitingOrg = false;
    });

    _socketService.listenToEvent('showQuestion', (_) {
      isWaiting = false;
      isWaitingOrg = true;
      isShowResult = true;
      disable = true;
    });

    _socketService.listenToEvent('playerfinish', (_) {
      disable = true;
    });

    _socketService.listenToEvent('obsScore', (score) {
      gainedPoints = score - totalPoints;
      setState(() {
        totalPoints = score;
      });
    });

    _socketService.listenToEvent('isBonus', (_) {
      needBonus = true;
    });

    _socketService.listenToEvent('selectValueObs', (value) {
      setState(() {
        selectedValue = value.toDouble();
      });
    });

    _socketService.listenToEvent('answersGrade', (value) {
      setState(() {
        pointGrade = value;
      });
    });

    _socketService.listenToEvent('waitPlayer', (_) {
      setState(() {
        isWaiting = true;
      });
    });

    _socketService.listenToEvent('stopWaiting', (_) {
      setState(() {
        isWaiting = false;
      });
    });

    _socketService.listenToEvent('playerChoice', (choice) {
      setState(() {
        if (selectedChoices.contains(choice)) {
          selectedChoices.remove(choice);
        } else {
          selectedChoices.add(choice);
        }
      });
    });

    _socketService.listenToEvent('answerObs', (answer) {
      print(answer);
      setState(() {
        _textController.text = answer;
      });
    });

    // changeObserver();
  }

  void changeObserver() {
    _observerService.changeObserver('Organisateur');
  }

  @override
  Widget build(BuildContext context) {
    if (_observerService.isOrg) {
      return buildObsOrg();
    } else {
      return buildObsGame();
    }
  }

  Widget buildObsGame() {
    settingsService = Provider.of<SettingsService>(context);
    double width = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;

    bool isPortrait =
        MediaQuery.of(context).orientation == Orientation.portrait;

    Widget leaderboard = Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        ClassementWidget(
          joueurs: joueurs,
          isResult: false,
          isObserver: true,
        ),
        Container(
          color: Colors.black12,
          height: 75,
          width: width * (isPortrait ? 0.5 : 0.337),
          padding: const EdgeInsets.only(right: 40),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const SizedBox(
                width: 40,
              ),
              Text(
                ObserverScreenConsts.get("organizer", settingsService.language),
                style: const TextStyle(
                  fontFamily: "Text",
                  fontSize: 25,
                ),
              ),
              GestureDetector(
                onTap: () {
                  _observerService.changeObserver('Organisateur');
                },
                child: Container(
                  height: 50,
                  width: 50,
                  color: Colors.white24,
                  child: const Icon(FontAwesomeIcons.eye),
                ),
              )
            ],
          ),
        ),
      ],
    );

    Widget mainArea = Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: width * 0.13,
          padding: const EdgeInsets.symmetric(horizontal: 15),
          child: Column(
            children: [
              const Spacer(),
              if (needBonus && isShowResult)
                Text(
                  GameScreenConsts.get(
                      typeQuestion == "QRE" ? "bonusQRE" : "bonusQCM",
                      settingsService.language),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 18,
                    fontFamily: "Text",
                    color: Color.fromRGBO(44, 113, 169, 1),
                    shadows: [
                      Shadow(
                        color: Colors.white70,
                        blurRadius: 10,
                      ),
                    ],
                  ),
                ),
              if (isShowResult)
                Text(
                  '+$gainedPoints ${isPortrait ? "pt" : "point"}${gainedPoints > 1 ? "s" : ""}!',
                  style: TextStyle(
                    fontSize: 30,
                    fontFamily: "Text",
                    color: (gainedPoints >=
                            widget.questions[questionIndex]['points'])
                        ? const Color.fromRGBO(9, 121, 87, 1)
                        : gainedPoints != 0
                            ? const Color.fromRGBO(255, 255, 0, 0.785)
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
                '$totalPoints ${isPortrait ? "pt" : "point"}${totalPoints > 1 ? "s" : ""}',
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
          width: width * 0.35,
          padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 10),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 0, vertical: 40),
                child: Text(
                  "${questionIndex + 1}. ${widget.questions[questionIndex]['text']} (${widget.questions[questionIndex]['points']} points)",
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
                        thumbColor: WidgetStateProperty.all(Colors.white),
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
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: choices.asMap().entries.map((entry) {
                                int index = entry.key;
                                dynamic choice = entry.value;
                                return buildAnswerButton(choice['text'], index);
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
                onTab: () {},
                disabled: true,
                backgroundColor: const Color.fromARGB(255, 95, 176, 242),
                text: GameScreenConsts.get("confirm", settingsService.language),
                textColor: Colors.white,
              ),
            ],
          ),
        ),
        Container(
          width: width * 0.18,
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Column(
            children: [
              const SizedBox(
                height: 110,
              ),
              if (widget.questions[questionIndex]['imageUrl'].isNotEmpty)
                Container(
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.all(Radius.circular(20)),
                    border: Border.all(
                      color: Colors.white70,
                      width: 5,
                    ),
                  ),
                  padding: const EdgeInsets.all(15),
                  child: widget.questions[questionIndex]['imageUrl'][0] != ""
                      ? Image.network(
                          widget.questions[questionIndex]['imageUrl'][0],
                        )
                      : Image.asset(
                          "assets/noImage.jpg",
                          height: 150,
                        ),
                ),
              const Spacer(),
              if (isWaiting)
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
              if (isWaitingOrg)
                Text(
                  GameScreenConsts.get(
                      "organizerMovingOn", settingsService.language),
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
              if (!isWaitingOrg && !isWaiting && !isNext && disable)
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
              if (isPanicMode && !isWaitingOrg && !isWaiting)
                Text(
                  GameScreenConsts.get(
                      "organizerActivatedPanic", settingsService.language),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: "Text",
                    fontSize: 20,
                    color: Color.fromARGB(255, 194, 21, 56),
                    shadows: [
                      Shadow(
                        color: Color.fromARGB(151, 194, 21, 56),
                        blurRadius: 10,
                      ),
                      Shadow(
                        color: Colors.white70,
                        blurRadius: 5,
                      ),
                    ],
                  ),
                ),
              if (isPaused && !isWaitingOrg && !isWaiting)
                Text(
                  GameScreenConsts.get(
                      "organizerFrozeTime", settingsService.language),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: "Text",
                    fontSize: 20,
                    color: Color.fromRGBO(114, 232, 247, 1),
                    shadows: [
                      Shadow(
                        color: Color.fromRGBO(114, 232, 247, 1),
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
              if (!isNext)
                Container(
                  decoration: BoxDecoration(
                    boxShadow: [
                      BoxShadow(
                        color: isWaitingOrg ||
                                isWaiting ||
                                (!isWaitingOrg &&
                                    !isWaiting &&
                                    !isNext &&
                                    disable)
                            ? Colors.transparent
                            : isPaused
                                ? const Color.fromRGBO(114, 232, 247, 1)
                                : isPanicMode
                                    ? const Color.fromARGB(149, 144, 28, 51)
                                    : time <= 10
                                        ? const Color.fromARGB(151, 194, 21, 56)
                                        : Colors.transparent,
                        blurRadius: 100,
                        spreadRadius: 30,
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
                  child: Text(
                    '${time}s',
                    style: TextStyle(
                      fontFamily: "Text",
                      fontSize: 80,
                      color: isWaitingOrg ||
                              isWaiting ||
                              (!isWaitingOrg &&
                                  !isWaiting &&
                                  !isNext &&
                                  disable)
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
                          color: isWaitingOrg || isWaiting
                              ? Colors.white70
                              : isPaused
                                  ? Colors.black54
                                  : Colors.white70,
                          blurRadius: isWaitingOrg || isWaiting
                              ? 10
                              : isPaused
                                  ? 5
                                  : 10,
                        ),
                      ],
                    ),
                  ),
                ),
              const Spacer(
                flex: 1,
              ),
              // const SizedBox(
              //   height: 100,
              // ),
            ],
          ),
        ),
      ],
    );

    List<Widget> children = [
      mainArea,
      leaderboard,
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
                    isInGame: true,
                    channel: widget.room,
                  ),
                  QuitButton(
                    name: settingsService.username,
                    onPressed: () {
                      _socketService.sendMessage('quitObserved', null);
                      _socketService.disconnect();
                      _socketService.removeAllListeners();
                      _observerService.resetObs();
                      // quit channel
                      channelService.quitGameChannel(
                          context, widget.room, false, false, false);
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(
                          builder: (context) => HomeScreen(
                              name: FirebaseAuth
                                  .instance.currentUser!.displayName
                                  .toString()),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildAnswerButton(String text, int index) {
    double width = MediaQuery.of(context).size.width;

    Color buttonColor = const Color.fromARGB(215, 255, 255, 255);
    Color borderColor = Colors.black87;
    Color textColor = Colors.black87;

    if (isShowResult) {
      if (choices[index]['isCorrect']) {
        buttonColor = const Color.fromRGBO(12, 230, 164, 0.821);
        borderColor = const Color.fromRGBO(10, 184, 132, 0.82);
      } else {
        bool displayRed = selectedChoices.any((idx) {
          return !choices[idx]["isCorrect"];
        });
        if (displayRed) {
          buttonColor = const Color.fromRGBO(252, 76, 111, 0.771);
          borderColor = const Color.fromARGB(196, 186, 57, 83);
        }
      }
      if (selectedChoices.contains(index)) {
        borderColor = const Color.fromRGBO(79, 129, 216, 1);
      }
    } else {
      if (selectedChoices.contains(index)) {
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
          onPressed: null,
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
                width: !isShowResult ||
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
            onChanged: null,
            maxLength: 200,
            decoration: InputDecoration(
              hintText:
                  GameScreenConsts.get("enterAnswer", settingsService.language),
              border: InputBorder.none,
              counterText: '',
            ),
            enabled: false,
            style: const TextStyle(
              fontFamily: "Text",
              fontSize: 20,
            ),
          ),
          Align(
            alignment: Alignment.bottomRight,
            child: Text(
              '${200 - _textController.text.length}',
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
    int min = widget.questions[questionIndex]['qre']?['lowerBound'] ?? 0;
    int max = widget.questions[questionIndex]['qre']?['upperBound'] ?? 10;
    double marg =
        (widget.questions[questionIndex]['qre']?['margin'] ?? 0) / 100;
    int margin = ((marg / 100) * (max - min)).round();
    int divisions = (max - min);

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          GameScreenConsts.get("valueSelected", settingsService.language),
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
                    onChanged: null,
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

  // organizer //
  Widget buildObsOrg() {
    settingsService = Provider.of<SettingsService>(context);
    double width = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;
    bool isPortrait =
        MediaQuery.of(context).orientation == Orientation.portrait;

    Widget leaderboard = ClassementWidget(
      joueurs: joueurs,
      isResult: false,
      isObserver: true,
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
        : const SizedBox.shrink();

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
            disabled: true,
            onTab: () {},
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
                  disabled: true,
                  onTab: () {},
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
              // affichage conditionnel du graphique ou des réponses des joueurs
              if ((isAllFinish || time == 0) && playerAnswer.isNotEmpty)
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
                                              onPressed: null,
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
                    if ((isAllFinish || time == 0) && playerAnswer.isNotEmpty)
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
              const Spacer(),
              // la question est fini
              if (isAllFinish)
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
                    disabled: true,
                    onTab: () {},
                    text: OrganizerScreenConsts.get(
                        "nextQuestion", settingsService.language),
                    fontSize: 20,
                  ),
                ),
              // derniere question presenter resultat
              if (!disable && isLast)
                Center(
                  child: MyButton(
                    disabled: true,
                    onTab: () {},
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
                padding: const EdgeInsets.only(top: 50),
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
                    isInGame: true,
                    channel: widget.room,
                  ),
                  QuitButton(
                    name: settingsService.username,
                    onPressed: () {
                      _socketService.sendMessage('quitObserved', null);
                      _socketService.disconnect();
                      _socketService.removeAllListeners();
                      _observerService.resetObs();
                      // quit channel
                      channelService.quitGameChannel(
                          context, widget.room, false, false, false);
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(
                          builder: (context) => HomeScreen(
                              name: FirebaseAuth
                                  .instance.currentUser!.displayName
                                  .toString()),
                        ),
                      );
                    },
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
