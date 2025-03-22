import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/statistics_screen.dart';
import 'package:mobile/main.dart';

class StatisticsService {
  String? userId = FirebaseAuth.instance.currentUser?.uid;
  Map<String, dynamic> statistics = {};
  List<Map<String, dynamic>> leaderboard = [];

  void openChat(context, [String? channel]) async {
    final context = navigatorKey.currentContext;

    if (context == null) {
      print("No valid context available. Unable to open chat dialog.");
      return;
    }

    showDialog(
      context: context,
      builder: (context) {
        return const StatisticsScreen();
      },
    );
  }

  Stream<List<Map<String, dynamic>>> getRankedLeaderboard() {
    try {
      return FirebaseFirestore.instance
          .collection("users")
          .snapshots()
          .map((querySnapshot) {
        try {
          // Convert Firestore documents into a list of maps with required structure
          List<Map<String, dynamic>> rankings = querySnapshot.docs.map((doc) {
            final data = doc.data();
            return {
              'username': data['username'] ?? 0,
              'rankingPoints': data['rankingPoints']?.toInt() ?? 0,
              'rankingD': data['rankingD']?.toInt() ?? 0,
              'rankingL': data['rankingL']?.toInt() ?? 0,
              'rankingW': data['rankingW']?.toInt() ?? 0,
            };
          }).toList();

          // Sort the list
          rankings.sort((a, b) {
            // Compare by rankingPoints
            int cmp = b['rankingPoints'].compareTo(a['rankingPoints']);
            if (cmp != 0) return cmp;

            // Compare by rankingW
            cmp = b['rankingW'].compareTo(a['rankingW']);
            if (cmp != 0) return cmp;

            // Compare by rankingD
            cmp = b['rankingD'].compareTo(a['rankingD']);
            if (cmp != 0) return cmp;

            cmp = a['rankingL'].compareTo(b['rankingL']);
            if (cmp != 0) return cmp;

            // Compare by rankingL (ascending order)
            return a['username'].compareTo(b['username']);
          });

          return rankings; // Return the sorted list
        } catch (e) {
          print("Error retrieving rankings: $e");
          return []; // Return an empty list on error
        }
      });
    } catch (e) {
      print("Error initializing leaderboard stream: $e");
      return Stream.value([]); // Return a default empty stream on error
    }
  }

  Future<Map<String, dynamic>?> getUserStats() async {
    try {
      userId = FirebaseAuth.instance.currentUser?.uid;

      DocumentSnapshot userDoc = await FirebaseFirestore.instance
          .collection("users")
          .doc(userId)
          .get();
      if (userDoc.exists && userDoc.data() != null) {
        statistics = Map<String, dynamic>.from(userDoc['statistics']);
        return statistics;
      } else {
        print("User document not found or 'statistics' field is missing.");
        return null;
      }
    } catch (e) {
      print("Error retrieving statistics: $e");
      return null;
    }
  }

  Future<void> updateUserStats() async {
    // Update all stats
  }

  Future<List<Map<String, dynamic>>> getGamesHistory() async {
    try {
      DocumentSnapshot<Map<String, dynamic>> snapshot = await FirebaseFirestore
          .instance
          .collection('users')
          .doc(userId)
          .get();

      if (snapshot.exists && snapshot.data() != null) {
        return List<Map<String, dynamic>>.from(
            snapshot.data()?['gamesHistoric'] ?? []);
      }
      return []; // Return an empty list if no data found
    } catch (e) {
      print("Error getting gamesHistoric: $e");
      return []; // Return an empty list on error
    }
  }

  Future<void> updateGameHistory() async {
    // Update games history
  }
}
