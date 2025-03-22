import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/home_screen.dart';
import 'package:mobile/Screen/login_screen.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/game_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Services/shop_service.dart';
import 'package:mobile/Services/wallet_service.dart';
import 'package:mobile/Widget/push_notifications.dart';
import 'package:provider/provider.dart';

final navigatorKey = GlobalKey<NavigatorState>();
// final isTokenBeingUsed = false;

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (message.notification != null) {
    print("Some notif received");
    print("Handling a background message: ${message.messageId}");
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
          // options: DefaultFirebaseOptions.currentPlatform,
          )
      .then(
    (_) async => {await FirebaseApi().initNotifs()},
  );
  // channelService.startTokenRetrieval();
  // Pour refresh le token lorsque Functions le met à null car il est invalide
  // channelService
  //     .listenForTokenRefresh(FirebaseAuth.instance.currentUser!.uid);
  // FirebaseAuth.instance.currentUser?.reload();

  await FirebaseAppCheck.instance.activate(
    webProvider: ReCaptchaV3Provider('recaptcha-v3-site-key'),
    // After adding app to Play STore copy signing
    // keys from app store and copy them to Firebase
    // Project Settings.
    androidProvider: AndroidProvider
        .debug, // .debug -> playIntegrity quand met dans Play Store
    // appleProvider: AppleProvider.appAttest,
  );
  // FirebaseAuth.instance.currentUser?.reload();

  runApp(MultiProvider(
    providers: [
      ChangeNotifierProvider<GameService>(
        create: (_) => GameService(),
      ),
      ChangeNotifierProvider<SettingsService>(
        create: (_) => SettingsService(),
      ),
      ChangeNotifierProvider<ChannelService>(
        create: (_) => ChannelService(),
      ),
      ChangeNotifierProvider<ShopService>(
        create: (_) => ShopService(),
      ),
      ChangeNotifierProvider<WalletService>(
        create: (_) => WalletService(),
      ),
    ],
    child: const MyApp(),
  ));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  void initState() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print("Message received in foreground: ${message.notification?.title}");
    });
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'KAM? PAF!',
        restorationScopeId: "root",
        navigatorKey: navigatorKey,
        // home: FirebaseAuth.instance.currentUser == null
        //     ? const LoginScreen()
        //     : HomeScreen(
        //         name: FirebaseAuth.instance.currentUser!.displayName.toString(),
        //       ),
        home: const LoginScreen(),
        routes: {
          HomeScreen.route: (context) => HomeScreen(
                name: FirebaseAuth.instance.currentUser!.displayName.toString(),
              ),
        },
      );
}
