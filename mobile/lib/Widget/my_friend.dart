import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Services/friend_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/my_friend_consts.dart';
import 'package:provider/provider.dart';

class MyFriend extends StatefulWidget {
  const MyFriend({super.key});

  @override
  _MyFriendState createState() => _MyFriendState();
}

class _MyFriendState extends State<MyFriend> {
  SettingsService settingsService = SettingsService();
  FriendService friendService = FriendService();

  String? currentUserUID;

  @override
  void initState() {
    super.initState();
    // Récupère l'UID de l'utilisateur connecté
    currentUserUID = FirebaseAuth.instance.currentUser?.uid;
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context, listen: false);

    double width = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;

    return Container(
      width: width * 0.7,
      decoration: const BoxDecoration(
        color: Colors.white38,
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: currentUserUID == null
            ? Center(
                child: Text(
                  MyFriendsConsts.get("notConnected", settingsService.language),
                  style: const TextStyle(
                    fontFamily: "Text",
                    fontSize: 20,
                    color: Colors.grey,
                    shadows: [
                      Shadow(
                        color: Colors.white,
                        blurRadius: 20,
                      )
                    ],
                  ),
                ),
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    MyFriendsConsts.get(
                        "friendsRequests", settingsService.language),
                    style: const TextStyle(
                      fontSize: 20,
                      fontFamily: "Text",
                    ),
                  ),
                  const SizedBox(height: 8),
                  StreamBuilder(
                    stream: friendService.getRequests(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(
                          child: const CircularProgressIndicator(
                            color: Colors.white,
                          ),
                        );
                      }
                      if (snapshot.data == null || snapshot.hasError) {
                        return Expanded(
                          child: Center(
                            child: Text(
                              MyFriendsConsts.get(
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

                      List<Map<String, dynamic>> requests = snapshot.data!;

                      return requests.isEmpty
                          ? Padding(
                              padding: EdgeInsets.all(10),
                              child: Text(
                                MyFriendsConsts.get(
                                    "noRequests", settingsService.language),
                                style: const TextStyle(
                                    fontFamily: "Text",
                                    fontSize: 20,
                                    color: Colors.grey,
                                    shadows: [
                                      Shadow(
                                        color: Colors.white,
                                        blurRadius: 20,
                                      ),
                                    ]),
                              ),
                            )
                          : ConstrainedBox(
                              constraints:
                                  BoxConstraints(maxHeight: height * 0.17),
                              child: IntrinsicHeight(
                                child: SingleChildScrollView(
                                  child: Column(
                                    children: requests.map(
                                      (request) {
                                        return Container(
                                          padding: const EdgeInsets.symmetric(
                                              vertical: 5),
                                          child: Container(
                                            width: width * 0.7 - 60,
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 5),
                                            decoration: BoxDecoration(
                                              color: Colors.white70,
                                              shape: BoxShape.rectangle,
                                              border: Border.all(
                                                  color: Colors.white),
                                              borderRadius:
                                                  BorderRadius.circular(10),
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
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Padding(
                                                  padding: const EdgeInsets
                                                      .symmetric(
                                                      horizontal: 10),
                                                  child: Text(
                                                    request['username']!,
                                                    style: const TextStyle(
                                                      color: Colors.black87,
                                                      fontFamily: "Text",
                                                      fontSize: 20,
                                                    ),
                                                  ),
                                                ),
                                                Row(
                                                  children: [
                                                    IconButton(
                                                      icon: const Icon(
                                                        Icons.thumb_up,
                                                        color: const Color
                                                            .fromRGBO(
                                                            12, 230, 164, 0.82),
                                                      ),
                                                      onPressed: () {
                                                        friendService.acceptRequest(
                                                            request); // Accepter la demande
                                                      },
                                                    ),
                                                    IconButton(
                                                      icon: const Icon(
                                                        Icons.thumb_down,
                                                        color: Colors.red,
                                                      ),
                                                      onPressed: () {
                                                        friendService.refuseRequest(
                                                            request); // Refuser la demande
                                                      },
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                        );
                                      },
                                    ).toList(),
                                  ),
                                ),
                              ),
                            );
                    },
                  ),
                  const SizedBox(
                    height: 5,
                  ),
                  const SizedBox(height: 30),
                  Text(
                    MyFriendsConsts.get(
                        "yourFriends", settingsService.language),
                    style: const TextStyle(
                      fontSize: 20,
                      fontFamily: "Text",
                    ),
                  ),
                  const SizedBox(height: 8),
                  StreamBuilder(
                    stream: friendService.getFriends(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(
                          child: const CircularProgressIndicator(
                            color: Colors.white,
                          ),
                        );
                      }
                      if (snapshot.data == null || snapshot.hasError) {
                        return Expanded(
                          child: Center(
                            child: Text(
                              MyFriendsConsts.get(
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

                      List<Map<String, dynamic>> friends = snapshot.data!;

                      return friends.isEmpty
                          ? Padding(
                              padding: const EdgeInsets.all(10),
                              child: Text(
                                MyFriendsConsts.get(
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
                                  ],
                                ),
                              ),
                            )
                          : IntrinsicHeight(
                              child: SingleChildScrollView(
                                child: Column(
                                  children: friends.map(
                                    (friend) {
                                      return Container(
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 5),
                                        child: Container(
                                          width: width * 0.7 - 60,
                                          // height: 50,
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 5),
                                          decoration: BoxDecoration(
                                            color: Colors.white70,
                                            shape: BoxShape.rectangle,
                                            border:
                                                Border.all(color: Colors.white),
                                            borderRadius:
                                                BorderRadius.circular(10),
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
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                        horizontal: 10),
                                                child: Text(
                                                  friend['username']!,
                                                  style: const TextStyle(
                                                    color: Colors.black87,
                                                    fontFamily: "Text",
                                                    fontSize: 20,
                                                  ),
                                                ),
                                              ),
                                              IconButton(
                                                icon: const Icon(
                                                  Icons.delete,
                                                  color: Colors.red,
                                                ),
                                                onPressed: () {
                                                  friendService
                                                      .deleteFriend(friend);
                                                },
                                              ),
                                            ],
                                          ),
                                        ),
                                      );
                                    },
                                  ).toList(),
                                ),
                              ),
                            );
                    },
                  ),
                  //   ],
                  // );
                  // },
                  // ),
                ],
              ),
      ),
    );
  }
}
