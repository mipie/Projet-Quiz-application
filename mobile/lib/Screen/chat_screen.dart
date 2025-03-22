import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:mobile/Screen/chat_screen_consts.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/change_channel.dart';
import 'package:mobile/Widget/createnjoin_channel.dart';
import 'package:mobile/Widget/display_chat.dart';
import 'package:mobile/Widget/text_field.dart';
import 'package:provider/provider.dart';

GlobalKey<_ChatScreenState> chatScreenKey = GlobalKey<_ChatScreenState>();

resetChatScreenKey() {
  chatScreenKey = GlobalKey<_ChatScreenState>();
}

class ChatScreen extends StatefulWidget {
  final String name;
  final bool isInGame;
  final String? selectedChannel;
  static const route = "/chat-screen";

  const ChatScreen({
    Key? key,
    required this.name,
    this.selectedChannel,
    required this.isInGame,
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController messageController = TextEditingController();
  final FirebaseAuth auth = FirebaseAuth.instance;
  final FocusNode focusNode = FocusNode();
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  bool isChangeOpen = false;
  bool isCreateOrJoinOpen = false;
  bool isChannelDeleted = false;
  bool isFocused = false;

  void despose() {
    super.dispose();
    messageController.dispose();
  }

  @override
  void initState() {
    super.initState();
    channelService = Provider.of<ChannelService>(context, listen: false);

    focusNode.addListener(() {
      setState(() {
        isFocused = focusNode.hasFocus;
      });
    });
  }

  void onSelectedChannel() {
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context, listen: false);

    double width = MediaQuery.of(context).size.width;
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        decoration: BoxDecoration(
          shape: BoxShape.rectangle,
          border: Border.all(color: Colors.black87, width: 7),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Container(
          decoration: BoxDecoration(
            shape: BoxShape.rectangle,
            border: Border.all(color: Colors.white70, width: 8),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Stack(
            children: [
              Positioned.fill(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: settingsService.currentThemeUrl != ""
                      ? Image.network(
                          settingsService.currentThemeUrl,
                          fit: BoxFit.cover,
                        )
                      : Image.asset(
                          "assets/noImage.jpg",
                          fit: BoxFit.cover,
                        ),
                ),
              ),
              Container(
                width: width * 0.7,
                padding: const EdgeInsets.all(15),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    GestureDetector(
                      onTap: () async {
                        FocusScope.of(context).unfocus();
                        setState(() {
                          isChangeOpen = !isChangeOpen;
                          isCreateOrJoinOpen = false;
                        });
                      },
                      child: Container(
                        height: 75,
                        padding: const EdgeInsets.only(right: 5),
                        decoration: BoxDecoration(
                          shape: BoxShape.rectangle,
                          color: Colors.black,
                          border: Border.all(color: Colors.black, width: 1),
                          borderRadius: isCreateOrJoinOpen || isChangeOpen
                              ? const BorderRadius.only(
                                  topLeft: Radius.circular(10),
                                  topRight: Radius.circular(10),
                                )
                              : BorderRadius.circular(10),
                          boxShadow: const [
                            BoxShadow(
                              offset: Offset(0, 2),
                              blurRadius: 3,
                              spreadRadius: 3,
                              color: Colors.black12,
                            )
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            IconButton(
                              padding: const EdgeInsets.only(left: 12),
                              onPressed: () async {
                                FocusScope.of(context).unfocus();
                                setState(() {
                                  isCreateOrJoinOpen = !isCreateOrJoinOpen;
                                  isChangeOpen = false;
                                });
                              },
                              icon: Icon(
                                isCreateOrJoinOpen
                                    ? Icons.remove_circle
                                    : Icons.add_circle,
                                size: 45,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              ChannelService.selectedChannel.length > 13
                                  ? "${ChatScreenConsts.get("room", settingsService.language)}${channelService.unstandardize(ChannelService.selectedChannel)}"
                                  : ChannelService.selectedChannel,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 30,
                                fontFamily: "Text",
                              ),
                            ),
                            StreamBuilder<int>(
                              stream: channelService
                                  .getTotalNotifications(widget.name),
                              builder: (context, snapshot) {
                                return Stack(
                                  alignment: Alignment.topRight,
                                  children: [
                                    Container(
                                      width: 60,
                                      child: Center(
                                        child: IconButton(
                                          onPressed: () async {
                                            FocusScope.of(context).unfocus();
                                            setState(() {
                                              isChangeOpen = !isChangeOpen;
                                              isCreateOrJoinOpen = false;
                                            });
                                          },
                                          icon: Icon(
                                            isChangeOpen
                                                ? FontAwesomeIcons.compress
                                                : FontAwesomeIcons.list,
                                            color: Colors.white,
                                            size: 30,
                                          ),
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      right: 8,
                                      top: 15,
                                      child: Container(
                                        width: 15,
                                        height: 15,
                                        decoration: BoxDecoration(
                                          color: snapshot.hasData &&
                                                  snapshot.data! > 0
                                              ? Colors.red
                                              : Colors.transparent,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                              },
                            )
                          ],
                        ),
                      ),
                    ),
                    // AnimatedSize(
                    //   duration: const Duration(milliseconds: 300),
                    //   curve: Curves.easeInOut,
                    //   child:
                    isFocused
                        ? const SizedBox.shrink()
                        : isChangeOpen
                            ? ChangeChannel(
                                name: widget.name,
                                selectedChannel: ChannelService.selectedChannel,
                                onChannelSelected: (channel) {
                                  setState(() {
                                    print("changing channel : $channel");
                                    ChannelService.selectedChannel = channel;
                                    isCreateOrJoinOpen = false;
                                    isChangeOpen = false;
                                    isChannelDeleted = false;
                                  });
                                },
                              )
                            : isCreateOrJoinOpen
                                ? CreatenjoinChannel(
                                    name: widget.name,
                                    onChannelSelected: (channel) {
                                      setState(() {
                                        ChannelService.selectedChannel =
                                            channel;
                                        isChangeOpen = false;
                                        isCreateOrJoinOpen = false;
                                        isChannelDeleted = false;
                                      });
                                    },
                                  )
                                : const SizedBox.shrink(),
                    // ),
                    const Divider(
                      color: Colors.white,
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            isCreateOrJoinOpen = false;
                            isChangeOpen = false;
                          });
                        },
                        child: DisplayMessage(
                            name: widget.name,
                            channel: ChannelService.selectedChannel,
                            isInGame: widget.isInGame,
                            onMessagesReceived: (empty) {
                              // Ali, revoit ce code please VVV
                              if (empty ^ isChannelDeleted) {
                                setState(() {
                                  isChannelDeleted = empty;
                                });
                              }
                              // Ali, revoit ce code please ^^^
                            }),
                      ),
                    ),
                    const Divider(
                      color: Colors.white,
                    ),
                    ValueListenableBuilder<bool>(
                        valueListenable: ChannelService.isMute,
                        builder: (context, isMute, child) {
                          bool mutePlayer = (isMute &&
                              ChannelService.selectedChannel.length > 13);
                          return Row(
                            children: [
                              Expanded(
                                child: TextFieldInput(
                                  focusNode: focusNode,
                                  disable: isChannelDeleted || mutePlayer,
                                  textEditingController: messageController,
                                  hintText: isChannelDeleted
                                      ? ChatScreenConsts.get(
                                          "cannotSendMessage",
                                          settingsService.language)
                                      : mutePlayer
                                          ? ChatScreenConsts.get(
                                              "orgHasMuteYou",
                                              settingsService.language)
                                          : ChatScreenConsts.get("enterMessage",
                                              settingsService.language),
                                  maxLength: 200,
                                  countChars: !isChannelDeleted && !mutePlayer,
                                  fontSize: 20,
                                  hintTextColor: isChannelDeleted || mutePlayer
                                      ? const Color.fromARGB(255, 192, 52, 42)
                                      : const Color.fromRGBO(0, 0, 0, 0.3),
                                  backgroundColor: isChannelDeleted ||
                                          mutePlayer
                                      ? const Color.fromARGB(255, 206, 206, 206)
                                      : Colors.white,
                                  enabledBorderColor:
                                      isChannelDeleted || mutePlayer
                                          ? Colors.red
                                          : Colors.black,
                                  focusedBorderColor:
                                      isChannelDeleted || mutePlayer
                                          ? Colors.transparent
                                          : Colors.white,
                                  borderRadius: 10,
                                  borderWidth: 0.5,
                                  verticalPadding: 0,
                                  horizontalPadding: 0,
                                  onTap: () {
                                    isCreateOrJoinOpen = false;
                                    isChangeOpen = false;
                                  },
                                ),
                              ),
                              SizedBox(width: width / 130),
                              Container(
                                height: 50,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isChannelDeleted || mutePlayer
                                      ? Colors.black26
                                      : Colors.black87,
                                ),
                                child: IconButton(
                                  onPressed: () {
                                    if (messageController.text.isNotEmpty &&
                                        !isChannelDeleted &&
                                        !mutePlayer) {
                                      channelService.sendMessage(
                                        messageController.text,
                                        widget.name,
                                        ChannelService.selectedChannel,
                                        settingsService.currentAvatarUrl,
                                        ChannelService.selectedChannel.length >
                                            13,
                                      );
                                      ChannelService.selectedChannel.length > 13
                                          ? channelService
                                              .updateGameLastMessageSeen(
                                                  ChannelService
                                                      .selectedChannel)
                                          : channelService
                                              .updateLastMessageSeen(
                                                  ChannelService
                                                      .selectedChannel);
                                      messageController.clear();
                                      setState(() {});
                                    }
                                  },
                                  icon: Icon(
                                    Icons.send_sharp,
                                    size: 25,
                                    color: isChannelDeleted || mutePlayer
                                        ? const Color.fromARGB(
                                            255, 206, 206, 206)
                                        : Colors.white,
                                  ),
                                ),
                              )
                            ],
                          );
                        }),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
