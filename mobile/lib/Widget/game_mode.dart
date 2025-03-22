import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:mobile/Services/room_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Sockets/socket_service.dart';
import 'package:mobile/Widget/dialog.dart';
import 'package:mobile/Widget/game_mode_consts.dart';
import 'package:mobile/Widget/text_field.dart';
import 'package:provider/provider.dart';

class GameModeDialog extends StatefulWidget {
  final int gameID;
  final bool containsQRL;
  const GameModeDialog({
    required this.gameID,
    required this.containsQRL,
    Key? key,
  }) : super(key: key);

  @override
  State<GameModeDialog> createState() => _GameModeDialogState();
}

class _GameModeDialogState extends State<GameModeDialog> {
  RoomService _roomService = RoomService();
  String? selectedMode;
  final TextEditingController _priceController = TextEditingController();
  final SocketService _socketService = SocketService();
  SettingsService settingsService = SettingsService();
  String name = FirebaseAuth.instance.currentUser!.displayName.toString();

  @override
  void dispose() {
    _priceController.dispose();
    super.dispose();
  }

  void _selectMode(String mode) {
    setState(() {
      selectedMode = mode;
    });
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context);
    // bool isPortrait =
    //     MediaQuery.of(context).orientation == Orientation.portrait;

    List<Widget> modes = [
      _GameModeOption(
        icon: FontAwesomeIcons.trophy,
        label: GameModeConsts.get("ranked", settingsService.language),
        isSelected: selectedMode == 'fa-trophy',
        onTap: () => _selectMode('fa-trophy'),
        containsQRL: widget.containsQRL,
      ),
      _GameModeOption(
        icon: FontAwesomeIcons.gamepad,
        label: GameModeConsts.get("classic", settingsService.language),
        isSelected: selectedMode == 'fa-gamepad',
        onTap: () => _selectMode('fa-gamepad'),
      ),
      _GameModeOption(
        icon: FontAwesomeIcons.users,
        label: GameModeConsts.get("friends", settingsService.language),
        isSelected: selectedMode == 'fa-users',
        onTap: () => _selectMode('fa-users'),
      ),
    ];

    return MyDialog(
      title: GameModeConsts.get("chooseGameMode", settingsService.language),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: modes,
          ),
          const SizedBox(height: 20),
          Text(GameModeConsts.get("entranceFee", settingsService.language),
              style: const TextStyle(fontSize: 20, fontFamily: "Text")),
          const SizedBox(height: 10),
          TextFieldInput(
            textEditingController: _priceController,
            hintText: "0",
            centerText: true,
            width: 140,
            borderWidth: 1,
            borderRadius: 10,
            backgroundColor: Colors.white,
            enabledBorderColor: Colors.grey,
            focusedBorderColor: Colors.black54,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(10),
            ],
          ),
        ],
      ),
      positiveButtonText:
          GameModeConsts.get("confirm", settingsService.language),
      positiveButtonDisable: selectedMode == null,
      positiveButtonAction: selectedMode == null
          ? () {}
          : () {
              _roomService.mode = selectedMode!;
              int value = 0;
              if (int.tryParse(_priceController.text) == null) {
                _roomService.price = 0;
              } else {
                _roomService.price = int.tryParse(_priceController.text)!;
                value = int.tryParse(_priceController.text)!;
              }
              print('j ai mis: ${_roomService.price}');
              _socketService.sendMessage('createRoom', {
                'id': widget.gameID,
                'options': {
                  'creator': name,
                  'mode': selectedMode,
                  'price': value,
                }
              });
              Navigator.of(context).pop();
            },
      negativeButtonText:
          GameModeConsts.get("cancel", settingsService.language),
      negativeButtonAction: () {
        Navigator.of(context).pop(); // Action "Annuler"
      },
    );
  }
}

class _GameModeOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final bool containsQRL;
  final VoidCallback onTap;

  const _GameModeOption({
    Key? key,
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.containsQRL = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    SettingsService settingsService = Provider.of<SettingsService>(context);

    return GestureDetector(
        onTap: containsQRL ? null : onTap,
        child: Column(
          children: [
            Transform.scale(
              scale: isSelected ? 1.1 : 1,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 150,
                    padding: const EdgeInsets.all(15),
                    decoration: BoxDecoration(
                      color: containsQRL
                          ? const Color.fromARGB(160, 191, 191, 191)
                          : isSelected
                              ? Colors.white
                              : const Color.fromARGB(240, 255, 255, 255),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected
                            ? const Color.fromARGB(209, 10, 191, 137)
                            : Colors.black87,
                        width: isSelected ? 2 : 0,
                      ),
                      boxShadow: [
                        if (isSelected)
                          const BoxShadow(
                            color: Color.fromARGB(162, 12, 230, 165),
                            blurRadius: 8,
                            spreadRadius: 2,
                          ),
                        if (!isSelected)
                          BoxShadow(
                            color: containsQRL
                                ? Colors.transparent
                                : Colors.black12,
                            blurRadius: 8,
                            spreadRadius: 2,
                            offset: const Offset(0, 3),
                          ),
                      ],
                    ),
                    child: Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 100,
                            child: Icon(
                              icon,
                              size: 40,
                              color:
                                  containsQRL ? Colors.black54 : Colors.black,
                            ),
                          ),
                          if (!containsQRL) const SizedBox(height: 10),
                          Text(
                            label,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 22,
                              fontFamily: "Text",
                            ),
                          ),
                          if (containsQRL)
                            Padding(
                              padding: const EdgeInsets.only(top: 0),
                              child: Text(
                                GameModeConsts.get(
                                    "noQRL", settingsService.language),
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontFamily: "Text",
                                  color: Color.fromARGB(255, 186, 51, 41),
                                  shadows: [
                                    Shadow(
                                      color: Colors.white,
                                      blurRadius: 10,
                                    ),
                                  ],
                                ),
                              ),
                            )
                        ],
                      ),
                    ),
                  ),
                  if (isSelected)
                    Positioned(
                      top: 5,
                      right: 5,
                      child: Image.asset(
                        "assets/selectedMode.png",
                        height: 20,
                      ),
                      // Icon(
                      //   Icons.check_circle_rounded,
                      //   color: Color.fromARGB(209, 11, 206, 147),
                      //   size: 20,
                      // ),
                    ),
                ],
              ),
            ),
          ],
        ));
  }
}
