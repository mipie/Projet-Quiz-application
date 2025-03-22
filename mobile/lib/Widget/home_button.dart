import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/home_screen.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/dialog_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Services/shop_service.dart';
import 'package:mobile/Services/statistics_service.dart';
import 'package:provider/provider.dart';

class HomeButton extends StatefulWidget {
  final String name;
  final Function? onPressed;

  const HomeButton({super.key, required this.name, this.onPressed});

  @override
  State<HomeButton> createState() => HomeButtonState();
}

class HomeButtonState extends State<HomeButton> {
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
            _currentBackgroundColor = const Color.fromARGB(
                255, 135, 135, 135); // Change color when tapped
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
                child: CircleAvatar(
                  radius: 28,
                  backgroundColor:
                      _currentBackgroundColor, // Animated background color
                  child: Center(
                    child: IconButton(
                      onPressed: () async {
                        widget.onPressed != null
                            ? widget.onPressed!()
                            :
                            // Add a confirmation dialog
                            Navigator.of(context).pushReplacement(
                                MaterialPageRoute(
                                  builder: (context) => HomeScreen(
                                    name: widget.name,
                                  ),
                                ),
                              );
                      },
                      icon: const Icon(
                        Icons.home,
                        size: 35,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                top: 0,
                left: 0,
                child: userId != null
                    ? StreamBuilder<int>(
                        stream: channelService.getTotalFriendsNotifs(userId!),
                        builder: (context, snapshot) {
                          if (snapshot.hasData && snapshot.data! > 0) {
                            return Container(
                              height: 20,
                              width: 20,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.red,
                              ),
                              child: const Text(
                                '',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: "Text",
                                ),
                              ),
                            );
                          }
                          return const SizedBox();
                        },
                      )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
