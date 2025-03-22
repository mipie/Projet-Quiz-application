import 'package:flutter_tts/flutter_tts.dart';

class VoiceService {
  final FlutterTts _flutterTts = FlutterTts();
  final List<String> _queue = [];
  bool _isSpeaking = false;

  VoiceService() {
    _flutterTts.setCompletionHandler(() {
      _isSpeaking = false;
      if (_queue.isNotEmpty) {
        _speakNext();
      }
    });
  }

  Future<void> speak(String text) async {
    _queue.add(text); // Ajouter la phrase à la file d'attente
    if (!_isSpeaking) {
      _speakNext(); // Si rien ne parle, commencez immédiatement
    }
  }

  void _speakNext() {
    if (_queue.isNotEmpty) {
      _isSpeaking = true;
      _flutterTts.setSpeechRate(0.35);
      _flutterTts
          .speak(_queue.removeAt(0)); // Lire la première phrase de la file
    }
  }

  Future<void> stop() async {
    await _flutterTts.stop();
    _queue.clear();
    _isSpeaking = false;
  }

  void dispose() {
    _flutterTts.stop();
  }
}
