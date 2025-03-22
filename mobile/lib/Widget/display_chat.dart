import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/theme_consts.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/display_chat_consts.dart';
import 'package:provider/provider.dart';

class DisplayMessage extends StatefulWidget {
  final String name;
  final String channel;
  final bool isInGame;

  final Function(bool) onMessagesReceived;
  const DisplayMessage({
    super.key,
    required this.name,
    required this.channel,
    required this.isInGame,
    required this.onMessagesReceived,
  });

  @override
  State<DisplayMessage> createState() => _DisplayMessageState();
}

class _DisplayMessageState extends State<DisplayMessage> {
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  String? userId = FirebaseAuth.instance.currentUser?.uid;

  getAdminMessage(String message) {
    if (message.contains("a été")) {
      String username = message.split(':')[1];
      if (message.contains("canal")) {
        return "${DisplayChatConsts.get("createChannel", settingsService.language)}$username.";
      }
      if (message.contains("salle")) {
        return "${DisplayChatConsts.get("createGameChannel", settingsService.language)}$username.";
      }
    }

    List<String> splitMessage = message.split('a');
    String username = splitMessage[0];

    if (message.contains("join")) {
      if (message.contains("plateform")) {
        return username +
            DisplayChatConsts.get("joinPlateform", settingsService.language);
      }
      if (message.contains("canal")) {
        return username +
            DisplayChatConsts.get("joinCanal", settingsService.language);
      }
      if (message.contains("partie")) {
        return username +
            DisplayChatConsts.get("joinRoom", settingsService.language);
      }
    }
    if (message.contains("quit")) {
      return username + DisplayChatConsts.get("quit", settingsService.language);
    }
    if (message.contains("abandon")) {
      return username +
          DisplayChatConsts.get("abandon", settingsService.language);
    }
    if (message.contains("supp")) {
      return username +
          DisplayChatConsts.get("delete", settingsService.language);
    }
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context);

    double width = MediaQuery.of(context).size.width;

    return StreamBuilder(
      stream: widget.channel.length > 13
          ? channelService.getGameChannelMessages(widget.channel)
          : channelService.getChannelMessages(widget.channel),
      builder: (BuildContext context,
          AsyncSnapshot<List<Map<String, dynamic>>> snapshot) {
        if (snapshot.hasError) {
          return Center(
            child: Text(
              DisplayChatConsts.get("loadError", settingsService.language),
              style: const TextStyle(
                fontFamily: "Text",
                fontSize: 20,
                color: Color.fromARGB(255, 206, 206, 206),
                shadows: [
                  Shadow(
                    blurRadius: 25,
                  ),
                ],
              ),
            ),
          );
        }
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: const CircularProgressIndicator(
              color: Colors.white,
            ),
          );
        }
        if (snapshot.data!.isEmpty) {
          // Ali, revoit ce code please VVV
          WidgetsBinding.instance.addPostFrameCallback((_) {
            widget.onMessagesReceived(true);
          });
          return Center(
            child: Text(
              widget.isInGame
                  ? DisplayChatConsts.get(
                      "hasBeenDeleted", settingsService.language)
                  : DisplayChatConsts.get(
                      "creatorDeleted", settingsService.language),
              style: const TextStyle(
                  fontFamily: "Text",
                  fontSize: 20,
                  color: Color.fromARGB(255, 206, 206, 206),
                  shadows: [
                    Shadow(
                      blurRadius: 25,
                    ),
                  ]),
            ),
          );
        } else {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            widget.onMessagesReceived(false);
            widget.channel.length > 13
                ? channelService.updateGameLastMessageSeen(widget.channel)
                : channelService.updateLastMessageSeen(widget.channel);
          }); // Ali, revoit ce code please ^^^
        }

        return ListView.builder(
          reverse: true,
          itemCount: snapshot.data!.length,
          physics: const BouncingScrollPhysics(),
          itemBuilder: (context, index) {
            Map<String, dynamic> qds = snapshot.data![index];
            Timestamp time = qds['time'];
            DateTime dateTime =
                time.toDate().subtract(const Duration(hours: 5));
            bool isMe = widget.name == qds['username'];
            bool fromAdmins = qds['fromAdmins'] ?? false;

            return fromAdmins
                ? Align(
                    alignment:
                        isMe ? Alignment.centerRight : Alignment.centerLeft,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            getAdminMessage(qds['message']),
                            style: TextStyle(
                                fontSize: 18,
                                fontFamily: "Text",
                                color: qds['message'].contains("join")
                                    ? const Color.fromARGB(255, 46, 107, 48)
                                    : qds['message'].contains("quit") ||
                                            qds['message'].contains("left") ||
                                            qds['message'].contains("abandon")
                                        ? const Color.fromARGB(255, 152, 42, 34)
                                        : Colors.black,
                                shadows: const [
                                  Shadow(color: Colors.white, blurRadius: 15)
                                ]),
                            softWrap: true,
                          ),
                        ],
                      ),
                    ),
                  )
                : Padding(
                    padding:
                        const EdgeInsets.symmetric(vertical: 5, horizontal: 10),
                    child: Align(
                      alignment:
                          isMe ? Alignment.centerRight : Alignment.centerLeft,
                      child: IntrinsicWidth(
                        child: Container(
                          constraints: BoxConstraints(
                            minWidth: width * 0.15,
                            maxWidth: width * 0.5,
                          ),
                          decoration: BoxDecoration(
                              color: isMe
                                  ? ThemeConsts.get("ownMessageBackground",
                                      settingsService.currentTheme)
                                  : const Color.fromRGBO(255, 252, 245, 0.9),
                              shape: BoxShape.rectangle,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: const [
                                BoxShadow(
                                    color: Colors.black26,
                                    offset: Offset(0, 3),
                                    blurRadius: 3),
                              ]),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 5),
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          StreamBuilder(
                                              stream: settingsService
                                                  .getAvatarStream(
                                                      qds["username"]),
                                              builder: (context, snapshot) {
                                                return Container(
                                                  height: 20,
                                                  width: 20,
                                                  decoration: BoxDecoration(
                                                    shape: BoxShape.circle,
                                                    border: Border.all(
                                                      color: Colors.black,
                                                      width: 0.5,
                                                    ),
                                                    image: DecorationImage(
                                                        image: snapshot.data !=
                                                                    "" &&
                                                                snapshot.data !=
                                                                    null
                                                            ? NetworkImage(
                                                                snapshot.data!)
                                                            : const AssetImage(
                                                                "assets/noImage.jpg"),
                                                        fit: BoxFit.cover),
                                                  ),
                                                );
                                              }),
                                          const SizedBox(
                                            width: 8,
                                          ),
                                          Text(
                                            qds['username'],
                                            textAlign: TextAlign.start,
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              fontFamily: "Text",
                                              color: isMe
                                                  ? ThemeConsts.get(
                                                      "ownUsername",
                                                      settingsService
                                                          .currentTheme)
                                                  : Colors.black87,
                                            ),
                                          ),
                                        ],
                                      ),
                                      Text(
                                        "${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}:${dateTime.second.toString().padLeft(2, '0')}",
                                        textAlign: TextAlign.end,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontFamily: "Text",
                                          color: Colors.black54,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  qds['message'],
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontFamily: "Text",
                                    color: Colors.black,
                                  ),
                                  softWrap: true,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
          },
        );
      },
    );
  }
}
