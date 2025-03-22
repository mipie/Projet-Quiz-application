import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:mobile/Services/observer_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Sockets/socket_service.dart';
import 'package:mobile/Widget/classement_joueurs_consts.dart';
import 'package:provider/provider.dart';

class ClassementWidget extends StatefulWidget {
  final List<dynamic> joueurs;
  final bool isResult;
  final bool isObserver;

  const ClassementWidget(
      {super.key,
      required this.joueurs,
      required this.isResult,
      required this.isObserver});

  @override
  State<ClassementWidget> createState() => _ClassementWidgetState();
}

class _ClassementWidgetState extends State<ClassementWidget> {
  final SocketService _socketService = SocketService();
  SettingsService settingsService = SettingsService();
  ObserverService _observerService = ObserverService();
  // Variables pour stocker l'état de tri
  String sortBy = 'points'; // Critère de tri par défaut
  bool isDescending = true; // Ordre de tri par défaut
  final ScrollController _scrollController = ScrollController();

  // Fonction pour trier les joueurs
  List<dynamic> getSortedPlayers() {
    List<dynamic> joueursTries = List.from(widget.joueurs)
        .where((joueur) => joueur['name'] != 'Organisateur')
        .toList();

    joueursTries.sort((a, b) {
      int getStateValue(dynamic joueur) {
        if (joueur['isSurrender'] == true) return 3; // Dernier groupe
        if (joueur['isFinish'] == true) return 1; // Premier groupe
        if (joueur['isInteract'] == true) return 2; // Deuxième groupe
        return 4; // Inactif ou autres
      }

      int comparison;
      switch (sortBy) {
        case 'etat':
          comparison = getStateValue(a).compareTo(getStateValue(b));
          if (comparison == 0) {
            comparison = (b['score'] as int)
                .compareTo(a['score'] as int); // Ordre décroissant des points
            return comparison;
          }
          break;
        case 'name':
          comparison = (a['name'] as String).compareTo(b['name'] as String);
          break;
        case 'points':
          comparison = (b['score'] as int).compareTo(a['score'] as int);
          break;
        case 'bonus':
          comparison = (b['bonus'] as int).compareTo(a['bonus'] as int);
          break;
        default:
          comparison = 0;
      }
      return isDescending ? comparison : -comparison;
    });

    return joueursTries;
  }

  @override
  void dispose() {
    _scrollController.dispose(); // Dispose the controller to free resources
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context);
    bool isPortrait =
        MediaQuery.of(context).orientation == Orientation.portrait;
    double width = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;
    List<dynamic> joueursTries = getSortedPlayers();
    // print("joueursTries : ${joueursTries}");

    // return Flexible(
    //   child: Container(
    //     width: width *
    //         (widget.isResult
    //             ? 1
    //             : isPortrait
    //                 ? 0.5
    //                 : 0.337),
    //     height: height * (isPortrait ? 0.5 : 0.9),
    //     padding: const EdgeInsets.all(16.0),
    //     decoration: const BoxDecoration(
    //       color: Colors.black12,
    //     ),
    //     child: Column(
    //       crossAxisAlignment: CrossAxisAlignment.center,
    //       children: [
    //         if (widget.isResult && !isPortrait)
    //           const SizedBox(
    //             height: 25,
    //           ),
    //         Padding(
    //           padding: const EdgeInsets.only(top: 10, bottom: 20),
    //           child: Text(
    //             // Lang
    //             ClassementWidgetConsts.get(
    //                 "leaderboard", settingsService.language),
    //             style: const TextStyle(
    //               fontSize: 35,
    //               fontFamily: "Text",
    //               shadows: [
    //                 Shadow(
    //                   color: Colors.white,
    //                   blurRadius: 20,
    //                 ),
    //               ],
    //             ),
    //           ),
    //         ),
    //         Container(
    //           // width: width * (isPortrait ? 0.45 : 0.35),
    //           height: height *
    //               (widget.isResult & isPortrait
    //                   ? 0.25
    //                   : isPortrait
    //                       ? 0.33
    //                       : widget.isResult
    //                           ? 0.33
    //                           : 0.33),
    //           // child: SingleChildScrollView(
    //           child: Column(
    //             children: [
    //               Table(
    //                 columnWidths: {
    //                   0: const FlexColumnWidth(0.7),
    //                   1: const FlexColumnWidth(1),
    //                   2: const FlexColumnWidth(0.5),
    //                   3: const FlexColumnWidth(0.5),
    //                   if (!widget.isResult) 4: const FlexColumnWidth(0.5),
    //                 },
    //                 children: [
    //                   TableRow(
    //                     decoration: const BoxDecoration(
    //                       border: Border(
    //                         bottom: BorderSide(
    //                           color: Colors.black,
    //                           width: 3,
    //                         ),
    //                       ),
    //                     ),
    //                     children: [
    //                       GestureDetector(
    //                         onTap: widget.isResult
    //                             ? null
    //                             : () {
    //                                 setState(() {
    //                                   sortBy = 'etat';
    //                                   isDescending = !isDescending;
    //                                 });
    //                               },
    //                         child: Container(
    //                           padding: const EdgeInsets.symmetric(
    //                             vertical: 10,
    //                           ),
    //                           child: Row(
    //                             mainAxisAlignment: MainAxisAlignment.center,
    //                             children: [
    //                               Text(
    //                                 // Lang
    //                                 widget.isResult
    //                                     ? ClassementWidgetConsts.get(
    //                                         "place", settingsService.language)
    //                                     : ClassementWidgetConsts.get(
    //                                         "state", settingsService.language),

