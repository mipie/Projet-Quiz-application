import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/histogram_consts.dart';
import 'package:provider/provider.dart';

class Histogram extends StatefulWidget {
  final dynamic question;
  final List<dynamic> realData;
  final bool disable;
  const Histogram({
    super.key,
    required this.question,
    required this.realData,
    required this.disable,
  });

  @override
  State<Histogram> createState() => _HistogramState();
}

class _HistogramState extends State<Histogram> {
  SettingsService settingsService = SettingsService();
  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context);
    List<BarChartGroupData> barGroups = [];
    if (widget.question['type'] == 'QCM') {
      // Crée des groupes de barres en fonction du nombre de choix
      for (int i = 0; i < widget.question['choices'].length; i++) {
        barGroups.add(
          BarChartGroupData(
            x: i + 1,
            barRods: [
              BarChartRodData(
                toY: (widget.realData[i])
                    .toDouble(), // Par exemple, hauteur arbitraire
                color: widget.question['choices'][i]["isCorrect"]
                    ? const Color.fromRGBO(12, 230, 164, 0.821)
                    : const Color.fromRGBO(252, 76, 111, 0.771),
                width: 30,
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.zero,
                  top: Radius.circular(5),
                ),
              ),
            ],
          ),
        );
      }
    } else if (widget.question['type'] == 'QRL' && widget.disable) {
      if (widget.realData.length >= 3) {
        for (int i = 0; i < 3; i++) {
          barGroups.add(
            BarChartGroupData(
              x: i + 1,
              barRods: [
                BarChartRodData(
                  toY: (widget.realData[i])
                      .toDouble(), // Par exemple, hauteur arbitraire
                  color: i == 0
                      ? const Color.fromRGBO(252, 76, 111, 0.771)
                      : i == 1
                          ? Color.fromRGBO(255, 255, 0, 0.785)
                          : const Color.fromRGBO(12, 230, 164, 0.821),
                  width: 30,
                  borderRadius: const BorderRadius.vertical(
                    bottom: Radius.zero,
                    top: Radius.circular(5),
                  ),
                ),
              ],
            ),
          );
        }
      }
    } else if (widget.question['type'] == 'QRL' && !widget.disable) {
      for (int i = 0; i < 2; i++) {
        barGroups.add(
          BarChartGroupData(
            x: i + 1,
            barRods: [
              BarChartRodData(
                toY: (widget.realData[i])
                    .toDouble(), // Par exemple, hauteur arbitraire
                color: i == 0
                    ? const Color.fromRGBO(12, 230, 164, 0.821)
                    : const Color.fromRGBO(252, 76, 111, 0.771),
                width: 30,
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.zero,
                  top: Radius.circular(5),
                ),
              ),
            ],
          ),
        );
      }
    } else if (widget.question['type'] == 'QRE') {
      for (int i = 0; i < 3; i++) {
        // print('ds le for: $i');
        barGroups.add(
          BarChartGroupData(
            x: i + 1,
            barRods: [
              BarChartRodData(
                toY: (widget.realData[i]).toDouble(),
                color: i == 0
                    ? const Color.fromRGBO(255, 255, 83, 0.784)
                    : i == 1
                        ? const Color.fromRGBO(12, 230, 164, 0.821)
                        : const Color.fromRGBO(252, 76, 111, 0.771),
                width: 30,
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.zero,
                  top: Radius.circular(5),
                ),
              ),
            ],
          ),
        );
      }
    }

    return BarChart(
      BarChartData(
        backgroundColor: Colors.black12,
        gridData: const FlGridData(show: false),
        borderData:
            FlBorderData(show: true, border: Border.all(color: Colors.black54)),
        barGroups: barGroups,
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, _) {
                return Text(
                  value.toInt().toString(),
                  style: const TextStyle(
                    fontFamily: "Text",
                    color: Colors.black,
                    fontSize: 15,
                    shadows: const [
                      Shadow(
                        color: Colors.white,
                        blurRadius: 10,
                      ),
                    ],
                  ),
                );
              },
              interval: 1,
            ),
          ),
          rightTitles: const AxisTitles(
            sideTitles:
                SideTitles(showTitles: false), // Désactive le côté droit
          ),
          topTitles: const AxisTitles(
            sideTitles:
                SideTitles(showTitles: false), // Désactive les titres en haut
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, _) {
                // Affiche les labels en fonction de labelType
                if (widget.question['type'] == 'QCM') {
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 5),
                    child: Text(
                      value.toInt().toString(), // Affiche 1, 2, 3, 4 pour QCM
                      style: TextStyle(
                        fontFamily: "Text",
                        color: widget.question['choices'][value.toInt() - 1]
                                ["isCorrect"]
                            ? const Color.fromRGBO(9, 121, 87, 1)
                            : const Color.fromRGBO(147, 45, 66, 1),
                        fontSize: 15,
                        shadows: const [
                          Shadow(
                            color: Colors.white,
                            blurRadius: 10,
                          ),
                        ],
                      ),
                    ),
                  );
                } else if (widget.question['type'] == 'QRL' && widget.disable) {
                  switch (value.toInt()) {
                    case 1:
                      return const Text(
                        '0',
                        style: TextStyle(
                          fontFamily: "Text",
                          color: const Color.fromRGBO(147, 45, 66, 1),
                          fontSize: 15,
                          shadows: const [
                            Shadow(
                              color: Colors.white,
                              blurRadius: 10,
                            ),
                          ],
                        ),
                      );
                    case 2:
                      return const Text(
                        '50',
                        style: TextStyle(
                          fontFamily: "Text",
                          color: Color.fromRGBO(255, 255, 0, 0.785),
                          fontSize: 15,
                          shadows: const [
                            Shadow(
                              color: Colors.white,
                              blurRadius: 10,
                            ),
                          ],
                        ),
                      );
                    case 3:
                      return const Text(
                        '100',
                        style: TextStyle(
                          fontFamily: "Text",
                          color: const Color.fromRGBO(9, 121, 87, 1),
                          fontSize: 15,
                          shadows: const [
                            Shadow(
                              color: Colors.white,
                              blurRadius: 10,
                            ),
                          ],
                        ),
                      );
                    default:
                      return const Text('');
                  }
                } else if (widget.question['type'] == 'QRL' &&
                    !widget.disable) {
                  switch (value.toInt()) {
                    case 1:
                      return Text(
                        HistogramConsts.get(
                            "fieldModified", settingsService.language),
                        style: const TextStyle(
                          fontFamily: "Text",
                          color: const Color.fromRGBO(9, 121, 87, 1),
                          shadows: const [
                            Shadow(
                              color: Colors.white,
                              blurRadius: 10,
                            ),
                          ],
                        ),
                      );
                    case 2:
                      return Text(
                        HistogramConsts.get(
                            "fieldNotModified", settingsService.language),
                        style: const TextStyle(
                          fontFamily: "Text",
                          color: const Color.fromRGBO(147, 45, 66, 1),
                          fontSize: 15,
                          shadows: const [
                            Shadow(
                              color: Colors.white,
                              blurRadius: 10,
                            ),
                          ],
                        ),
                      );
                    default:
                      return const Text('');
                  }
                } else if (widget.question['type'] == 'QRE') {
                  double margin = widget.question['qre']['margin'] / 100;
                  int upper = widget.question['qre']['upperBound'];
                  int lower = widget.question['qre']['lowerBound'];
                  int interval = upper - lower;
                  int goodAnswer = widget.question['qre']['goodAnswer'];

                  double upperMargin =
                      (goodAnswer + (margin * interval)) > upper
                          ? upper.toDouble()
                          : (goodAnswer + (margin * interval));

                  double lowerMargin =
                      (goodAnswer + (margin * interval * -1)) < lower
                          ? lower.toDouble()
                          : (goodAnswer + (margin * interval * -1));

                  print("upperMargin : $upperMargin");
                  switch (value.toInt()) {
                    case 1:
                      String acceptedValues = upperMargin.round() -
                                      goodAnswer !=
                                  0 ||
                              lowerMargin.round() - goodAnswer != 0
                          ? "${HistogramConsts.get("acceptedValues", settingsService.language)}[ ${lowerMargin.round()}, ${upperMargin.round()} ]"
                          : HistogramConsts.get(
                              "noMargin", settingsService.language);
                      return Text(
                        acceptedValues,
                        style: const TextStyle(
                          fontFamily: "Text",
                          color: Color.fromRGBO(255, 255, 0, 0.785),
                          fontSize: 15,
                          shadows: const [
                            Shadow(
                              color: Colors.white,
                              blurRadius: 10,
                            ),
                          ],
                        ),
                      );
                    case 2:
                      return Text(
                        "${HistogramConsts.get("goodAnswer", settingsService.language)}$goodAnswer",
                        style: const TextStyle(
                          fontFamily: "Text",
                          color: const Color.fromRGBO(9, 121, 87, 1),
                          fontSize: 15,
                          shadows: const [
                            Shadow(
                              color: Colors.white,
                              blurRadius: 10,
                            ),
                          ],
                        ),
                      );
                    case 3:
                      String badAnswer = upperMargin.round() != 0 ||
                              lowerMargin.round() != 0
                          ? "${HistogramConsts.get("badAnswers", settingsService.language)}] ${lowerMargin.round()}, ${upperMargin.round()} ["
                          : HistogramConsts.get(
                              "badAnswers", settingsService.language);
                      return Text(
                        badAnswer,
                        style: const TextStyle(
                          fontFamily: "Text",
                          color: const Color.fromRGBO(147, 45, 66, 1),
                          fontSize: 15,
                          shadows: const [
                            Shadow(
                              color: Colors.white,
                              blurRadius: 10,
                            ),
                          ],
                        ),
                      );
                    default:
                      return const Text('');
                  }
                } else {
                  return const Text('');
                }
              },
              interval: 1,
            ),
          ),
        ),
      ),
    );
  }
}
