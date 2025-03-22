import 'package:flutter/material.dart';

void showSnackBar(BuildContext context, String text) {
  final overlay = Overlay.of(context);
  final overlayEntry = OverlayEntry(
    builder: (context) => Positioned(
      top: MediaQuery.of(context).padding.top +
          10, // Position below the status bar
      left: 150,
      right: 150,
      child: Material(
        color: Colors.transparent,
        child: Container(
          height: 65,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.black87,
            borderRadius: BorderRadius.circular(15),
          ),
          child: Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontFamily: "Text",
              fontSize: 25,
            ),
          ),
        ),
      ),
    ),
  );

  overlay.insert(overlayEntry);

  // Remove the overlay after a delay
  Future.delayed(const Duration(seconds: 3)).then((_) => overlayEntry.remove());
}