    //                                 style: const TextStyle(
    //                                   fontSize: 15,
    //                                   fontFamily: "Text",
    //                                   shadows: [
    //                                     Shadow(
    //                                       color: Colors.white,
    //                                       blurRadius: 20,
    //                                     ),
    //                                   ],
    //                                 ),
    //                               ),
    //                               if (sortBy == 'etat')
    //                                 Icon(
    //                                   !isDescending
    //                                       ? FontAwesomeIcons.arrowDown
    //                                       : FontAwesomeIcons.arrowUp,
    //                                   size: 14,
    //                                 ),
    //                             ],
    //                           ),
    //                         ),
    //                       ),
    //                       GestureDetector(
    //                         onTap: widget.isResult
    //                             ? null
    //                             : () {
    //                                 setState(() {
    //                                   sortBy = 'name';
    //                                   isDescending = !isDescending;
    //                                 });
    //                               },
    //                         child: Container(
    //                           padding: EdgeInsets.only(
    //                             left: width * 0.009,
    //                             top: 10,
    //                             bottom: 10,
    //                           ),
    //                           child: Row(
    //                             children: [
    //                               Text(
    //                                 // Lang
    //                                 ClassementWidgetConsts.get(
    //                                     "players", settingsService.language),
    //                                 overflow: TextOverflow.ellipsis,
    //                                 style: const TextStyle(
    //                                   fontSize: 15,
    //                                   fontFamily: "Text",
    //                                   shadows: [
    //                                     Shadow(
    //                                       color: Colors.white,
    //                                       blurRadius: 20,
    //                                     ),
    //                                   ],
    //                                 ),
    //                               ),
    //                               if (sortBy == 'name')
    //                                 Icon(
    //                                   !isDescending
    //                                       ? FontAwesomeIcons.arrowDown
    //                                       : FontAwesomeIcons.arrowUp,
    //                                   size: 14,
    //                                 ),
    //                             ],
    //                           ),
    //                         ),
    //                       ),
    //                       GestureDetector(
    //                         onTap: widget.isResult
    //                             ? null
    //                             : () {
    //                                 setState(() {
    //                                   sortBy = 'points';
    //                                   isDescending = !isDescending;
    //                                 });
    //                               },
    //                         child: Container(
    //                           padding: const EdgeInsets.symmetric(
    //                             vertical: 10,
    //                           ),
    //                           child: Row(
    //                             mainAxisAlignment: MainAxisAlignment.center,
    //                             children: [
    //                               const Text(
    //                                 // Lang
    //                                 'Points',
    //                                 style: TextStyle(
    //                                   fontSize: 15,
    //                                   fontFamily: "Text",
    //                                   shadows: [
    //                                     Shadow(
    //                                       color: Colors.white,
    //                                       blurRadius: 20,
    //                                     ),
    //                                   ],
    //                                 ),
    //                               ),
    //                               if (sortBy == 'points')
    //                                 Icon(
    //                                   !isDescending
    //                                       ? FontAwesomeIcons.arrowDown
    //                                       : FontAwesomeIcons.arrowUp,
    //                                   size: 14,
    //                                 ),
    //                             ],
    //                           ),
    //                         ),
    //                       ),
    //                       GestureDetector(
    //                         onTap: widget.isResult
    //                             ? null
    //                             : () {
    //                                 setState(() {
    //                                   sortBy = 'bonus';
    //                                   isDescending = !isDescending;
    //                                 });
    //                               },
    //                         child: Container(
    //                           padding: const EdgeInsets.symmetric(
    //                             vertical: 10,
    //                           ),
    //                           child: Row(
    //                             mainAxisAlignment: MainAxisAlignment.center,
    //                             children: [
    //                               const Text(
    //                                 // Lang
    //                                 'Bonus',
    //                                 style: TextStyle(
    //                                   fontSize: 15,
    //                                   fontFamily: "Text",
    //                                   shadows: [
    //                                     Shadow(
    //                                       color: Colors.white,
    //                                       blurRadius: 20,
    //                                     ),
    //                                   ],
    //                                 ),
    //                               ),
    //                               if (sortBy == 'bonus')
    //                                 Icon(
    //                                   !isDescending
    //                                       ? FontAwesomeIcons.arrowDown
    //                                       : FontAwesomeIcons.arrowUp,
    //                                   size: 14,
    //                                 ),
    //                             ],
    //                           ),
    //                         ),
    //                       ),
    //                       if (!widget.isResult && !widget.isObserver)
    //                         GestureDetector(
    //                           onTap: widget.isResult
    //                               ? null
    //                               : () {
    //                                   bool isOneNotMuted = false;
    //                                   for (var joueur in joueursTries) {
    //                                     if (!joueur['isMute']) {
    //                                       isOneNotMuted = true;
    //                                       joueur['isMute'] = true;
    //                                       _socketService.sendMessage(
    //                                           'mutePlayer', joueur['name']);
    //                                     }
    //                                   }
    //                                   if (!isOneNotMuted) {
    //                                     for (var joueur in joueursTries) {
    //                                       joueur['isMute'] = false;
    //                                       _socketService.sendMessage(
    //                                           'mutePlayer', joueur['name']);
    //                                     }
    //                                   }
    //                                   setState(() {});
    //                                 },
    //                           child: Container(
    //                             padding: const EdgeInsets.symmetric(
    //                               vertical: 10,
    //                             ),
    //                             child: const Center(
    //                               child: Text(
    //                                 // Lang
    //                                 'Chat',
    //                                 style: TextStyle(
    //                                   fontSize: 15,
    //                                   fontFamily: "Text",
    //                                   shadows: [
    //                                     Shadow(
    //                                       color: Colors.white,
    //                                       blurRadius: 20,
    //                                     ),
    //                                   ],
    //                                 ),
    //                               ),
    //                             ),
    //                           ),
    //                         ),
    //                       if (!widget.isResult && widget.isObserver)
    //                         GestureDetector(
    //                           child: Container(
    //                             padding: const EdgeInsets.symmetric(
    //                               vertical: 10,
    //                             ),
    //                             child: const Row(
    //                               mainAxisAlignment: MainAxisAlignment.center,
    //                               children: [
    //                                 Text(
    //                                   // Lang
    //                                   'Vue',
    //                                   style: TextStyle(
    //                                     fontSize: 15,
    //                                     fontFamily: "Text",
    //                                     shadows: [
    //                                       Shadow(
    //                                         color: Colors.white,
    //                                         blurRadius: 20,
    //                                       ),
    //                                     ],
    //                                   ),
    //                                 ),
    //                               ],
    //                             ),
    //                           ),
    //                         ),
    //                     ],
    //                   ),
    //                 ],
    //               ),
    //               Table(
    //                 columnWidths: {
    //                   0: const FlexColumnWidth(0.7),
    //                   1: const FlexColumnWidth(1),
    //                   2: const FlexColumnWidth(0.5),
    //                   3: const FlexColumnWidth(0.5),
    //                   if (!widget.isResult && !widget.isObserver)
    //                     4: const FlexColumnWidth(0.5),
    //                   if (!widget.isResult && widget.isObserver)
    //                     4: const FlexColumnWidth(0.5),
    //                 },
    //                 children: joueursTries.asMap().entries.expand((entry) {
    //                   dynamic joueur = entry.value;
    //                   int index = entry.key + 1; // Classement commence à 1

