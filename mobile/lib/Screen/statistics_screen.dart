import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/Screen/statistics_screen_consts.dart';
import 'package:mobile/Screen/theme_consts.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Services/statistics_service.dart';
import 'package:provider/provider.dart';

class StatisticsScreen extends StatefulWidget {
  const StatisticsScreen({super.key});

  @override
  State<StatisticsScreen> createState() => StatisticsScreenState();
}

class StatisticsScreenState extends State<StatisticsScreen> {
  StatisticsService statisticsService = StatisticsService();
  SettingsService settingsService = SettingsService();

  bool isLeadOpen = true;
  bool isStatsOpen = false;

  bool isLandscape(BuildContext context) {
    return MediaQuery.of(context).orientation == Orientation.landscape;
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context);

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
                          color: ThemeConsts.get("statisticsHeaderBackground",
                              settingsService.currentTheme),
                          border: Border.all(
                              color: ThemeConsts.get("statisticsHeaderBorder",
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
                              StatisticsScreenConsts.get(
                                  "statistics", settingsService.language),
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
                    Expanded(
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Expanded(
                            child: Container(
                              margin:
                                  const EdgeInsets.symmetric(horizontal: 20),
                              padding: const EdgeInsets.symmetric(
                                  vertical: 20, horizontal: 20),
                              color: Colors.white24,
                              child: Column(
                                children: isStatsOpen
                                    ? [
                                        Text(
                                          StatisticsScreenConsts.get(
                                              "yourStats",
                                              settingsService.language),
                                          style: const TextStyle(
                                            color: Colors.black,
                                            fontFamily: "Text",
                                            fontSize: 23,
                                          ),
                                        ),
                                        const SizedBox(
                                          height: 10,
                                        ),
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceEvenly,
                                          children: [
                                            Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  StatisticsScreenConsts.get(
                                                      "gamesPlayed",
                                                      settingsService.language),
                                                  style: const TextStyle(
                                                    color: Colors.black,
                                                    fontFamily: "Text",
                                                    fontSize: 15,
                                                    shadows: [
                                                      Shadow(
                                                        color: Colors.white,
                                                        blurRadius: 10,
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                Text(
                                                  StatisticsScreenConsts.get(
                                                      "gamesWon",
                                                      settingsService.language),
                                                  style: const TextStyle(
                                                    color: Colors.black,
                                                    fontFamily: "Text",
                                                    fontSize: 15,
                                                    shadows: [
                                                      Shadow(
                                                        color: Colors.white,
                                                        blurRadius: 10,
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                Text(
                                                  StatisticsScreenConsts.get(
                                                      "gamesLosses",
                                                      settingsService.language),
                                                  style: const TextStyle(
                                                    color: Colors.black,
                                                    fontFamily: "Text",
                                                    fontSize: 15,
                                                    shadows: [
                                                      Shadow(
                                                        color: Colors.white,
                                                        blurRadius: 10,
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                Text(
                                                  StatisticsScreenConsts.get(
                                                      "avgGoodAns",
                                                      settingsService.language),
                                                  style: const TextStyle(
                                                    color: Colors.black,
                                                    fontFamily: "Text",
                                                    fontSize: 15,
                                                    shadows: [
                                                      Shadow(
                                                        color: Colors.white,
                                                        blurRadius: 10,
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                Text(
                                                  StatisticsScreenConsts.get(
                                                      "averageTime",
                                                      settingsService.language),
                                                  style: const TextStyle(
                                                    color: Colors.black,
                                                    fontFamily: "Text",
                                                    fontSize: 15,
                                                    shadows: [
                                                      Shadow(
                                                        color: Colors.white,
                                                        blurRadius: 10,
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                            Column(
                                              // StreamBuilder pour les stats de partie
                                              children: [
                                                FutureBuilder(
                                                  future: statisticsService
                                                      .getUserStats(),
                                                  builder: (context, snapshot) {
                                                    if (snapshot.hasError ||
                                                        snapshot.data == null ||
                                                        snapshot
                                                            .data!.isEmpty) {
                                                      return const Center(
                                                        child: Text(
                                                          "-",
                                                          style: TextStyle(
                                                            fontFamily: "Text",
                                                            fontSize: 20,
                                                            color: Colors.black,
                                                          ),
                                                        ),
                                                      );
                                                    }

                                                    Map<String, dynamic>
                                                        statistics =
                                                        snapshot.data!;

                                                    int gamesPlayed =
                                                        statistics['gamesP']!
                                                            .round();
                                                    int gamesWon =
                                                        statistics['gamesW']!
                                                            .round();
                                                    int gamesLost =
                                                        statistics['gamesL']!
                                                            .round();
                                                    num avgGoodAnswers =
                                                        (statistics[
                                                                'averageGoodAnsPerGame']! *
                                                            100);
                                                    int avgTime = statistics[
                                                            'averageTimePerGame']!
                                                        .round();
                                                    int avgMinutes =
                                                        (avgTime / 60).floor();
                                                    int avgSeconds =
                                                        (avgTime % 60).round();
                                                    return Column(
                                                      children: [
                                                        Text(
                                                          gamesPlayed
                                                              .toString(),
                                                          style:
                                                              const TextStyle(
                                                            fontSize: 15,
                                                            fontFamily: "Text",
                                                            shadows: [
                                                              Shadow(
                                                                color: Colors
                                                                    .white,
                                                                blurRadius: 10,
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                        Text(
                                                          gamesWon.toString(),
                                                          style:
                                                              const TextStyle(
                                                            fontSize: 15,
                                                            fontFamily: "Text",
                                                            shadows: [
                                                              Shadow(
                                                                color: Colors
                                                                    .white,
                                                                blurRadius: 10,
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                        Text(
                                                          gamesLost.toString(),
                                                          style:
                                                              const TextStyle(
                                                            fontSize: 15,
                                                            fontFamily: "Text",
                                                            shadows: [
                                                              Shadow(
                                                                color: Colors
                                                                    .white,
                                                                blurRadius: 10,
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                        Text(
                                                          "${avgGoodAnswers.toStringAsFixed(2)} %",
                                                          style:
                                                              const TextStyle(
                                                            fontSize: 15,
                                                            fontFamily: "Text",
                                                            shadows: [
                                                              Shadow(
                                                                color: Colors
                                                                    .white,
                                                                blurRadius: 10,
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                        Text(
                                                          "${avgMinutes}m ${avgSeconds}s",
                                                          style:
                                                              const TextStyle(
                                                            fontSize: 15,
                                                            fontFamily: "Text",
                                                            shadows: [
                                                              Shadow(
                                                                color: Colors
                                                                    .white,
                                                                blurRadius: 10,
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ],
                                                    );
                                                  },
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 30),
                                        Text(
                                          StatisticsScreenConsts.get(
                                              "gamesHistory",
                                              settingsService.language),
                                          style: const TextStyle(
                                            color: Colors.black,
                                            fontFamily: "Text",
                                            fontSize: 23,
                                          ),
                                        ),
                                        const SizedBox(
                                          height: 10,
                                        ),
                                        Container(
                                          padding: const EdgeInsets.only(
                                            left: 20,
                                            right: 0,
                                          ),
                                          child: Row(
                                            children: [
                                              SizedBox(
                                                width: width *
                                                    (isLandscape(context)
                                                        ? 0.1
                                                        : 0.125),
                                                child: Text(
                                                  StatisticsScreenConsts.get(
                                                      "gameName",
                                                      settingsService.language),
                                                  style: const TextStyle(
                                                    color: Colors.black,
                                                    fontFamily: "Text",
                                                    fontSize: 15,
                                                  ),
                                                ),
                                              ),
                                              Spacer(
                                                flex: isLandscape(context)
                                                    ? 4
                                                    : 3,
                                              ),
                                              SizedBox(
                                                width: width *
                                                    (isLandscape(context)
                                                        ? 0.1
                                                        : 0.08),
                                                child: Text(
                                                  StatisticsScreenConsts.get(
                                                      "hasWon",
                                                      settingsService.language),
                                                  textAlign: TextAlign.center,
                                                  style: const TextStyle(
                                                    color: Colors.black,
                                                    fontFamily: "Text",
                                                    fontSize: 15,
                                                  ),
                                                ),
                                              ),
                                              Spacer(
                                                flex: isLandscape(context)
                                                    ? 3
                                                    : 2,
                                              ),
                                              SizedBox(
                                                width: width *
                                                    (isLandscape(context)
                                                        ? 0.15
                                                        : 0.25),
                                                child: Text(
                                                  StatisticsScreenConsts.get(
                                                      "date",
                                                      settingsService.language),
                                                  textAlign: TextAlign.center,
                                                  style: const TextStyle(
                                                    color: Colors.black,
                                                    fontFamily: "Text",
                                                    fontSize: 15,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const Divider(
                                          color: Colors.black,
                                        ),
                                        Expanded(
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 20),
                                            child: FutureBuilder(
                                              future: statisticsService
                                                  .getGamesHistory(),
                                              builder: (context, snapshot) {
                                                if (snapshot.hasError ||
                                                    snapshot.data == null) {
                                                  return Align(
                                                    alignment: Alignment.center,
                                                    child: Text(
                                                      StatisticsScreenConsts
                                                          .get(
                                                              'error',
                                                              settingsService
                                                                  .language),
                                                      style: const TextStyle(
                                                        fontFamily: "Text",
                                                        fontSize: 15,
                                                        color: Color.fromARGB(
                                                            255, 113, 6, 6),
                                                        shadows: [
                                                          Shadow(
                                                            color: Colors.white,
                                                            blurRadius: 20,
                                                          )
                                                        ],
                                                      ),
                                                    ),
                                                  );
                                                }
                                                if (snapshot.connectionState ==
                                                    ConnectionState.waiting) {
                                                  return const CircularProgressIndicator(
                                                    color: Colors.black,
                                                  );
                                                }
                                                if (snapshot.data!.isEmpty) {
                                                  return Align(
                                                    alignment: Alignment.center,
                                                    child: Text(
                                                      StatisticsScreenConsts
                                                          .get(
                                                              'noData',
                                                              settingsService
                                                                  .language),
                                                      style: const TextStyle(
                                                        fontFamily: "Text",
                                                        fontSize: 15,
                                                        color: Colors.black,
                                                        shadows: [
                                                          Shadow(
                                                            color: Colors.white,
                                                            blurRadius: 20,
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  );
                                                }

                                                List<Map<String, dynamic>>
                                                    gamesHistory =
                                                    snapshot.data!;

                                                return SizedBox(
                                                  height: height * 0.298,
                                                  child: ListView.builder(
                                                    itemCount:
                                                        gamesHistory.length,
                                                    physics:
                                                        const BouncingScrollPhysics(),
                                                    itemBuilder:
                                                        (context, index) {
                                                      final gameEntry =
                                                          gamesHistory[index];

                                                      String gameName =
                                                          gameEntry[
                                                                  'gameName'] ??
                                                              'Unknown Game';
                                                      bool isWinner = gameEntry[
                                                              'isWinner'] ??
                                                          false;
                                                      String timestamp =
                                                          'Unknown Date';

                                                      if (gameEntry['date'] !=
                                                              null &&
                                                          gameEntry['date']
                                                              is Timestamp) {
                                                        timestamp = DateFormat(
                                                                'yyyy-MM-dd HH:mm:ss')
                                                            .format(
                                                          gameEntry['date']
                                                              .toDate()
                                                              .subtract(
                                                                const Duration(
                                                                    hours: 5),
                                                              ),
                                                        );
                                                      }

                                                      return Column(
                                                        children: [
                                                          Padding(
                                                            padding:
                                                                const EdgeInsets
                                                                    .symmetric(
                                                              horizontal: 10,
                                                            ),
                                                            child: Row(
                                                              children: [
                                                                SizedBox(
                                                                  width: width *
                                                                      (isLandscape(
                                                                              context)
                                                                          ? 0.1
                                                                          : 0.08),
                                                                  child: Text(
                                                                    gameName,
                                                                    overflow:
                                                                        TextOverflow
                                                                            .ellipsis,
                                                                    style:
                                                                        const TextStyle(
                                                                      color: Colors
                                                                          .black,
                                                                      fontFamily:
                                                                          "Text",
                                                                      fontSize:
                                                                          15,
                                                                      shadows: [
                                                                        Shadow(
                                                                          color:
                                                                              Colors.white,
                                                                          blurRadius:
                                                                              20,
                                                                        ),
                                                                      ],
                                                                    ),
                                                                  ),
                                                                ),
                                                                const Spacer(),
                                                                SizedBox(
                                                                  width: width *
                                                                      (isLandscape(
                                                                              context)
                                                                          ? 0.1
                                                                          : 0.08),
                                                                  child: Text(
                                                                    textAlign:
                                                                        TextAlign
                                                                            .center,
                                                                    isWinner
                                                                        ? StatisticsScreenConsts.get(
                                                                            'win',
                                                                            settingsService
                                                                                .language)
                                                                        : StatisticsScreenConsts.get(
                                                                            'loss',
                                                                            settingsService.language),
                                                                    style:
                                                                        const TextStyle(
                                                                      color: Colors
                                                                          .black,
                                                                      fontFamily:
                                                                          "Text",
                                                                      fontSize:
                                                                          15,
                                                                      shadows: [
                                                                        Shadow(
                                                                          color:
                                                                              Colors.white,
                                                                          blurRadius:
                                                                              20,
                                                                        ),
                                                                      ],
                                                                    ),
                                                                  ),
                                                                ),
                                                                const Spacer(),
                                                                SizedBox(
                                                                  width: width *
                                                                      (isLandscape(
                                                                              context)
                                                                          ? 0.1
                                                                          : 0.17),
                                                                  child: Text(
                                                                    timestamp,
                                                                    style:
                                                                        const TextStyle(
                                                                      color: Colors
                                                                          .black,
                                                                      fontFamily:
                                                                          "Text",
                                                                      fontSize:
                                                                          15,
                                                                      shadows: [
                                                                        Shadow(
                                                                          color:
                                                                              Colors.white,
                                                                          blurRadius:
                                                                              20,
                                                                        ),
                                                                      ],
                                                                    ),
                                                                  ),
                                                                ),
                                                              ],
                                                            ),
                                                          ),
                                                          const SizedBox(
                                                              width: 10),
                                                          if (index !=
                                                              gamesHistory
                                                                      .length -
                                                                  1)
                                                            const Divider(
                                                              color:
                                                                  Colors.black,
                                                              thickness: 0.5,
                                                            ),
                                                        ],
                                                      );
                                                    },
                                                  ),
                                                );
                                              },
                                            ),
                                          ),
                                        ),
                                      ]
                                    : isLeadOpen
                                        ? [
                                            Text(
                                              StatisticsScreenConsts.get(
                                                  "leaderboard",
                                                  settingsService.language),
                                              style: const TextStyle(
                                                color: Colors.black,
                                                fontFamily: "Text",
                                                fontSize: 23,
                                              ),
                                            ),
                                            const SizedBox(height: 20),
                                            Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Padding(
                                                  padding:
                                                      const EdgeInsets.only(
                                                          left: 8),
                                                  child: SizedBox(
                                                    width: width * 0.07,
                                                    child: Text(
                                                      StatisticsScreenConsts
                                                          .get(
                                                              "rank",
                                                              settingsService
                                                                  .language),
                                                      textAlign:
                                                          TextAlign.center,
                                                      style: const TextStyle(
                                                        color: Colors.black,
                                                        fontFamily: "Text",
                                                        fontSize: 15,
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                                SizedBox(
                                                  width: width * 0.1,
                                                  child: Text(
                                                    StatisticsScreenConsts.get(
                                                        "username",
                                                        settingsService
                                                            .language),
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    textAlign: TextAlign.center,
                                                    style: const TextStyle(
                                                      color: Colors.black,
                                                      fontFamily: "Text",
                                                      fontSize: 15,
                                                    ),
                                                  ),
                                                ),
                                                SizedBox(
                                                  width: width * 0.07,
                                                  child: Text(
                                                    StatisticsScreenConsts.get(
                                                        "nbPoints",
                                                        settingsService
                                                            .language),
                                                    textAlign: TextAlign.center,
                                                    style: const TextStyle(
                                                      color: Colors.black,
                                                      fontFamily: "Text",
                                                      fontSize: 15,
                                                    ),
                                                  ),
                                                ),
                                                SizedBox(
                                                  width: width * 0.07,
                                                  child: Text(
                                                    StatisticsScreenConsts.get(
                                                        "nbWins",
                                                        settingsService
                                                            .language),
                                                    textAlign: TextAlign.center,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    style: const TextStyle(
                                                      color: Colors.black,
                                                      fontFamily: "Text",
                                                      fontSize: 15,
                                                    ),
                                                  ),
                                                ),
                                                SizedBox(
                                                  width: width * 0.07,
                                                  child: Text(
                                                    StatisticsScreenConsts.get(
                                                        "nbTies",
                                                        settingsService
                                                            .language),
                                                    textAlign: TextAlign.center,
                                                    style: const TextStyle(
                                                      color: Colors.black,
                                                      fontFamily: "Text",
                                                      fontSize: 15,
                                                    ),
                                                  ),
                                                ),
                                                Padding(
                                                  padding:
                                                      const EdgeInsets.only(
                                                          right: 15),
                                                  child: SizedBox(
                                                    width: width * 0.07,
                                                    child: Text(
                                                      StatisticsScreenConsts
                                                          .get(
                                                              "nbLosses",
                                                              settingsService
                                                                  .language),
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                      textAlign:
                                                          TextAlign.center,
                                                      style: const TextStyle(
                                                        color: Colors.black,
                                                        fontFamily: "Text",
                                                        fontSize: 15,
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const Divider(
                                              color: Colors.black,
                                            ),
                                            Container(
                                              height: height *
                                                  (isLandscape(context)
                                                      ? 0.49
                                                      : 0.62),
                                              width: width * 0.7,
                                              decoration: const BoxDecoration(
                                                color: Colors.transparent,
                                              ),
                                              child: StreamBuilder(
                                                stream: statisticsService
                                                    .getRankedLeaderboard(),
                                                builder: (context, snapshot) {
                                                  if (snapshot
                                                          .connectionState ==
                                                      ConnectionState.waiting) {
                                                    return const Center(
                                                      child:
                                                          CircularProgressIndicator(
                                                              color:
                                                                  Colors.black),
                                                    );
                                                  }
                                                  if (snapshot.hasError) {
                                                    return Center(
                                                      child: Text(
                                                        StatisticsScreenConsts
                                                            .get(
                                                                'error',
                                                                settingsService
                                                                    .language),
                                                        textAlign:
                                                            TextAlign.center,
                                                        style: const TextStyle(
                                                          fontFamily: "Text",
                                                          fontSize: 20,
                                                          color: Color.fromARGB(
                                                              255, 113, 6, 6),
                                                          shadows: [
                                                            Shadow(
                                                              color:
                                                                  Colors.white,
                                                              blurRadius: 20,
                                                            )
                                                          ],
                                                        ),
                                                      ),
                                                    );
                                                  }
                                                  final leaderboard =
                                                      snapshot.data!;
                                                  return ListView.builder(
                                                    itemCount:
                                                        leaderboard.length,
                                                    itemBuilder:
                                                        (context, index) {
                                                      final userRanking =
                                                          leaderboard[index];

                                                      String username =
                                                          userRanking[
                                                                  "username"] ??
                                                              "-";
                                                      int points = userRanking[
                                                          "rankingPoints"];

                                                      bool isDiamond =
                                                          points >= 150;
                                                      bool isGold =
                                                          points >= 100;
                                                      bool isSilver =
                                                          points >= 60;
                                                      bool isBronze =
                                                          points >= 20;

                                                      String victories =
                                                          userRanking[
                                                                  "rankingW"]
                                                              .toString();

                                                      String ties = userRanking[
                                                              "rankingD"]
                                                          .toString();

                                                      String defeats =
                                                          userRanking[
                                                                  "rankingL"]
                                                              .toString();

                                                      return Container(
                                                        padding: EdgeInsets.symmetric(
                                                            vertical: isDiamond
                                                                ? 11
                                                                : isGold
                                                                    ? 9
                                                                    : isSilver
                                                                        ? 8
                                                                        : isBronze
                                                                            ? 7
                                                                            : 5),
                                                        margin: EdgeInsets
                                                            .symmetric(
                                                          vertical: index == 0
                                                              ? 5
                                                              : 2.5,
                                                          horizontal: 5,
                                                        ),
                                                        decoration:
                                                            BoxDecoration(
                                                          image: !isDiamond
                                                              ? null
                                                              : const DecorationImage(
                                                                  image: AssetImage(
                                                                      "assets/diamondRanking.jpg"),
                                                                  fit: BoxFit
                                                                      .cover,
                                                                ),
                                                          color: isDiamond
                                                              ? Colors
                                                                  .transparent
                                                              // const Color(
                                                              // 0xFFD6F5E9)
                                                              : isGold
                                                                  ? const Color(
                                                                      0xFFFFD700)
                                                                  : isSilver
                                                                      ? const Color(
                                                                          0xFFC0C0C0)
                                                                      : isBronze
                                                                          ? const Color
                                                                              .fromARGB(
                                                                              255,
                                                                              205,
                                                                              128,
                                                                              50)
                                                                          : Colors
                                                                              .white30,
                                                          borderRadius:
                                                              BorderRadius.all(
                                                            Radius.circular(
                                                                isDiamond ||
                                                                        isGold ||
                                                                        isSilver ||
                                                                        isBronze
                                                                    ? 10
                                                                    : 0),
                                                          ),
                                                          border: Border.all(
                                                              color: isDiamond
                                                                  ? Colors
                                                                      .white70
                                                                  : isGold
                                                                      ? const Color
                                                                          .fromARGB(
                                                                          255,
                                                                          255,
                                                                          228,
                                                                          77)
                                                                      : isSilver
                                                                          ? const Color
                                                                              .fromARGB(
                                                                              255,
                                                                              226,
                                                                              226,
                                                                              226)
                                                                          : isBronze
                                                                              ? const Color.fromARGB(255, 211, 141,
                                                                                  72)
                                                                              : Colors
                                                                                  .white70,
                                                              width: isDiamond ||
                                                                      isGold
                                                                  ? 3
                                                                  : isSilver ||
                                                                          isBronze
                                                                      ? 2
                                                                      : 1),
                                                          boxShadow: [
                                                            BoxShadow(
                                                              color: isDiamond ||
                                                                      isGold ||
                                                                      isSilver ||
                                                                      isBronze
                                                                  ? Colors.black
                                                                  : Colors
                                                                      .transparent,
                                                              blurRadius: 4,
                                                            ),
                                                          ],
                                                        ),
                                                        child: Row(
                                                          mainAxisAlignment:
                                                              MainAxisAlignment
                                                                  .spaceBetween,
                                                          children: [
                                                            Padding(
                                                              padding:
                                                                  const EdgeInsets
                                                                      .only(
                                                                      left: 0),
                                                              child: SizedBox(
                                                                width: width *
                                                                    0.07,
                                                                child: Text(
                                                                  "${index + 1}",
                                                                  textAlign:
                                                                      TextAlign
                                                                          .center,
                                                                  style:
                                                                      const TextStyle(
                                                                    fontFamily:
                                                                        "Text",
                                                                    fontSize:
                                                                        18,
                                                                  ),
                                                                ),
                                                              ),
                                                            ),
                                                            SizedBox(
                                                              width:
                                                                  width * 0.1,
                                                              child: Text(
                                                                "${username}",
                                                                style:
                                                                    const TextStyle(
                                                                  fontFamily:
                                                                      "Text",
                                                                  fontSize: 18,
                                                                ),
                                                              ),
                                                            ),
                                                            SizedBox(
                                                              width:
                                                                  width * 0.07,
                                                              child: Text(
                                                                "${points}",
                                                                textAlign:
                                                                    TextAlign
                                                                        .center,
                                                                style:
                                                                    const TextStyle(
                                                                  fontFamily:
                                                                      "Text",
                                                                  fontSize: 18,
                                                                ),
                                                              ),
                                                            ),
                                                            SizedBox(
                                                              width:
                                                                  width * 0.07,
                                                              child: Text(
                                                                "${victories}",
                                                                textAlign:
                                                                    TextAlign
                                                                        .center,
                                                                style:
                                                                    const TextStyle(
                                                                  fontFamily:
                                                                      "Text",
                                                                  fontSize: 18,
                                                                ),
                                                              ),
                                                            ),
                                                            SizedBox(
                                                              width:
                                                                  width * 0.07,
                                                              child: Text(
                                                                "${ties}",
                                                                textAlign:
                                                                    TextAlign
                                                                        .center,
                                                                style:
                                                                    const TextStyle(
                                                                  fontFamily:
                                                                      "Text",
                                                                  fontSize: 18,
                                                                ),
                                                              ),
                                                            ),
                                                            Padding(
                                                              padding:
                                                                  const EdgeInsets
                                                                      .only(
                                                                      right:
                                                                          10),
                                                              child: SizedBox(
                                                                width: width *
                                                                    0.07,
                                                                child: Text(
                                                                  "${defeats}",
                                                                  textAlign:
                                                                      TextAlign
                                                                          .center,
                                                                  style:
                                                                      const TextStyle(
                                                                    fontFamily:
                                                                        "Text",
                                                                    fontSize:
                                                                        18,
                                                                  ),
                                                                ),
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      );
                                                    },
                                                  );
                                                },
                                              ),
                                            ),
                                          ]
                                        : [const SizedBox.shrink()],
                              ),
                            ),
                          ),
                          Positioned(
                            left: 0,
                            child: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: isStatsOpen
                                    ? Colors.black
                                    : Colors.transparent, // Black background
                                shape: BoxShape.circle, // Circular shape
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black
                                        .withOpacity(isStatsOpen ? 0.4 : 0),
                                    spreadRadius: 2,
                                    blurRadius: 5,
                                    offset: const Offset(
                                        0, 3), // Shadow positioning
                                  ),
                                ],
                              ),
                              child: IconButton(
                                onPressed: () {
                                  if (isStatsOpen) {
                                    isStatsOpen = false;
                                    isLeadOpen = true;
                                    setState(() {});
                                  }
                                },
                                icon: Icon(
                                  Icons.arrow_back, // Forward arrow icon
                                  color: isStatsOpen
                                      ? Colors.white
                                      : Colors
                                          .transparent, // White color for the icon
                                ),
                              ),
                            ),
                          ),
                          Positioned(
                            right: 0,
                            child: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: isLeadOpen
                                    ? Colors.black
                                    : Colors.transparent, // Black background
                                shape: BoxShape.circle, // Circular shape
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black
                                        .withOpacity(isLeadOpen ? 0.4 : 0),
                                    spreadRadius: 2,
                                    blurRadius: 5,
                                    offset: Offset(0, 3), // Shadow positioning
                                  ),
                                ],
                              ),
                              child: IconButton(
                                onPressed: () {
                                  if (isLeadOpen) {
                                    isLeadOpen = false;
                                    isStatsOpen = true;
                                    setState(() {});
                                  }
                                },
                                icon: Icon(
                                  Icons.arrow_forward, // Forward arrow icon
                                  color: isLeadOpen
                                      ? Colors.white
                                      : Colors
                                          .transparent, // White color for the icon
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
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
