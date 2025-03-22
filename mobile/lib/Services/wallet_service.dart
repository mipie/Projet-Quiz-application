import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';

class WalletService with ChangeNotifier {
  String? userId = FirebaseAuth.instance.currentUser?.uid;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  int wallet = 0;

  void listenToSettingsChanges() {
    userId = FirebaseAuth.instance.currentUser!.uid;
    // print("userId :$userId");
    FirebaseFirestore.instance
        .collection('users')
        .doc(userId)
        .snapshots()
        .listen(
      (snapshot) {
        if (snapshot.exists || snapshot.data() == null) {
          final data = snapshot.data();
          if (data!.containsKey("wallet")) {
            if (wallet != data["wallet"]) {
              wallet = data["wallet"] as int;
              notifyListeners();
              print("calling notify wallet...");
            }
          }
        }
      },
      onError: (error) {
        print('Erreur listening to settings changes: $error');
      },
    );
  }

  Stream<int> getWallet() {
    int errorValue = -1;

    userId = FirebaseAuth.instance.currentUser?.uid;
    if (userId == null) {
      print("User ID not found. Cannot get wallet.");
      return Stream.value(errorValue);
    }

    return _firestore
        .collection('users')
        .doc(userId)
        .snapshots()
        .map((snapshot) {
      try {
        if (snapshot.exists) {
          wallet = snapshot.get('wallet') as int;
          notifyListeners();
        } else {
          print("No user found with this UID.");
        }
      } catch (e) {
        print('Error while getting wallet');
        return errorValue;
      }
      return wallet;
    });
  }

  Future<void> updateWallet(int valueToSend) async {
    try {
      await _firestore
          .collection('users')
          .doc(userId)
          .update({'wallet': valueToSend});
    } catch (e) {
      print('Failed to update wallet: $e');
    }
  }

  bool hasEnoughMoney(int price) {
    return wallet >= price;
  }

  Future<void> buy(int price) async {
    if (hasEnoughMoney(price)) {
      wallet = wallet - price;
      notifyListeners();
      await updateWallet(wallet);
      //await getWallet();
    }
  }

  Future<void> earnMoney(int moneyEarned) async {
    wallet = wallet + moneyEarned;
    notifyListeners();

    await updateWallet(wallet);
    //await getWallet();
  }

  Widget buildBalanceDisplay(context) {
    WalletService walletService =
        Provider.of<WalletService>(context, listen: true);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        border: Border.all(
          width: 0.5,
        ),
        color: Colors.white70,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            spreadRadius: 2,
            blurRadius: 5,
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            FontAwesomeIcons.wallet,
            color: Colors.black,
          ),
          const SizedBox(width: 7),
          Padding(
            padding: const EdgeInsets.only(top: 3),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 5),
                  child: Text(
                    '${walletService.wallet}',
                    style: const TextStyle(
                      color: Colors.black,
                      fontFamily: "Text",
                      fontSize: 20,
                    ),
                  ),
                ),
                Padding(
                  padding: EdgeInsets.only(bottom: 3),
                  child: Image.asset(
                    "assets/michtoken.png",
                    height: 20,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