    //                   List<TableRow> rows = [];
    //                   double? sizedBoxHeight = !widget.isResult
    //                       ? 0
    //                       : index == 1
    //                           ? 12
    //                           : index == 2
    //                               ? 10
    //                               : index == 3
    //                                   ? 8
    //                                   : 0;
    //                   if (widget.isResult && index <= 4) {
    //                     rows.add(
    //                       TableRow(
    //                         children: [
    //                           SizedBox(
    //                             height: sizedBoxHeight,
    //                           ),
    //                           SizedBox(
    //                             height: sizedBoxHeight,
    //                           ),
    //                           SizedBox(
    //                             height: sizedBoxHeight,
    //                           ),
    //                           SizedBox(
    //                             height: sizedBoxHeight,
    //                           ),
    //                           if (!widget.isResult)
    //                             SizedBox(
    //                               height: sizedBoxHeight,
    //                             ),
    //                         ],
    //                       ),
    //                     );
    //                   }

    //                   rows.add(
    //                     TableRow(
    //                       decoration: BoxDecoration(
    //                         color: !widget.isResult
    //                             ? Colors.transparent
    //                             : index == 1
    //                                 ? const Color(0xFFFFD700)
    //                                 : index == 2
    //                                     ? const Color(0xFFC0C0C0)
    //                                     : index == 3
    //                                         ? const Color.fromARGB(
    //                                             255, 205, 128, 50)
    //                                         : Colors.transparent,
    //                         borderRadius: BorderRadius.all(
    //                           Radius.circular(!widget.isResult
    //                               ? 0
    //                               : index == 1
    //                                   ? 12
    //                                   : index == 2
    //                                       ? 10
    //                                       : index == 3
    //                                           ? 8
    //                                           : 0),
    //                         ),
    //                         border: Border(
    //                           top: BorderSide(
    //                             color: !widget.isResult
    //                                 ? Colors.transparent
    //                                 : index == 1
    //                                     ? const Color.fromARGB(
    //                                         255, 255, 228, 77)
    //                                     : index == 2
    //                                         ? const Color.fromARGB(
    //                                             255, 226, 226, 226)
    //                                         : index == 3
    //                                             ? const Color.fromARGB(
    //                                                 255, 164, 104, 43)
    //                                             : Colors.transparent,
    //                             width: !widget.isResult
    //                                 ? 1.5
    //                                 : index == 1
    //                                     ? 3
    //                                     : index == 2
    //                                         ? 2.5
    //                                         : index == 3
    //                                             ? 2
    //                                             : 1.5,
    //                           ),
    //                           left: BorderSide(
    //                             color: !widget.isResult
    //                                 ? Colors.transparent
    //                                 : index == 1
    //                                     ? const Color.fromARGB(
    //                                         255, 255, 228, 77)
    //                                     : index == 2
    //                                         ? const Color.fromARGB(
    //                                             255, 226, 226, 226)
    //                                         : index == 3
    //                                             ? const Color.fromARGB(
    //                                                 255, 164, 104, 43)
    //                                             : Colors.transparent,
    //                             width: !widget.isResult
    //                                 ? 1.5
    //                                 : index == 1
    //                                     ? 3
    //                                     : index == 2
    //                                         ? 2.5
    //                                         : index == 3
    //                                             ? 2
    //                                             : 1.5,
    //                           ),
    //                           right: BorderSide(
    //                             color: !widget.isResult
    //                                 ? Colors.transparent
    //                                 : index == 1
    //                                     ? const Color.fromARGB(
    //                                         255, 255, 228, 77)
    //                                     : index == 2
    //                                         ? const Color.fromARGB(
    //                                             255, 226, 226, 226)
    //                                         : index == 3
    //                                             ? const Color.fromARGB(
    //                                                 255, 164, 104, 43)
    //                                             : Colors.transparent,
    //                             width: !widget.isResult
    //                                 ? 1.5
    //                                 : index == 1
    //                                     ? 3
    //                                     : index == 2
    //                                         ? 2.5
    //                                         : index == 3
    //                                             ? 2
    //                                             : 1.5,
    //                           ),
    //                           bottom: BorderSide(
    //                             color: !widget.isResult
    //                                 ? Colors.black
    //                                 : index == 1
    //                                     ? const Color.fromARGB(
    //                                         255, 255, 228, 77)
    //                                     : index == 2
    //                                         ? const Color.fromARGB(
    //                                             255, 226, 226, 226)
    //                                         : index == 3
    //                                             ? const Color.fromARGB(
    //                                                 255, 164, 104, 43)
    //                                             : Colors.black,
    //                             width: !widget.isResult
    //                                 ? 1.5
    //                                 : index == 1
    //                                     ? 3
    //                                     : index == 2
    //                                         ? 2.5
    //                                         : index == 3
    //                                             ? 2
    //                                             : 1.5,
    //                           ),
    //                         ),
    //                       ),
    //                       children: [
    //                         Container(
    //                           padding: const EdgeInsets.symmetric(
    //                             vertical: 8,
    //                           ),
    //                           child: Center(
    //                             child: Container(
    //                               padding: const EdgeInsets.symmetric(
    //                                   horizontal: 30, vertical: 4),
    //                               decoration: BoxDecoration(
    //                                 color:
    //                                     joueur['isSurrender'] || widget.isResult
    //                                         ? const Color.fromARGB(189, 0, 0, 0)
    //                                         : joueur['isFinish']
    //                                             ? const Color.fromRGBO(
    //                                                 67, 199, 67, 0.6)
    //                                             : joueur['isInteract']
    //                                                 ? const Color.fromRGBO(
    //                                                     255, 217, 0, 0.55)
    //                                                 : const Color.fromRGBO(
    //                                                     255, 0, 0, 0.55),
    //                                 borderRadius: BorderRadius.circular(8),
    //                               ),
    //                               child: Text(
    //                                 '$index',
    //                                 style: TextStyle(
    //                                   fontFamily: "Text",
    //                                   color: Colors.white,
    //                                   fontSize: !widget.isResult
    //                                       ? 12
    //                                       : index == 1
    //                                           ? 18
    //                                           : index == 2
    //                                               ? 16
    //                                               : index == 3
    //                                                   ? 14
    //                                                   : 12,
    //                                 ),
    //                               ),
    //                             ),
    //                           ),
    //                         ),
    //                         Container(
    //                           padding: const EdgeInsets.symmetric(
    //                             vertical: 10,
    //                           ),
    //                           child: Text(
    //                             joueur['name'] ?? 'N/A',
    //                             style: TextStyle(
    //                               color: joueur['isSurrender'] ||
    //                                       widget.isResult
    //                                   ? Colors.black87
    //                                   : joueur['isFinish']
    //                                       ? const Color.fromRGBO(52, 149, 52, 1)
    //                                       : joueur['isInteract']
    //                                           ? const Color.fromRGBO(
    //                                               255, 205, 0, 1)
    //                                           : const Color.fromRGBO(
    //                                               209, 0, 0, 1),
    //                               fontSize: !widget.isResult
    //                                   ? 14
    //                                   : index == 1
    //                                       ? 20
    //                                       : index == 2
    //                                           ? 18
    //                                           : index == 3
    //                                               ? 16
    //                                               : 14,
    //                               fontFamily: "Text",
    //                               shadows: const [
    //                                 Shadow(
    //                                   color: Colors.white,
    //                                   blurRadius: 20,
    //                                 ),
    //                               ],
    //                             ),
    //                           ),
    //                         ),
    //                         Container(
    //                           padding: const EdgeInsets.symmetric(
    //                             vertical: 11,
    //                           ),
    //                           child: Center(
    //                             child: Text(
    //                               joueur['score']?.toString() ?? '0',
    //                               style: TextStyle(
    //                                 fontSize: !widget.isResult
    //                                     ? 14
    //                                     : index == 1
    //                                         ? 20
    //                                         : index == 2
    //                                             ? 18
    //                                             : index == 3
    //                                                 ? 16
    //                                                 : 14,
    //                                 fontFamily: "Text",
    //                                 shadows: const [
    //                                   Shadow(
    //                                     color: Colors.white,
    //                                     blurRadius: 20,
    //                                   ),
    //                                 ],
    //                               ),
    //                             ),
    //                           ),
    //                         ),
    //                         Container(
    //                           padding: const EdgeInsets.symmetric(
    //                             vertical: 11,
    //                           ),
    //                           child: Center(
    //                             child: Text(
    //                               joueur['bonus']?.toString() ?? '0',
    //                               style: TextStyle(
    //                                 fontSize: !widget.isResult
    //                                     ? 14
    //                                     : index == 1
    //                                         ? 20
    //                                         : index == 2
    //                                             ? 18
    //                                             : index == 3
    //                                                 ? 16
    //                                                 : 14,
    //                                 fontFamily: "Text",
    //                                 shadows: const [
    //                                   Shadow(
    //                                     color: Colors.white,
    //                                     blurRadius: 20,
    //                                   ),
    //                                 ],
    //                               ),
    //                             ),
    //                           ),
    //                         ),
    //                         if (!widget.isResult && !widget.isObserver)
    //                           GestureDetector(
    //                             onTap: widget.isResult
    //                                 ? null
    //                                 : () {
    //                                     setState(() {
    //                                       joueur['isMute'] = !joueur['isMute'];
    //                                     });
    //                                     _socketService.sendMessage(
    //                                         'mutePlayer', joueur['name']);
    //                                   },
    //                             child: Container(
    //                               padding: const EdgeInsets.symmetric(
    //                                 vertical: 11,
    //                               ),
    //                               color:
    //                                   const Color.fromARGB(45, 255, 255, 255),
    //                               child: Center(
    //                                 child: Icon(
    //                                   joueur['isMute'] == true
    //                                       ? FontAwesomeIcons.volumeXmark
    //                                       : FontAwesomeIcons.volumeHigh,
    //                                   color: joueur['isMute'] == true
    //                                       ? Colors.red
    //                                       : Colors.black,
    //                                   size: 18,
    //                                 ),
    //                               ),
    //                             ),
    //                           ),
    //                         if (!widget.isResult && widget.isObserver)
    //                           GestureDetector(
    //                             onTap: widget.isObserver &&
    //                                     _observerService.isLoading == false
    //                                 ? () {
    //                                     _observerService
    //                                         .changeObserver(joueur['name']);
    //                                   }
    //                                 : null,
    //                             child: Container(
    //                               padding: const EdgeInsets.symmetric(
    //                                 vertical: 11,
    //                               ),
    //                               color: _observerService.playerName ==
    //                                       joueur['name']
    //                                   ? Colors.transparent
    //                                   : const Color.fromARGB(45, 255, 255, 255),
    //                               child: Center(
    //                                 child: _observerService.isLoading == false
    //                                     ? _observerService.playerName ==
    //                                             joueur['name']
    //                                         ? null
    //                                         : const Icon(
    //                                             FontAwesomeIcons.eye,
    //                                             size: 20,
    //                                           )
    //                                     : const CircularProgressIndicator(),
    //                               ),
    //                             ),
    //                           ),
    //                       ],
    //                     ),
    //                   );
    //                   return rows;
    //                 }).toList(),
    //               ),
    //             ],
    //           ),
    //           // ),
    //         ),
    //       ],
    //     ),
    //   ),
    // );
    return Flexible(
      child: Container(
        width: width *
            (widget.isResult
                ? 1
                : isPortrait
                    ? 0.5
                    : 0.337),
        height: height * (isPortrait ? 0.5 : 0.9),
        padding: const EdgeInsets.all(16.0),
        decoration: const BoxDecoration(
          color: Colors.black12,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            if (widget.isResult && !isPortrait)
              const SizedBox(
                height: 25,
              ),
            Padding(
              padding: const EdgeInsets.only(top: 10, bottom: 20),
              child: Text(
                ClassementWidgetConsts.get(
                    "leaderboard", settingsService.language),
                style: const TextStyle(
                  fontSize: 35,
                  fontFamily: "Text",
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
              // width: width * (isPortrait ? 0.45 : 0.35),
              height: height *
                  (widget.isResult & isPortrait
                      ? 0.25
                      : isPortrait
                          ? 0.33
                          : widget.isResult
                              ? 0.33
                              : 0.33),
              child: Column(
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: Colors.black,
                          width: 3,
                        ),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        GestureDetector(
                          onTap: widget.isResult
                              ? null
                              : () {
                                  setState(() {
                                    sortBy = 'etat';
                                    isDescending = !isDescending;
                                  });
                                },
                          child: Container(
                            width: width * 0.07,
                            padding: const EdgeInsets.symmetric(
                              vertical: 10,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  widget.isResult
                                      ? ClassementWidgetConsts.get(
                                          "place", settingsService.language)
                                      : ClassementWidgetConsts.get(
                                          "state", settingsService.language),
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontFamily: "Text",
                                    shadows: [
                                      Shadow(
                                        color: Colors.white,
                                        blurRadius: 20,
                                      ),
                                    ],
                                  ),
                                ),
                                if (sortBy == 'etat')
                                  Icon(
                                    !isDescending
                                        ? FontAwesomeIcons.arrowDown
                                        : FontAwesomeIcons.arrowUp,
                                    size: 14,
                                  ),
                              ],
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: widget.isResult
                              ? null
                              : () {
                                  setState(() {
                                    sortBy = 'name';
                                    isDescending = !isDescending;
                                  });
                                },
                          child: Container(
                            width: width * 0.1,
                            padding: const EdgeInsets.only(
                              // left: width * 0.009,
                              top: 10,
                              bottom: 10,
                            ),
                            child: Row(
                              children: [
                                Text(
                                  ClassementWidgetConsts.get(
                                      "player", settingsService.language),
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontFamily: "Text",
                                    shadows: [
                                      Shadow(
                                        color: Colors.white,
                                        blurRadius: 20,
                                      ),
                                    ],
                                  ),
                                ),
                                if (sortBy == 'name')
                                  Icon(
                                    !isDescending
                                        ? FontAwesomeIcons.arrowDown
                                        : FontAwesomeIcons.arrowUp,
                                    size: 14,
                                  ),
                              ],
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: widget.isResult
                              ? null
                              : () {
                                  setState(() {
                                    sortBy = 'points';
                                    isDescending = !isDescending;
                                  });
                                },
                          child: Container(
                            width: width * 0.045,
                            padding: const EdgeInsets.symmetric(
                              vertical: 10,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text(
                                  'Points',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontFamily: "Text",
                                    shadows: [
                                      Shadow(
                                        color: Colors.white,
                                        blurRadius: 20,
                                      ),
                                    ],
                                  ),
                                ),
                                if (sortBy == 'points')
                                  Icon(
                                    !isDescending
                                        ? FontAwesomeIcons.arrowDown
                                        : FontAwesomeIcons.arrowUp,
                                    size: 14,
                                  ),
                              ],
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: widget.isResult
                              ? null
                              : () {
                                  setState(() {
                                    sortBy = 'bonus';
                                    isDescending = !isDescending;
                                  });
                                },
                          child: Container(
                            width: width * 0.045,
                            padding: const EdgeInsets.symmetric(
                              vertical: 10,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text(
                                  'Bonus',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontFamily: "Text",
                                    shadows: [
                                      Shadow(
                                        color: Colors.white,
                                        blurRadius: 20,
                                      ),
                                    ],
                                  ),
                                ),
                                if (sortBy == 'bonus')
                                  Icon(
                                    !isDescending
                                        ? FontAwesomeIcons.arrowDown
                                        : FontAwesomeIcons.arrowUp,
                                    size: 14,
                                  ),
                              ],
                            ),
                          ),
                        ),
                        if (!widget.isResult && !widget.isObserver)
                          GestureDetector(
                            onTap: widget.isResult
                                ? null
                                : () {
                                    bool isOneNotMuted = false;
                                    for (var joueur in joueursTries) {
                                      if (!joueur['isMute']) {
                                        isOneNotMuted = true;
                                        joueur['isMute'] = true;
                                        _socketService.sendMessage(
                                            'mutePlayer', joueur['name']);
                                      }
                                    }
                                    if (!isOneNotMuted) {
                                      for (var joueur in joueursTries) {
                                        joueur['isMute'] = false;
                                        _socketService.sendMessage(
                                            'mutePlayer', joueur['name']);
                                      }
                                    }
                                    setState(() {});
                                  },
                            child: Container(
                              width: width * 0.051,
                              padding: const EdgeInsets.symmetric(
                                vertical: 10,
                              ),
                              child: const Center(
                                child: Text(
                                  'Chat ',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontFamily: "Text",
                                    shadows: [
                                      Shadow(
                                        color: Colors.white,
                                        blurRadius: 20,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        if (!widget.isResult && widget.isObserver)
                          GestureDetector(
                            child: Container(
                              width: width * 0.051,
                              padding: const EdgeInsets.symmetric(
                                vertical: 10,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    ClassementWidgetConsts.get("view",
                                        settingsService.language), // À revoir
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontFamily: "Text",
                                      shadows: [
                                        Shadow(
                                          color: Colors.white,
                                          blurRadius: 20,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ), // Table(
                  Flexible(
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(
                          vertical: 0, horizontal: 5),
                      physics: const BouncingScrollPhysics(),
                      controller: _scrollController,
                      itemCount: joueursTries.length,
                      itemBuilder: (context, index) {
                        dynamic joueur = joueursTries[index];

                        return Container(
                          decoration: BoxDecoration(
                            color: !widget.isResult
                                ? Colors.transparent
                                : index == 1
                                    ? const Color(0xFFFFD700)
                                    : index == 2
                                        ? const Color(0xFFC0C0C0)
                                        : index == 3
                                            ? const Color.fromARGB(
                                                255, 205, 128, 50)
                                            : Colors.transparent,
                            borderRadius: BorderRadius.all(
                              Radius.circular(!widget.isResult
                                  ? 0
                                  : index == 1
                                      ? 12
                                      : index == 2
                                          ? 10
                                          : index == 3
                                              ? 8
                                              : 0),
                            ),
                            border: Border(
                              top: BorderSide(
                                color: !widget.isResult
                                    ? Colors.transparent
                                    : index == 1
                                        ? const Color.fromARGB(
                                            255, 255, 228, 77)
                                        : index == 2
                                            ? const Color.fromARGB(
                                                255, 226, 226, 226)
                                            : index == 3
                                                ? const Color.fromARGB(
                                                    255, 164, 104, 43)
                                                : Colors.transparent,
                                width: !widget.isResult
                                    ? 1.5
                                    : index == 1
                                        ? 3
                                        : index == 2
                                            ? 2.5
                                            : index == 3
                                                ? 2
                                                : 1.5,
                              ),
                              left: BorderSide(
                                color: !widget.isResult
                                    ? Colors.transparent
                                    : index == 1
                                        ? const Color.fromARGB(
                                            255, 255, 228, 77)
                                        : index == 2
                                            ? const Color.fromARGB(
                                                255, 226, 226, 226)
                                            : index == 3
                                                ? const Color.fromARGB(
                                                    255, 164, 104, 43)
                                                : Colors.transparent,
                                width: !widget.isResult
                                    ? 1.5
                                    : index == 1
                                        ? 3
                                        : index == 2
                                            ? 2.5
                                            : index == 3
                                                ? 2
                                                : 1.5,
                              ),
                              right: BorderSide(
                                color: !widget.isResult
                                    ? Colors.transparent
                                    : index == 1
                                        ? const Color.fromARGB(
                                            255, 255, 228, 77)
                                        : index == 2
                                            ? const Color.fromARGB(
                                                255, 226, 226, 226)
                                            : index == 3
                                                ? const Color.fromARGB(
                                                    255, 164, 104, 43)
                                                : Colors.transparent,
                                width: !widget.isResult
                                    ? 1.5
                                    : index == 1
                                        ? 3
                                        : index == 2
                                            ? 2.5
                                            : index == 3
                                                ? 2
                                                : 1.5,
                              ),
                              bottom: BorderSide(
                                color: !widget.isResult
                                    ? Colors.black
                                    : index == 1
                                        ? const Color.fromARGB(
                                            255, 255, 228, 77)
                                        : index == 2
                                            ? const Color.fromARGB(
                                                255, 226, 226, 226)
                                            : index == 3
                                                ? const Color.fromARGB(
                                                    255, 164, 104, 43)
                                                : Colors.black,
                                width: !widget.isResult
                                    ? 1.5
                                    : index == 1
                                        ? 3
                                        : index == 2
                                            ? 2.5
                                            : index == 3
                                                ? 2
                                                : 1.5,
                              ),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                width: width * 0.06,
                                padding: const EdgeInsets.only(
                                  top: 8,
                                  bottom: 8,
                                  left: 0,
                                  right: 0,
                                ),
                                child: Center(
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 30, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: joueur['isSurrender'] ||
                                              widget.isResult
                                          ? const Color.fromARGB(189, 0, 0, 0)
                                          : joueur['isFinish']
                                              ? const Color.fromRGBO(
                                                  67, 199, 67, 0.6)
                                              : joueur['isInteract']
                                                  ? const Color.fromRGBO(
                                                      255, 217, 0, 0.55)
                                                  : const Color.fromRGBO(
                                                      255, 0, 0, 0.55),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      '$index',
                                      style: TextStyle(
                                        fontFamily: "Text",
                                        color: Colors.white,
                                        fontSize: !widget.isResult
                                            ? 12
                                            : index == 1
                                                ? 18
                                                : index == 2
                                                    ? 16
                                                    : index == 3
                                                        ? 14
                                                        : 12,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              Container(
                                width: width * 0.1,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 10,
                                ),
                                child: Text(
                                  joueur['name'] ?? 'N/A',
                                  style: TextStyle(
                                    color:
                                        joueur['isSurrender'] || widget.isResult
                                            ? Colors.black87
                                            : joueur['isFinish']
                                                ? const Color.fromRGBO(
                                                    52, 149, 52, 1)
                                                : joueur['isInteract']
                                                    ? const Color.fromRGBO(
                                                        255, 205, 0, 1)
                                                    : const Color.fromRGBO(
                                                        209, 0, 0, 1),
                                    fontSize: !widget.isResult
                                        ? 14
                                        : index == 1
                                            ? 20
                                            : index == 2
                                                ? 18
                                                : index == 3
                                                    ? 16
                                                    : 14,
                                    fontFamily: "Text",
                                    shadows: const [
                                      Shadow(
                                        color: Colors.white,
                                        blurRadius: 20,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              Container(
                                width: width * 0.045,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 11,
                                ),
                                child: Center(
                                  child: Text(
                                    joueur['score']?.toString() ?? '0',
                                    style: TextStyle(
                                      fontSize: !widget.isResult
                                          ? 14
                                          : index == 1
                                              ? 20
                                              : index == 2
                                                  ? 18
                                                  : index == 3
                                                      ? 16
                                                      : 14,
                                      fontFamily: "Text",
                                      shadows: const [
                                        Shadow(
                                          color: Colors.white,
                                          blurRadius: 20,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              Container(
                                width: width * 0.045,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 11,
                                ),
                                child: Center(
                                  child: Text(
                                    joueur['bonus']?.toString() ?? '0',
                                    style: TextStyle(
                                      fontSize: !widget.isResult
                                          ? 14
                                          : index == 1
                                              ? 20
                                              : index == 2
                                                  ? 18
                                                  : index == 3
                                                      ? 16
                                                      : 14,
                                      fontFamily: "Text",
                                      shadows: const [
                                        Shadow(
                                          color: Colors.white,
                                          blurRadius: 20,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              if (!widget.isResult && !widget.isObserver)
                                GestureDetector(
                                  onTap: widget.isResult
                                      ? null
                                      : () {
                                          setState(() {
                                            joueur['isMute'] =
                                                !joueur['isMute'];
                                          });
                                          _socketService.sendMessage(
                                              'mutePlayer', joueur['name']);
                                        },
                                  child: Container(
                                    width: width * 0.045,
                                    padding: const EdgeInsets.only(
                                      top: 11,
                                      bottom: 11,
                                      left: 0,
                                      right: 0,
                                    ),
                                    color:
                                        const Color.fromARGB(45, 255, 255, 255),
                                    child: Center(
                                      child: Icon(
                                        joueur['isMute'] == true
                                            ? FontAwesomeIcons.volumeXmark
                                            : FontAwesomeIcons.volumeHigh,
                                        color: joueur['isMute'] == true
                                            ? Colors.red
                                            : Colors.black,
                                        size: 18,
                                      ),
                                    ),
                                  ),
                                ),
                              if (!widget.isResult && widget.isObserver)
                                GestureDetector(
                                  onTap: widget.isObserver &&
                                          _observerService.isLoading == false
                                      ? () {
                                          _observerService
                                              .changeObserver(joueur['name']);
                                        }
                                      : null,
                                  child: Container(
                                    width: width * 0.045,
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 11,
                                    ),
                                    color: _observerService.playerName ==
                                            joueur['name']
                                        ? Colors.transparent
                                        : const Color.fromARGB(
                                            45, 255, 255, 255),
                                    child: Center(
                                      child: _observerService.isLoading == false
                                          ? _observerService.playerName ==
                                                  joueur['name']
                                              ? null
                                              : const Icon(
                                                  FontAwesomeIcons.eye,
                                                  size: 20,
                                                )
                                          : const CircularProgressIndicator(),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        );
                      },
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
}
