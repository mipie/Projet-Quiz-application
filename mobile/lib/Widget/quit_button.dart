import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/home_screen.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/dialog_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Services/shop_service.dart';
import 'package:mobile/Services/statistics_service.dart';
import 'package:provider/provider.dart';

class QuitButton extends StatefulWidget {
  final String name;
  final Function? onPressed;

  const QuitButton({super.key, required this.name, this.onPressed});

  @override
  State<QuitButton> createState() => QuitButtonState();
}

class QuitButtonState extends State<QuitButton> {
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  ShopService shopService = ShopService();
  StatisticsService statisticsService = StatisticsService();
  DialogService dialogService = DialogService();
  String? userId = FirebaseAuth.instance.currentUser?.uid;

  double _scale = 1.0;
  Color _currentBackgroundColor = const Color.fromARGB(255, 150, 10, 0);

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
                255, 156, 72, 66); // Change background color on tap
          });
        },
        onTapUp: (_) {
          setState(() {
            _scale = 1.0;
            _currentBackgroundColor =
                const Color.fromARGB(255, 150, 10, 0); // Original color
          });
        },
        onTapCancel: () {
          setState(() {
            _scale = 1.0;
            _currentBackgroundColor =
                const Color.fromARGB(255, 150, 10, 0); // Original color
          });
        },
        child: AnimatedScale(
          scale: _scale,
          duration:
              const Duration(milliseconds: 150), // Adjust the speed of scaling
          curve: Curves.easeInOut,
          child: Container(
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
              backgroundColor: _currentBackgroundColor,
              child: Center(
                child: IconButton(
                  onPressed: () async {
                    widget.onPressed != null
                        ? widget.onPressed!()
                        : Navigator.of(context).pushReplacement(
                            MaterialPageRoute(
                              builder: (context) => HomeScreen(
                                name: widget.name,
                              ),
                            ),
                          );
                  },
                  icon: const Icon(
                    Icons.exit_to_app,
                    size: 35,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
