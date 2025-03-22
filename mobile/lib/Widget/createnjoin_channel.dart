import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/theme_consts.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/change_channel_consts.dart';
import 'package:mobile/Widget/createnjoin_channel_consts.dart';
import 'package:mobile/Widget/text_field.dart';
import 'package:mobile/services/channel_service.dart';
import 'package:provider/provider.dart';

class CreatenjoinChannel extends StatefulWidget {
  final String name;
  final Function(String) onChannelSelected;

  const CreatenjoinChannel(
      {super.key, required this.name, required this.onChannelSelected});

  @override
  State<CreatenjoinChannel> createState() => _CreatenjoinChannelState();
}

class _CreatenjoinChannelState extends State<CreatenjoinChannel> {
  SettingsService settingsService = SettingsService();
  ChannelService channelService = ChannelService();
  String? userId = FirebaseAuth.instance.currentUser?.uid;
  final TextEditingController searchController = TextEditingController();
  final TextEditingController createController = TextEditingController();
  final createFocusNode = FocusNode();
  bool isCreateFocused = false;
  final searchFocusNode = FocusNode();
  bool isSearchFocused = false;
  String searchText = "";

  @override
  void initState() {
    super.initState();
    searchController.addListener(() {
      setState(() {
        searchText = searchController.text;
      });
    });
    createController.addListener(() {
      setState(() {});
    });
    createFocusNode.addListener(() {
      setState(() {
        isCreateFocused = createFocusNode.hasFocus;
      });
    });
    searchFocusNode.addListener(() {
      setState(() {
        isSearchFocused = searchFocusNode.hasFocus;
      });
    });
  }

  void despose() {
    super.dispose();
    searchController.removeListener(() {});
    searchController.dispose();
    createController.removeListener(() {});
    createController.dispose();
    createFocusNode.removeListener(() {});
    createFocusNode.dispose();
    searchFocusNode.removeListener(() {});
    searchFocusNode.dispose();
  }

  bool isLandscape(BuildContext context) {
    return MediaQuery.of(context).orientation == Orientation.landscape;
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context, listen: false);

