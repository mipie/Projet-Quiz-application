import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class FriendService {
  String? userId = FirebaseAuth.instance.currentUser?.uid;
  String? name = FirebaseAuth.instance.currentUser?.displayName.toString();

  Stream<List<Map<String, dynamic>>> getFriends() {
    // Get the current user's ID
    userId = FirebaseAuth.instance.currentUser?.uid;

    if (userId == null) {
      // If user is not logged in, return an empty stream
      return Stream.value([]);
    }

    // Listen to the current user's document in real-time
    return FirebaseFirestore.instance
        .collection('users')
        .doc(userId)
        .snapshots()
        .asyncMap((userDoc) async {
      if (userDoc.exists) {
        // Extract the friends field (list of maps)
        final List<dynamic> friendsList = userDoc.data()?['friends'] ?? [];

        // If no friends, return an empty list
        if (friendsList.isEmpty) {
          return [];
        }

        // Create a list of friend document fetches
        final List<Future<Map<String, dynamic>>> friendFutures =
            friendsList.map((friend) async {
          final String friendUid = friend['uid'];
          // Get the friend's document
          final DocumentSnapshot friendDoc = await FirebaseFirestore.instance
              .collection('users')
              .doc(friendUid)
              .get();

          if (friendDoc.exists) {
            final Map<String, dynamic> friendData =
                friendDoc.data() as Map<String, dynamic>;
            return {
              'uid': friendData['uid'] ?? '',
              'username': friendData['username'] ?? '',
            };
          } else {
            return {'uid': friendUid, 'username': 'Unknown'};
          }
        }).toList();

        // Wait for all friend documents to be fetched
        return await Future.wait(friendFutures);
      } else {
        // If user document doesn't exist, return an empty list
        return [];
      }
    });
  }

  void deleteFriend(Map<String, dynamic> friendToRemove) async {
    userId = FirebaseAuth.instance.currentUser?.uid;
    name = FirebaseAuth.instance.currentUser?.displayName;

    if (userId != null && name != null) {
      try {
        // Get the current user's friends list
        DocumentReference currentUserDoc =
            FirebaseFirestore.instance.collection('users').doc(userId);

        DocumentSnapshot currentUserSnapshot = await currentUserDoc.get();
        final currentUserData =
            currentUserSnapshot.data() as Map<String, dynamic>;
        final List<dynamic> currentUserFriends =
            currentUserData['friends'] ?? [];

        // Filter out the friend to remove
        final updatedFriends = currentUserFriends
            .where((friend) => friend['uid'] != friendToRemove['uid'])
            .toList();

        // Update the current user's friends list
        await currentUserDoc.update({'friends': updatedFriends});

        // Get the friend's document and their friends list
        DocumentReference friendDoc = FirebaseFirestore.instance
            .collection('users')
            .doc(friendToRemove['uid']);

        DocumentSnapshot friendSnapshot = await friendDoc.get();
        final friendData = friendSnapshot.data() as Map<String, dynamic>;
        final List<dynamic> friendFriends = friendData['friends'] ?? [];

        // Filter out the current user from the friend's friends list
        final updatedFriendFriends =
            friendFriends.where((friend) => friend['uid'] != userId).toList();

        // Update the friend's friends list
        await friendDoc.update({'friends': updatedFriendFriends});

        // Optionally: Show a message or update the UI
        print(
            '${friendToRemove['username']} has been removed from your friends list.');
      } catch (e) {
        print('Error while removing friend: $e');
      }
    }
  }

  Stream<List<Map<String, dynamic>>> getRequests() {
    // Get the current user's ID
    userId = FirebaseAuth.instance.currentUser?.uid;

    if (userId == null) {
      // If user is not logged in, return an empty stream
      return Stream.value([]);
    }

    // Listen to the current user's document in real-time
    return FirebaseFirestore.instance
        .collection('users')
        .doc(userId)
        .snapshots()
        .asyncMap((userDoc) async {
      if (userDoc.exists) {
        // Extract the friends field (list of maps)
        final List<dynamic> requestsList = userDoc.data()?['requests'] ?? [];

        // If no requests, return an empty list
        if (requestsList.isEmpty) {
          return [];
        }

        // Create a list of friend document fetches
        final List<Future<Map<String, dynamic>>> friendFutures =
            requestsList.map((friend) async {
          final String friendUid = friend['uid'];
          // Get the friend's document
          final DocumentSnapshot friendDoc = await FirebaseFirestore.instance
              .collection('users')
              .doc(friendUid)
              .get();

          if (friendDoc.exists) {
            final Map<String, dynamic> friendData =
                friendDoc.data() as Map<String, dynamic>;
            return {
              'uid': friendData['uid'] ?? '',
              'username': friendData['username'] ?? '',
            };
          } else {
            return {'uid': friendUid, 'username': 'Unknown'};
          }
        }).toList();

        // Wait for all friend documents to be fetched
        return await Future.wait(friendFutures);
      } else {
        // If user document doesn't exist, return an empty list
        return [];
      }
    });
  }

  void acceptRequest(Map<String, dynamic> friendToAdd) async {
    final userId = FirebaseAuth.instance.currentUser?.uid;
    final name = FirebaseAuth.instance.currentUser?.displayName;

    if (userId != null && name != null) {
      try {
        // Get the current user's document
        DocumentReference currentUserDoc =
            FirebaseFirestore.instance.collection('users').doc(userId);

        DocumentSnapshot currentUserSnapshot = await currentUserDoc.get();
        final currentUserData =
            currentUserSnapshot.data() as Map<String, dynamic>;
        final List<dynamic> currentUserRequests =
            currentUserData['requests'] ?? [];
        final List<dynamic> currentUserFriends =
            currentUserData['friends'] ?? [];

        // Filter out the request and add to friends list
        final updatedRequests = currentUserRequests
            .where((request) => request['uid'] != friendToAdd['uid'])
            .toList();
        final updatedFriends = [
          ...currentUserFriends,
          {'uid': friendToAdd['uid'], 'username': friendToAdd['username']}
        ];

        // Update the current user's document
        await currentUserDoc.update({
          'friends': updatedFriends,
          'requests': updatedRequests,
        });

        // Get the friend's document
        DocumentReference friendDoc = FirebaseFirestore.instance
            .collection('users')
            .doc(friendToAdd['uid']);

        DocumentSnapshot friendSnapshot = await friendDoc.get();
        final friendData = friendSnapshot.data() as Map<String, dynamic>;
        final List<dynamic> friendFriends = friendData['friends'] ?? [];

        // Add the current user to the friend's friends list
        final updatedFriendFriends = [
          ...friendFriends,
          {'uid': userId, 'username': name}
        ];

        await friendDoc.update({
          'friends': updatedFriendFriends,
        });

        print(
            '${friendToAdd['username']} has been added to your friends list.');
      } catch (e) {
        print('Error while accepting friend request: $e');
      }
    }
  }

  void refuseRequest(Map<String, dynamic> friendToRefuse) async {
    final userId = FirebaseAuth.instance.currentUser?.uid;

    if (userId != null) {
      try {
        // Get the current user's document
        DocumentReference currentUserDoc =
            FirebaseFirestore.instance.collection('users').doc(userId);

        DocumentSnapshot currentUserSnapshot = await currentUserDoc.get();
        final currentUserData =
            currentUserSnapshot.data() as Map<String, dynamic>;
        final List<dynamic> currentUserRequests =
            currentUserData['requests'] ?? [];

        // Filter out the request
        final updatedRequests = currentUserRequests
            .where((request) => request['uid'] != friendToRefuse['uid'])
            .toList();

        // Update the current user's document
        await currentUserDoc.update({
          'requests': updatedRequests,
        });

        print('${friendToRefuse['username']} has been refused.');
      } catch (e) {
        print('Error while refusing friend request: $e');
      }
    }
  }
}
