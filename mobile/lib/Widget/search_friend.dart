import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/search_friend_consts.dart';
import 'package:mobile/Widget/text_field.dart';
import 'package:provider/provider.dart';

class SearchFriend extends StatefulWidget {
  const SearchFriend({super.key});

  @override
  State<SearchFriend> createState() => _SearchFriendState();
}

class _SearchFriendState extends State<SearchFriend> {
  SettingsService settingsService = SettingsService();
  final TextEditingController searchController = TextEditingController();
  String? userId = FirebaseAuth.instance.currentUser?.uid;
  String? name = FirebaseAuth.instance.currentUser!.displayName;
  String searchText = '';

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  Stream<List<Map<String, dynamic>>> getSearchResults() async* {
    try {
      final friendsStream = FirebaseFirestore.instance
          .collection("users")
          .doc(userId)
          .snapshots();
      yield* friendsStream.asyncMap((userDoc) async {
        final friends = userDoc.data()?['friends'] != null
            ? List<Map<String, dynamic>>.from(userDoc.data()?['friends'])
            : [];
        final friendsId = friends.map((friend) => friend['uid']).toList();
        final requests = userDoc.data()?['requests'] != null
            ? List<Map<String, dynamic>>.from(userDoc.data()?['requests'])
            : [];
        final requestsId = requests.map((friend) => friend['uid']).toList();

        final usersSnapshot =
            await FirebaseFirestore.instance.collection("users").get();

        return usersSnapshot.docs
            .where((doc) {
              final docId = doc['uid'].toString();
              final username = doc['username'].toString().toLowerCase();

              return username.startsWith(searchText.toLowerCase()) &&
                  docId != userId &&
                  !friendsId.contains(docId) &&
                  !requestsId.contains(docId);
            })
            .map((doc) => doc.data())
            .toList();
      });
    } catch (e) {
      yield [];
    }
  }

  @override
  void initState() {
    super.initState();

    searchController.addListener(() {
      setState(() {
        searchText = searchController.text;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context, listen: false);

    double width = MediaQuery.of(context).size.width;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white38,
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            TextFieldInput(
              textEditingController: searchController,
              hintText: SearchFriendsConsts.get(
                  "searchAFriend", settingsService.language),
              hintTextColor: Colors.black45,
              prefixIcon: Icons.search_rounded,
              backgroundColor: const Color.fromARGB(204, 233, 232, 232),
              fontSize: 20,
              borderRadius: 10,
              borderWidth: 1,
              enabledBorderColor: Colors.black12,
              focusedBorderColor: Colors.white,
              elevation: 0,
              verticalPadding: 0,
            ),
            const SizedBox(height: 13),
            StreamBuilder<List<Map<String, dynamic>>>(
              stream: getSearchResults(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const CircularProgressIndicator(
                    color: Colors.white,
                  );
                }

                if (snapshot.hasError) {
                  return Expanded(
                    child: Center(
                      child: Text(
                        SearchFriendsConsts.get(
                            "error", settingsService.language),
                        style: const TextStyle(
                          fontFamily: "Text",
                          fontSize: 20,
                          color: Color.fromARGB(255, 160, 43, 35),
                          shadows: [
                            Shadow(
                              color: Colors.white,
                              blurRadius: 20,
                            )
                          ],
                        ),
                      ),
                    ),
                  );
                }

                if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return Expanded(
                    child: Center(
                      child: Text(
                        SearchFriendsConsts.get(
                            "noFriends", settingsService.language),
                        style: const TextStyle(
                            fontFamily: "Text",
                            fontSize: 20,
                            color: Colors.grey,
                            shadows: [
                              Shadow(
                                color: Colors.white,
                                blurRadius: 20,
                              )
                            ]),
                      ),
                    ),
                  );
                }

                // Affiche les résultats de la recherche
                return Expanded(
                  child: ListView.builder(
                    itemCount: snapshot.data!.length,
                    itemBuilder: (context, index) {
                      Map<String, dynamic> userData = snapshot.data![index];
                      String username =
                          userData['username'] ?? 'Utilisateur inconnu';
                      String userId = userData['uid'] ?? 'Id inconnu';

                      return StreamBuilder<bool>(
                        stream: isRequested(userId),
                        builder: (context, snapshot) {
                          if (snapshot.connectionState ==
                              ConnectionState.waiting) {
                            return ListTile(
                              title: Text(username),
                              trailing: const CircularProgressIndicator(
                                color: Colors.white,
                              ),
                            );
                          }

                          // Once the Future completes, show the IconButton
                          bool isAdding = snapshot.data ?? false;
                          return Container(
                            padding: const EdgeInsets.symmetric(
                                vertical: 5, horizontal: 5),
                            child: Container(
                              width: width * 0.7 - 60,
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 5),
                              decoration: BoxDecoration(
                                color: Colors.white70,
                                shape: BoxShape.rectangle,
                                border: Border.all(color: Colors.white),
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Colors.black12,
                                    offset: Offset(0, 5),
                                    blurRadius: 5,
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10),
                                    child: Text(
                                      username,
                                      style: const TextStyle(
                                        color: Colors.black87,
                                        fontFamily: "Text",
                                        fontSize: 20,
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    icon: Icon(
                                      isAdding
                                          ? Icons.check_circle
                                          : Icons.person_add,
                                      color: isAdding
                                          ? const Color.fromARGB(
                                              209, 8, 145, 104)
                                          : const Color.fromRGBO(
                                              12, 230, 164, 0.82),
                                    ),
                                    onPressed: () {
                                      if (!isAdding) {
                                        sendFriendRequest(userId);
                                      } else {
                                        alreadyRequested(userId);
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Stream<bool> isRequested(String uid) {
    return FirebaseFirestore.instance
        .collection("users")
        .doc(uid)
        .snapshots()
        .map((userDoc) {
      if (userDoc.exists && userDoc.data()!.containsKey('requests')) {
        return List<Map<String, dynamic>>.from(userDoc.data()!['requests'])
            .map((friend) => friend['uid'])
            .toList()
            .contains(userId);
      } else {
        return false;
      }
    });
  }

  void sendFriendRequest(String uid) {
    FirebaseFirestore.instance.collection("users").doc(uid).update({
      "requests": FieldValue.arrayUnion([
        {
          'username': name,
          'uid': userId,
        }
      ])
    });
  }

  void alreadyRequested(String uid) {
    FirebaseFirestore.instance.collection("users").doc(uid).update({
      "requests": FieldValue.arrayRemove([
        {
          'username': name,
          'uid': userId,
        }
      ])
    });
  }
}
