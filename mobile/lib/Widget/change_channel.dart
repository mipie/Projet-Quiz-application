import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/chat_screen_consts.dart';
import 'package:mobile/Screen/theme_consts.dart';
import 'package:mobile/Services/channel_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/change_channel_consts.dart';
import 'package:mobile/Widget/text_field.dart';
import 'package:provider/provider.dart';

class ChangeChannel extends StatefulWidget {
  final String name;
  final String selectedChannel;
  final Function(String) onChannelSelected;

  const ChangeChannel({
    super.key,
    required this.name,
    required this.selectedChannel,
    required this.onChannelSelected,
  });

  @override
  State<ChangeChannel> createState() => _ChangeChannelState();
}

class _ChangeChannelState extends State<ChangeChannel> {
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  String? userId = FirebaseAuth.instance.currentUser?.uid;
  final TextEditingController searchController = TextEditingController();
  String searchText = "";
  Map<String, int> notifications = {};
  final FocusNode focusNode = FocusNode();
  bool isFocused = false;

  @override
  void initState() {
    super.initState();
    searchController.addListener(() {
      setState(() {
        searchText = searchController.text;
      });
    });
    focusNode.addListener(() {
      setState(() {
        isFocused = focusNode.hasFocus;
      });
    });
  }

  void despose() {
    super.dispose();
    searchController.removeListener(() {});
    searchController.dispose();
    focusNode.removeListener(() {});
    focusNode.dispose();
  }

  bool isLandscape(BuildContext context) {
    return MediaQuery.of(context).orientation == Orientation.landscape;
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context, listen: true);
    channelService = Provider.of<ChannelService>(context, listen: false);

