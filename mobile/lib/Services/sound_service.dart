// import 'package:flutter_sound/flutter_sound.dart';

// class NotificationSoundPlayer {
//   final FlutterSoundPlayer _player = FlutterSoundPlayer();

//   Future<void> playNotificationSound() async {
//     try {
//       // Start the player
//       await _player._openAudioSession();

//       // Specify the sound file path (local asset or from the network)
//       String soundPath = 'assets/sounds/notification.mp3'; // Change to your file path

//       // Play the sound
//       await _player.startPlayer(
//         fromURI: soundPath,
//         codec: Codec.mp3, // Specify the codec according to your file format
//       );
//     } catch (e) {
//       print("Error playing sound: $e");
//     }
//   }

//   // Call this function when you're done to release resources
//   Future<void> dispose() async {
//     await _player.closeAudioSession();
//   }
// }

// // Instantiate the player somewhere in your app
// final NotificationSoundPlayer notificationSoundPlayer = NotificationSoundPlayer();
