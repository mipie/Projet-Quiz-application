import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/dialog_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Services/shop_service.dart';
import 'package:mobile/Services/statistics_service.dart';
import 'package:provider/provider.dart';

class ChatButton extends StatefulWidget {
  final String name;
  final bool isInGame;
  final String? channel;

  const ChatButton(
      {super.key, required this.name, required this.isInGame, this.channel});

  @override
  State<ChatButton> createState() => ChatButtonState();
}

class ChatButtonState extends State<ChatButton> {
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  ShopService shopService = ShopService();
  StatisticsService statisticsService = StatisticsService();
  DialogService dialogService = DialogService();
  String? userId = FirebaseAuth.instance.currentUser?.uid;

  double _scale = 1.0;
  Color _currentBackgroundColor = Colors.black87;

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context);
    channelService = Provider.of<ChannelService>(context);

    return Padding(
      padding: const EdgeInsets.all(15),
      child: GestureDetector(
        onTapDown: (_) {
          setState(() {
            _scale = 0.9;
            _currentBackgroundColor = const Color.fromARGB(255, 135, 135, 135)
                .withOpacity(0.7); // Change color when tapped
          });
        },
        onTapUp: (_) {
          setState(() {
            _scale = 1.0;
            _currentBackgroundColor = Colors.black87; // Reset to original color
          });
        },
        onTapCancel: () {
          setState(() {
            _scale = 1.0;
            _currentBackgroundColor = Colors.black87; // Reset to original color
          });
        },
        child: AnimatedScale(
          scale: _scale,
          duration: const Duration(milliseconds: 150), // Adjust animation speed
          curve: Curves.easeInOut,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.white,
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: ValueListenableBuilder<bool>(
                  valueListenable: ChannelService.isMute,
                  builder: (context, isMute, child) {
                    return CircleAvatar(
                      radius: 28,
                      backgroundColor:
                          _currentBackgroundColor, // Animated background color
                      child: Center(
                        child: IconButton(
                          onPressed: () async {
                            print("widget.channel : ${widget.channel}");
                            channelService.openChat(
                                context, widget.isInGame, widget.channel);
                          },
                          icon: Icon(
                            Icons.chat,
                            size: 30,
                            color: isMute
                                ? const Color.fromARGB(255, 240, 164, 159)
                                : Colors.white,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              Positioned(
                right: 0,
                top: 0,
                child: StreamBuilder<int>(
                  stream: channelService.getTotalNotifications(widget.name),
                  builder: (context, snapshot) {
                    if (snapshot.hasData && snapshot.data! > 0) {
                      return Container(
                        width: 25,
                        height: 25,
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            snapshot.data.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontFamily: "Text",
                              fontSize: 15,
                            ),
                          ),
                        ),
                      );
                    } else {
                      return const SizedBox.shrink();
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
