import 'package:flutter/material.dart';
import 'package:mobile/main.dart';

class DialogService {
  void openChat(context, screen, [String? channel]) async {
    final context = navigatorKey.currentContext;

    if (context == null) {
      print("No valid context available. Unable to open chat dialog.");
      return;
    }

    showDialog(
      context: context,
      builder: (context) {
        return screen;
      },
    );
  }
}