    double width = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
          color: ThemeConsts.get(
              "channelSectionBackground", settingsService.currentTheme),
          borderRadius: const BorderRadius.only(
            bottomLeft: Radius.circular(10),
            bottomRight: Radius.circular(10),
          )),
      child: Column(
        children: [
          TextFieldInput(
            focusNode: focusNode,
            textEditingController: searchController,
            hintText: ChangeChannelConsts.get(
                "searchChannel", settingsService.language),
            hintTextColor: Colors.black45,
            prefixIcon: Icons.search_rounded,
            backgroundColor: const Color.fromARGB(204, 233, 232, 232),
            fontSize: 20,
            borderRadius: 10,
            borderWidth: 1,
            enabledBorderColor: Colors.black12,
            focusedBorderColor: Colors.white,
            elevation: 0,
          ),
          const SizedBox(height: 10),
          !isLandscape(context) || !isFocused
              ? Column(
                  children: [
                    StreamBuilder<int>(
                      stream:
                          channelService.getChannelNotifs(widget.name, false),
                      builder: (context, snapshot) {
                        return Stack(
                          alignment: Alignment.topRight,
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                vertical: 5,
                                horizontal: 15,
                              ),
                              child: Text(
                                ChangeChannelConsts.get(
                                    "yourChannels", settingsService.language),
                                style: const TextStyle(
                                    fontFamily: "Text", fontSize: 20),
                              ),
                            ),
                            Positioned(
                              right: 0,
                              top: 0,
                              child: Container(
                                width: 15,
                                height: 15,
                                decoration: BoxDecoration(
                                  color: snapshot.hasData && snapshot.data! > 0
                                      ? Colors.red
                                      : Colors.transparent,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                    StreamBuilder<List<Map<String, dynamic>>>(
                      stream:
                          channelService.searchMyChannels(searchText, false),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState ==
                            ConnectionState.waiting) {
                          return const Center(
                              child: CircularProgressIndicator());
                        }
                        if (snapshot.hasError) {
                          return Center(
                            child: Padding(
                              padding: const EdgeInsets.all(10),
                              child: Text(
                                ChangeChannelConsts.get(
                                    "loadError", settingsService.language),
                                style: const TextStyle(
                                  fontFamily: "Text",
                                  fontSize: 20,
                                  color: Colors.red,
                                ),
                              ),
                            ),
                          );
                        }
                        if (searchText.isNotEmpty &&
                            (!snapshot.hasData || snapshot.data!.isEmpty)) {
                          return Center(
                              child: Padding(
                            padding: EdgeInsets.all(10),
                            child: Text(
                              ChangeChannelConsts.get(
                                  "noChannelsFound", settingsService.language),
                              style: const TextStyle(
                                fontFamily: "Text",
                                fontSize: 20,
                                color: Colors.grey,
                              ),
                            ),
                          ));
                        }

                        var myChannels = snapshot.data ?? [];

                        return ConstrainedBox(
                          constraints: BoxConstraints(maxHeight: height * 0.17),
                          child: IntrinsicHeight(
                            child: SingleChildScrollView(
                              // Utiliser BouncingScrollPhysics
                              child: Column(
                                children: myChannels.map(
                                  (channel) {
                                    bool isGameRoom =
                                        channel["title"].length > 13;
                                    String title = !isGameRoom
                                        ? channel["title"]
                                        : "${ChatScreenConsts.get("room", settingsService.language)}${channelService.unstandardize(channel["title"])}";
                                    return GestureDetector(
                                      onTap: () {
                                        widget.onChannelSelected(
                                            channel["title"]);
                                        print(
                                            "changing channel : ${channel["title"]}");
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 5),
                                        child: Container(
                                          width: width * 0.7 - 60,
                                          padding:
                                              const EdgeInsets.only(left: 5),
                                          decoration: BoxDecoration(
                                            color: Colors.black87,
                                            shape: BoxShape.rectangle,
                                            border: Border.all(
                                                color: Colors.black87),
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
                                              Row(
                                                children: [
                                                  StreamBuilder<int>(
                                                    stream: isGameRoom
                                                        ? channelService
                                                            .getGameChannelTotalNotifs(
                                                                channel[
                                                                    'title'])
                                                        : channelService
                                                            .getNumberNotifications(
                                                                channel[
                                                                    'title'],
                                                                widget.name),
                                                    builder:
                                                        (context, snapshot) {
                                                      if (snapshot.hasData &&
                                                          snapshot.data! > 0) {
                                                        notifications[channel[
                                                                'title']] =
                                                            snapshot.data!;

                                                        return Padding(
                                                          padding:
                                                              const EdgeInsets
                                                                  .only(
                                                                  left: 10),
                                                          child: Container(
                                                            width: 25,
                                                            height: 25,
                                                            decoration:
                                                                const BoxDecoration(
                                                              color: Colors.red,
                                                              shape: BoxShape
                                                                  .circle, // Vérifier shape
                                                            ),
                                                            child: Center(
                                                              child: Text(
                                                                snapshot.data
                                                                    .toString(),
                                                                style:
                                                                    const TextStyle(
                                                                  color: Colors
                                                                      .white,
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .bold,
                                                                  fontFamily:
                                                                      "Text",
                                                                ),
                                                              ),
                                                            ),
                                                          ),
                                                        );
                                                      } else {
                                                        return const SizedBox
                                                            .shrink();
                                                      }
                                                    },
                                                  ),
                                                  Container(
                                                    padding:
                                                        const EdgeInsets.only(
                                                            left: 10),
                                                    child: Text(
                                                      title,
                                                      style: const TextStyle(
                                                          color: Colors.white,
                                                          fontFamily: "Text",
                                                          fontSize: 20),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              channel["title"] != "KAM? PAF!" &&
                                                      !isGameRoom
                                                  ? IconButton(
                                                      onPressed: () async {
                                                        bool quits =
                                                            await channelService
                                                                .quitChannel(
                                                                    context,
                                                                    channel[
                                                                        "title"],
                                                                    widget
                                                                        .name);
                                                        if (quits) {
                                                          if (widget
                                                                  .selectedChannel ==
                                                              channel[
                                                                  'title']) {
                                                            widget
                                                                .onChannelSelected(
                                                                    'KAM? PAF!');
                                                          }
                                                          // setState(() {});
                                                        }
                                                      },
                                                      icon: const Icon(
                                                        Icons.close,
                                                        color: Colors.red,
                                                      ),
                                                    )
                                                  : InkWell(
                                                      onTap: () {
                                                        widget
                                                            .onChannelSelected(
                                                                channel[
                                                                    "title"]);
                                                      },
                                                      child: const SizedBox(
                                                          height: 50,
                                                          width: 50),
                                                    ),
                                            ],
                                          ),
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
                      child: Divider(),
                    ),
                    const SizedBox(height: 20),
                    StreamBuilder<int>(
                      stream:
                          channelService.getChannelNotifs(widget.name, true),
                      builder: (context, snapshot) {
                        return Stack(
                          alignment: Alignment.topRight,
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                vertical: 5,
                                horizontal: 15,
                              ),
                              child: Text(
                                ChangeChannelConsts.get("yourOwnChannels",
                                    settingsService.language),
                                style: const TextStyle(
                                    fontFamily: "Text", fontSize: 20),
                              ),
                            ),
                            Positioned(
                              right: 0,
                              top: 0,
                              child: Container(
                                width: 15,
                                height: 15,
                                decoration: BoxDecoration(
                                  color: snapshot.hasData && snapshot.data! > 0
                                      ? Colors.red
                                      : Colors.transparent,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                    StreamBuilder<List<Map<String, dynamic>>>(
                      stream: channelService.searchMyChannels(searchText, true),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState ==
                            ConnectionState.waiting) {
                          return const Center(
                              child: CircularProgressIndicator());
                        }
                        if (snapshot.hasError) {
                          return Center(
                            child: Padding(
                              padding: const EdgeInsets.all(10),
                              child: Text(
                                ChangeChannelConsts.get(
                                    "loadError", settingsService.language),
                                style: const TextStyle(
                                  fontFamily: "Text",
                                  fontSize: 20,
                                  color: Colors.red,
                                ),
                              ),
                            ),
                          );
                        }
                        if (searchText.isNotEmpty &&
                            (!snapshot.hasData || snapshot.data!.isEmpty)) {
                          return Center(
                              child: Padding(
                            padding: const EdgeInsets.all(10),
                            child: Text(
                              ChangeChannelConsts.get(
                                  "noChannelsFound", settingsService.language),
                              style: const TextStyle(
                                fontFamily: "Text",
                                fontSize: 20,
                                color: Colors.grey,
                              ),
                            ),
                          ));
                        }

                        var myOwnChannels = snapshot.data ?? [];

                        return myOwnChannels.isEmpty
                            ? Padding(
                                padding: EdgeInsets.all(10),
                                child: Text(
                                  ChangeChannelConsts.get("noCreatedChannels",
                                      settingsService.language),
                                  style: const TextStyle(
                                      fontFamily: "Text",
                                      fontSize: 20,
                                      color: Colors.grey),
                                ),
                              )
                            : ConstrainedBox(
                                constraints:
                                    BoxConstraints(maxHeight: height * 0.17),
                                child: IntrinsicHeight(
                                  child: SingleChildScrollView(
                                    child: Column(
                                      children: myOwnChannels.map(
                                        (channel) {
                                          return GestureDetector(
                                            onTap: () {
                                              widget.onChannelSelected(
                                                  channel["title"]);
                                            },
                                            child: Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      vertical: 5),
                                              child: Container(
                                                width: width * 0.7 - 60,
                                                padding: const EdgeInsets.only(
                                                    left: 5),
                                                decoration: BoxDecoration(
                                                  color: Colors.black87,
                                                  shape: BoxShape.rectangle,
                                                  border: Border.all(
                                                      color: Colors.black87),
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
                                                    Row(
                                                      children: [
                                                        StreamBuilder<int>(
                                                          stream: channelService
                                                              .getNumberNotifications(
                                                                  channel[
                                                                      'title'],
                                                                  widget.name),
                                                          builder: (context,
                                                              snapshot) {
                                                            if (snapshot
                                                                    .hasData &&
                                                                snapshot.data! >
                                                                    0) {
                                                              notifications[channel[
                                                                      'title']] =
                                                                  snapshot
                                                                      .data!;

                                                              return Padding(
                                                                padding:
                                                                    const EdgeInsets
                                                                        .only(
                                                                        left:
                                                                            10),
                                                                child:
                                                                    Container(
                                                                  width: 25,
                                                                  height: 25,
                                                                  decoration:
                                                                      BoxDecoration(
                                                                    color: Colors
                                                                        .red,
                                                                    borderRadius:
                                                                        BorderRadius.circular(
                                                                            12.5),
                                                                  ),
                                                                  child: Center(
                                                                    child: Text(
                                                                      snapshot
                                                                          .data
                                                                          .toString(),
                                                                      style:
                                                                          const TextStyle(
                                                                        color: Colors
                                                                            .white,
                                                                        fontWeight:
                                                                            FontWeight.bold,
                                                                        fontFamily:
                                                                            "Text",
                                                                      ),
                                                                    ),
                                                                  ),
                                                                ),
                                                              );
                                                            } else {
                                                              return const SizedBox
                                                                  .shrink();
                                                            }
                                                          },
                                                        ),
                                                        Container(
                                                          padding:
                                                              const EdgeInsets
                                                                  .only(
                                                                  left: 10),
                                                          child: Text(
                                                            channel["title"],
                                                            style: const TextStyle(
                                                                color: Colors
                                                                    .white,
                                                                fontFamily:
                                                                    "Text",
                                                                fontSize: 20),
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                    IconButton(
                                                      onPressed: () async {
                                                        await channelService
                                                            .deleteChannel(
                                                                context,
                                                                channel[
                                                                    "title"],
                                                                widget.name);
                                                        print(
                                                            "widget.selectedChannel : ${widget.selectedChannel}");
                                                        if (widget
                                                                .selectedChannel ==
                                                            channel['title']) {
                                                          widget
                                                              .onChannelSelected(
                                                                  'KAM? PAF!');
                                                        }

                                                        // setState(() {});
                                                      },
                                                      icon: const Icon(
                                                        Icons.delete,
                                                        color: Colors.red,
                                                      ),
                                                    ),
                                                  ],
                                                ),
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
                      child: Divider(),
                    ),
                  ],
                )
              : const SizedBox.shrink(),
        ],
      ),
    );
  }
}