    double width = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
          color: ThemeConsts.get(
              "channelSectionBackground", settingsService.currentTheme),
          borderRadius: const BorderRadius.only(
            bottomLeft: Radius.circular(10),
            bottomRight: Radius.circular(10),
          )),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          isLandscape(context) && (isCreateFocused || isSearchFocused)
              ? const SizedBox.shrink()
              : Padding(
                  padding:
                      const EdgeInsets.symmetric(vertical: 5, horizontal: 3),
                  child: Text(
                    CreatenjoinConsts.get(
                        "createYourChannel", settingsService.language),
                    style: const TextStyle(
                      fontFamily: "Text",
                      fontSize: 20,
                    ),
                  ),
                ),
          isLandscape(context) && isSearchFocused
              ? const SizedBox.shrink()
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    TextFieldInput(
                      focusNode: createFocusNode,
                      textEditingController: createController,
                      hintText: CreatenjoinConsts.get(
                          "channelName", settingsService.language),
                      maxLength: 12,
                      countChars: true,
                      fontSize: 20,
                      backgroundColor: Colors.white,
                      enabledBorderColor: Colors.grey,
                      focusedBorderColor: Colors.black87,
                      borderRadius: 0,
                      borderWidth: 0.5,
                      width: 400,
                    ),
                    Container(
                      decoration: BoxDecoration(
                        color: const Color.fromRGBO(12, 230, 164, 0.82),
                        shape: BoxShape.rectangle,
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: const [
                          BoxShadow(
                            color: Color.fromARGB(17, 0, 0, 0),
                            offset: Offset(0, 2),
                            blurRadius: 2,
                          ),
                        ],
                      ),
                      width: 45,
                      height: 45,
                      child: InkWell(
                        onTap: () async {
                          String channelName = createController.text.trim();
                          if (await channelService
                                  .verifyChannel(createController.text)
                                  .first ==
                              true) {
                            createController.clear();
                            await channelService.createChannel(
                                channelName, widget.name);
                            // channelService.createError =
                            //     "Votre canal a été créé!";
                            widget.onChannelSelected(channelName);
                          }
                          setState(() {});
                        },
                        child: const Center(
                          child: Icon(
                            Icons.add_rounded,
                            color: Colors.white,
                            size: 35,
                          ),
                        ),
                      ),
                    ),
                    !(isLandscape(context) && isCreateFocused)
                        ? const SizedBox.shrink()
                        : StreamBuilder<bool?>(
                            stream: channelService
                                .verifyChannel(createController.text),
                            builder: (context, snapshot) {
                              bool? isValid = snapshot.data;

                              return isValid != false ||
                                      createController.text.isEmpty
                                  ? const SizedBox.shrink()
                                  : Padding(
                                      padding: const EdgeInsets.only(
                                          left: 15, top: 5),
                                      child: Text(
                                        channelService.createError,
                                        style: const TextStyle(
                                          color:
                                              Color.fromARGB(255, 197, 55, 45),
                                          fontFamily: "Text",
                                          fontSize: 20,
                                        ),
                                      ),
                                    );
                            },
                          ),
                  ],
                ),
          isLandscape(context) && (isCreateFocused || isSearchFocused)
              ? const SizedBox.shrink()
              : StreamBuilder<bool?>(
                  stream: channelService.verifyChannel(createController.text),
                  builder: (context, snapshot) {
                    bool? isValid = snapshot.data;

                    return isValid != false || createController.text.isEmpty
                        ? const SizedBox.shrink()
                        : Padding(
                            padding: const EdgeInsets.only(left: 15, top: 5),
                            child: Text(
                              channelService.createError,
                              style: const TextStyle(
                                color: Color.fromARGB(255, 197, 55, 45),
                                fontFamily: "Text",
                                fontSize: 20,
                              ),
                            ),
                          );
                  },
                ),
          isLandscape(context) && (isCreateFocused || isSearchFocused)
              ? const SizedBox.shrink()
              : const SizedBox(height: 20),
          isLandscape(context) && (isCreateFocused || isSearchFocused)
              ? const SizedBox.shrink()
              : Padding(
                  padding: const EdgeInsets.symmetric(
                    vertical: 5,
                    horizontal: 3,
                  ),
                  child: Text(
                    CreatenjoinConsts.get(
                        "joinExistingChannel", settingsService.language),
                    style: const TextStyle(
                      fontFamily: "Text",
                      fontSize: 20,
                    ),
                  ),
                ),
          isLandscape(context) && isCreateFocused
              ? const SizedBox.shrink()
              : TextFieldInput(
                  focusNode: searchFocusNode,
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
          isLandscape(context) && (isCreateFocused || isSearchFocused)
              ? const SizedBox.shrink()
              : const SizedBox(height: 20),
          isLandscape(context) && (isCreateFocused || isSearchFocused)
              ? const SizedBox.shrink()
              : StreamBuilder<List<Map<String, dynamic>>>(
                  stream: channelService.searchOtherChannels(searchText),
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
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
                          CreatenjoinConsts.get(
                              "noChannelsFound", settingsService.language),
                          style: const TextStyle(
                            fontFamily: "Text",
                            fontSize: 20,
                            color: Colors.grey,
                          ),
                        ),
                      ));
                    }

                    var channels = snapshot.data ?? [];
                    print("channels.isEmpty : ${channels.isEmpty}");

                    return channels.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(10),
                              child: Text(
                                CreatenjoinConsts.get(
                                    "joinedAll", settingsService.language),
                                style: const TextStyle(
                                    fontFamily: "Text",
                                    fontSize: 20,
                                    color: Colors.grey),
                              ),
                            ),
                          )
                        : ConstrainedBox(
                            constraints:
                                BoxConstraints(maxHeight: height * 0.17),
                            child: IntrinsicHeight(
                              child: SingleChildScrollView(
                                child: Column(
                                  children: channels.map(
                                    (channel) {
                                      return Container(
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 5, horizontal: 5),
                                        child: GestureDetector(
                                          onTap: () async {
                                            await channelService.joinChannel(
                                                channel["title"], widget.name);
                                            setState(() {
                                              widget.onChannelSelected(
                                                  channel['title']);
                                            });
                                          },
                                          child: Container(
                                            width: width * 0.7 - 60,
                                            padding:
                                                const EdgeInsets.only(left: 15),
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
                                                SizedBox(
                                                  // width: width * 0.7 - 130,
                                                  child: Text(
                                                    channel["title"],
                                                    style: const TextStyle(
                                                        color: Colors.white,
                                                        fontFamily: "Text",
                                                        fontSize: 20),
                                                  ),
                                                ),
                                                Padding(
                                                  padding:
                                                      const EdgeInsets.only(
                                                          right: 5),
                                                  child: IconButton(
                                                    padding: const EdgeInsets
                                                        .symmetric(
                                                        vertical: 12),
                                                    onPressed: () async {
                                                      await channelService
                                                          .joinChannel(
                                                              channel["title"],
                                                              widget.name);
                                                      setState(() {});
                                                    },
                                                    icon: const Icon(
                                                      Icons.exit_to_app,
                                                      color:
                                                          const Color.fromRGBO(
                                                              12,
                                                              230,
                                                              164,
                                                              0.82),
                                                    ),
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
          isLandscape(context) && (isCreateFocused || isSearchFocused)
              ? const SizedBox.shrink()
              : const SizedBox(
                  height: 5,
                  child: Divider(),
                ),
        ],
      ),
    );
  }
}
