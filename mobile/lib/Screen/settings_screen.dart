import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/Screen/settings_screen_consts.dart';
import 'package:mobile/Screen/statistics_screen_consts.dart';
import 'package:mobile/Screen/theme_consts.dart';
import 'package:mobile/Services/camera_service.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/text_field.dart';
import 'package:provider/provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final TextEditingController usernameController = TextEditingController();
  final CameraService _cameraService = CameraService();
  final focusNode = FocusNode();
  SettingsService settingsService = SettingsService();
  bool canEdit = false;
  bool isFocused = false;

  void despose() {
    super.dispose();
    usernameController.removeListener(() {});
    usernameController.dispose();
    focusNode.removeListener(() {});
    focusNode.dispose();
  }

  @override
  void initState() {
    super.initState();

    usernameController.text = settingsService.username;
    usernameController.addListener(() {
      setState(() {});
    });
    focusNode.addListener(() {
      setState(() {
        isFocused = focusNode.hasFocus;
      });
    });
  }

  bool isLandscape(BuildContext context) {
    return MediaQuery.of(context).orientation == Orientation.landscape;
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context, listen: false);

    double width = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;

    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        width: width * 0.7,
        height: height * 0.9,
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
              // SingleChildScrollView(
              Container(
                padding: const EdgeInsets.all(15),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    GestureDetector(
                      onTap: () {
                        // Ouvrir ChangeDialog
                      },
                      child: Container(
                        height: 75,
                        decoration: BoxDecoration(
                          shape: BoxShape.rectangle,
                          color: ThemeConsts.get(
                              "profileSettingsHeaderBackground",
                              settingsService.currentTheme),
                          border: Border.all(
                              color: ThemeConsts.get(
                                  "profileSettingsHeaderBorder",
                                  settingsService.currentTheme),
                              width: 1),
                          borderRadius: BorderRadius.circular(10),
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
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              SettingsScreenConsts.get(
                                  "profileSettings", settingsService.language),
                              style: const TextStyle(
                                  color: Colors.black,
                                  fontSize: 30,
                                  fontFamily: "Text"),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const Divider(
                      color: Colors.white,
                    ),
                    IntrinsicHeight(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Container(
                            width: width * 0.3,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 15,
                            ),
                            decoration: BoxDecoration(
                              color: ThemeConsts.get(
                                  "profileSettingSectionBackground",
                                  settingsService.currentTheme),
                              border: const Border.fromBorderSide(
                                  BorderSide(width: 0.5)),
                              borderRadius: const BorderRadius.all(
                                Radius.circular(10),
                              ),
                              boxShadow: const [
                                BoxShadow(
                                  offset: Offset(0, 2),
                                  blurRadius: 3,
                                  spreadRadius: 3,
                                  color: Colors.black12,
                                )
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  SettingsScreenConsts.get(
                                      "username", settingsService.language),
                                  style: const TextStyle(
                                    fontFamily: "Text",
                                    fontSize: 20,
                                  ),
                                ),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    canEdit
                                        ? TextFieldInput(
                                            focusNode: focusNode,
                                            textEditingController:
                                                usernameController,
                                            hintText: settingsService.username,
                                            maxLength: 12,
                                            countChars: true,
                                            fontSize: 16,
                                            backgroundColor: Colors.white,
                                            enabledBorderColor: Colors.grey,
                                            focusedBorderColor: Colors.black87,
                                            borderRadius: 0,
                                            borderWidth: 0.5,
                                            width: isLandscape(context)
                                                ? 200
                                                : 150,
                                            verticalPadding: 10,
                                          )
                                        : GestureDetector(
                                            onTap: () {
                                              canEdit = true;
                                              setState(() {});
                                            },
                                            child: Padding(
                                              padding: const EdgeInsets.all(
                                                10,
                                              ),
                                              child: Container(
                                                width: isLandscape(context)
                                                    ? 180
                                                    : 130,
                                                height: 48,
                                                padding: const EdgeInsets.only(
                                                  top: 2,
                                                  left: 14,
                                                ),
                                                decoration: BoxDecoration(
                                                    border: Border.all(
                                                        color: Colors.black12)),
                                                child: Align(
                                                  alignment:
                                                      Alignment.centerLeft,
                                                  child: Text(
                                                    settingsService.username,
                                                    style: const TextStyle(
                                                        fontFamily: "Text",
                                                        fontSize: 16,
                                                        color: Color.fromARGB(
                                                            183, 0, 0, 0)),
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                    Container(
                                      decoration: BoxDecoration(
                                        color: const Color.fromRGBO(
                                            12, 230, 164, 0.82),
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
                                      width: 35,
                                      height: 35,
                                      child: InkWell(
                                        onTap: () async {
                                          // Changer username dans la BD et adapter UI
                                          if (canEdit) {
                                            String username =
                                                usernameController.text.trim();
                                            if (username.isEmpty) {
                                              canEdit = false;
                                              isFocused = false;
                                            } else {
                                              bool isValid =
                                                  await settingsService
                                                      .changeUsername(
                                                          usernameController
                                                              .text
                                                              .trim());
                                              if (isValid) {
                                                canEdit = false;
                                                isFocused = false;
                                              }
                                            }
                                          } else {
                                            canEdit = true;
                                          }
                                          setState(() {});
                                        },
                                        child: const Center(
                                          child: Icon(
                                            Icons.edit,
                                            color: Colors.white,
                                            size: 25,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                StreamBuilder<bool>(
                                  stream:
                                      settingsService.verifyUsernameRealTime(
                                          usernameController.text),
                                  builder: (context, snapshot) {
                                    bool isValid = snapshot.data ?? true;

                                    return !canEdit || isValid
                                        ? const SizedBox.shrink()
                                        : Text(
                                            settingsService.usernameError,
                                            style: const TextStyle(
                                              color: Color.fromARGB(
                                                  255, 197, 55, 45),
                                              fontFamily: "Text",
                                              fontSize: 15,
                                            ),
                                          );
                                  },
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 15,
                            ),
                            width: width * 0.3,
                            decoration: BoxDecoration(
                              color: ThemeConsts.get(
                                  "profileSettingSectionBackground",
                                  settingsService.currentTheme),
                              border: const Border.fromBorderSide(
                                  BorderSide(width: 0.5)),
                              borderRadius: const BorderRadius.all(
                                Radius.circular(10),
                              ),
                              boxShadow: const [
                                BoxShadow(
                                  offset: Offset(0, 2),
                                  blurRadius: 3,
                                  spreadRadius: 3,
                                  color: Colors.black12,
                                )
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  SettingsScreenConsts.get(
                                      "language", settingsService.language),
                                  style: const TextStyle(
                                    fontFamily: "Text",
                                    fontSize: 20,
                                  ),
                                ),
                                Expanded(
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 7),
                                        child: Text(
                                          SettingsScreenConsts.get("french",
                                              settingsService.language),
                                          style: const TextStyle(
                                            fontFamily: "Text",
                                            fontSize: 15,
                                          ),
                                        ),
                                      ),
                                      StreamBuilder(
                                        stream: settingsService.getLanguage(),
                                        builder: (context, snapshot) {
                                          bool value = snapshot.data == "eng"
                                              ? true
                                              : false;

                                          return Switch(
                                            value: value,
                                            onChanged: (value) async {
                                              await settingsService
                                                  .toggleLanguage();
                                              setState(() {});
                                            },
                                            activeTrackColor:
                                                const Color.fromARGB(
                                                    255, 255, 106, 96),
                                            inactiveTrackColor:
                                                const Color.fromRGBO(
                                                    12, 230, 164, 0.82),
                                            inactiveThumbColor: Colors.white,
                                            trackOutlineColor:
                                                WidgetStateProperty.all(
                                                    Colors.transparent),
                                          );
                                        },
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 7),
                                        child: Text(
                                          SettingsScreenConsts.get("english",
                                              settingsService.language),
                                          style: const TextStyle(
                                            fontFamily: "Text",
                                            fontSize: 15,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(
                      height: 20,
                    ),
                    isLandscape(context) && isFocused
                        ? const SizedBox.shrink()
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 15,
                                ),
                                width: width * 0.3,
                                decoration: BoxDecoration(
                                  color: ThemeConsts.get(
                                      "profileSettingSectionBackground",
                                      settingsService.currentTheme),
                                  border: const Border.fromBorderSide(
                                      BorderSide(width: 0.5)),
                                  borderRadius: const BorderRadius.all(
                                    Radius.circular(10),
                                  ),
                                  boxShadow: const [
                                    BoxShadow(
                                      offset: Offset(0, 2),
                                      blurRadius: 3,
                                      spreadRadius: 3,
                                      color: Colors.black12,
                                    )
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      SettingsScreenConsts.get(
                                          "avatar", settingsService.language),
                                      style: const TextStyle(
                                        fontFamily: "Text",
                                        fontSize: 20,
                                      ),
                                    ),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.center,
                                      children: [
                                        Expanded(
                                          child: SizedBox(
                                            height: height * 0.1,
                                            child: StreamBuilder(
                                              stream: // Changer pour la liste settingsService.avatarsUrls
                                                  settingsService.getAvatars(),
                                              builder: (context, snapshot) {
                                                if (snapshot.hasError) {
                                                  return Align(
                                                    alignment: Alignment.center,
                                                    child: Text(
                                                      StatisticsScreenConsts
                                                          .get(
                                                              'error',
                                                              settingsService
                                                                  .language),
                                                      style: const TextStyle(
                                                        fontFamily: "Text",
                                                        fontSize: 20,
                                                        color: Color.fromARGB(
                                                            255, 113, 6, 6),
                                                      ),
                                                    ),
                                                  );
                                                }
                                                if (snapshot.connectionState ==
                                                    ConnectionState.waiting) {
                                                  return const Center(
                                                    child:
                                                        const CircularProgressIndicator(
                                                      color: Colors.white,
                                                    ),
                                                  );
                                                }
                                                return ListView.builder(
                                                  scrollDirection:
                                                      Axis.horizontal,
                                                  itemCount:
                                                      snapshot.data!.length,
                                                  physics:
                                                      const BouncingScrollPhysics(),
                                                  itemBuilder:
                                                      (context, index) {
                                                    String avatarUrl =
                                                        snapshot.data![index];

                                                    bool isCurrentAvatar =
                                                        avatarUrl ==
                                                            settingsService
                                                                .currentAvatarUrl;

                                                    return GestureDetector(
                                                      onTap: () async {
                                                        await settingsService
                                                            .updateCurrentAvatar(
                                                                avatarUrl);
                                                        setState(() {});
                                                      },
                                                      child: Container(
                                                        margin: EdgeInsets
                                                            .symmetric(
                                                                horizontal: 5,
                                                                vertical:
                                                                    isCurrentAvatar
                                                                        ? 12
                                                                        : 10),
                                                        padding:
                                                            const EdgeInsets
                                                                .symmetric(
                                                                vertical: 10,
                                                                horizontal: 30),
                                                        decoration:
                                                            BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                          border: Border.all(
                                                            color:
                                                                isCurrentAvatar
                                                                    ? Colors
                                                                        .black38
                                                                    : Colors
                                                                        .black26,
                                                            width:
                                                                isCurrentAvatar
                                                                    ? 2
                                                                    : 1.5,
                                                          ),
                                                          boxShadow:
                                                              !isCurrentAvatar
                                                                  ? [
                                                                      const BoxShadow(
                                                                          color: Colors
                                                                              .black12,
                                                                          offset: Offset(
                                                                              0,
                                                                              3),
                                                                          blurRadius:
                                                                              5),
                                                                    ]
                                                                  : [],
                                                          image:
                                                              DecorationImage(
                                                            image: avatarUrl !=
                                                                    ""
                                                                ? NetworkImage(
                                                                    avatarUrl)
                                                                : const AssetImage(
                                                                    "assets/noImage.jpg"),
                                                            fit: BoxFit.cover,
                                                          ),
                                                        ),
                                                      ),
                                                    );
                                                  },
                                                );
                                              },
                                            ),
                                          ),
                                        ),
                                        Container(
                                          margin:
                                              const EdgeInsets.only(left: 10),
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                              color: Colors.black26,
                                              width: 1.5,
                                            ),
                                            boxShadow: const [
                                              BoxShadow(
                                                  color: Colors.black12,
                                                  offset: Offset(0, 3),
                                                  blurRadius: 5),
                                            ],
                                          ),
                                          child: IconButton(
                                            icon: const Icon(Icons.camera_alt),
                                            iconSize: 35,
                                            onPressed: () async {
                                              final localPath =
                                                  await _cameraService
                                                      .openCamera();
                                              if (localPath != null) {
                                                await _cameraService
                                                    .addAvatarToAvailableAvatars(
                                                        localPath);
                                              } else {
                                                print("Aucune image capturée.");
                                              }
                                            },
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 15,
                                ),
                                width: width * 0.3,
                                decoration: BoxDecoration(
                                  color: ThemeConsts.get(
                                      "profileSettingSectionBackground",
                                      settingsService.currentTheme),
                                  border: const Border.fromBorderSide(
                                      BorderSide(width: 0.5)),
                                  borderRadius: const BorderRadius.all(
                                    Radius.circular(10),
                                  ),
                                  boxShadow: const [
                                    BoxShadow(
                                      offset: Offset(0, 2),
                                      blurRadius: 3,
                                      spreadRadius: 3,
                                      color: Colors.black12,
                                    )
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      SettingsScreenConsts.get(
                                          "theme", settingsService.language),
                                      style: const TextStyle(
                                        fontFamily: "Text",
                                        fontSize: 20,
                                      ),
                                    ),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.center,
                                      children: [
                                        Expanded(
                                          child: SizedBox(
                                            height: height * 0.1,
                                            child:

                                                // if (snapshot.hasError) {
                                                //   return const Align(
                                                //     alignment: Alignment.center,
                                                //     child: Text(
                                                //       "Il y a eu une erreur!",
                                                //       style: TextStyle(
                                                //         fontFamily: "Text",
                                                //         fontSize: 20,
                                                //         color: Color.fromARGB(
                                                //             255, 113, 6, 6),
                                                //       ),
                                                //     ),
                                                //   );
                                                // }
                                                // if (snapshot.connectionState ==
                                                //     ConnectionState.waiting) {
                                                //   return const Center(
                                                //     child:
                                                //         CircularProgressIndicator(),
                                                //   );
                                                // }
                                                ListView.builder(
                                              scrollDirection: Axis.horizontal,
                                              itemCount: settingsService
                                                  .themesUrls.length,
                                              physics:
                                                  const BouncingScrollPhysics(),
                                              itemBuilder: (context, index) {
                                                String themeUrl =
                                                    settingsService
                                                        .themesUrls[index];

                                                bool isCurrentTheme =
                                                    themeUrl ==
                                                        settingsService
                                                            .currentThemeUrl;

                                                return GestureDetector(
                                                  onTap: () async {
                                                    await settingsService
                                                        .updateCurrentTheme(
                                                            themeUrl);
                                                    setState(() {});
                                                  },
                                                  child: Container(
                                                    margin:
                                                        EdgeInsets.symmetric(
                                                            horizontal: 5,
                                                            vertical:
                                                                isCurrentTheme
                                                                    ? 12
                                                                    : 10),
                                                    padding: const EdgeInsets
                                                        .symmetric(
                                                        vertical: 10,
                                                        horizontal: 30),
                                                    decoration: BoxDecoration(
                                                      shape: BoxShape.circle,
                                                      border: Border.all(
                                                        color: isCurrentTheme
                                                            ? Colors.black38
                                                            : Colors.black26,
                                                        width: isCurrentTheme
                                                            ? 2
                                                            : 1.5,
                                                      ),
                                                      boxShadow: !isCurrentTheme
                                                          ? [
                                                              const BoxShadow(
                                                                  color: Colors
                                                                      .black12,
                                                                  offset:
                                                                      Offset(
                                                                          0, 3),
                                                                  blurRadius:
                                                                      5),
                                                            ]
                                                          : [],
                                                      image: DecorationImage(
                                                        image: themeUrl != ""
                                                            ? NetworkImage(
                                                                themeUrl)
                                                            : const AssetImage(
                                                                "assets/noImage.jpg"),
                                                        fit: BoxFit.cover,
                                                      ),
                                                    ),
                                                  ),
                                                );
                                              },
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                    // Rendre moins large
                    isLandscape(context) && isFocused
                        ? const SizedBox.shrink()
                        : const Divider(
                            color: Colors.white,
                          ),
                    isLandscape(context) && isFocused
                        ? const SizedBox.shrink()
                        : Expanded(
                            child: Container(
                              width: width * 0.4,
                              padding: const EdgeInsets.symmetric(vertical: 5),
                              child: Column(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.only(
                                        top: 5, bottom: 10),
                                    child: Text(
                                      SettingsScreenConsts.get(
                                          "connectionHistory",
                                          settingsService.language),
                                      style: const TextStyle(
                                        fontFamily: "Text",
                                        fontSize: 22.5,
                                      ),
                                    ),
                                  ),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceAround,
                                    children: [
                                      Text(
                                        SettingsScreenConsts.get(
                                            "type", settingsService.language),
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                          fontFamily: "Text",
                                          fontSize: 15,
                                        ),
                                      ),
                                      Text(
                                        SettingsScreenConsts.get(
                                            "date", settingsService.language),
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                          fontFamily: "Text",
                                          fontSize: 15,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const Divider(
                                    color: Colors.black,
                                  ),
                                  Expanded(
                                    child: StreamBuilder(
                                      stream: settingsService
                                          .getAccountLogsHistory(),
                                      builder: (BuildContext context,
                                          AsyncSnapshot<List<Timestamp>>
                                              snapshot) {
                                        if (snapshot.hasError) {
                                          return Text(
                                            SettingsScreenConsts.get(
                                                "errorMessage",
                                                settingsService.language),
                                            style: const TextStyle(
                                              fontFamily: "Text",
                                              fontSize: 15,
                                              shadows: [
                                                Shadow(
                                                  color: Colors.white,
                                                  blurRadius: 25,
                                                ),
                                              ],
                                            ),
                                          );
                                        }
                                        if (snapshot.connectionState ==
                                            ConnectionState.waiting) {
                                          return const Center(
                                            child:
                                                const CircularProgressIndicator(
                                              color: Colors.white,
                                            ),
                                          );
                                        }
                                        if (snapshot.data!.isEmpty) {
                                          return Center(
                                            child: Padding(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      vertical: 10),
                                              child: Text(
                                                SettingsScreenConsts.get(
                                                    "noConnections",
                                                    settingsService.language),
                                                style: const TextStyle(
                                                  fontFamily: "Text",
                                                  fontSize: 15,
                                                  shadows: [
                                                    Shadow(
                                                      color: Colors.white,
                                                      blurRadius: 25,
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          );
                                        }
                                        return ListView.builder(
                                          itemCount: snapshot.data!.length,
                                          physics:
                                              const BouncingScrollPhysics(),
                                          itemBuilder: (context, index) {
                                            String timestamp = DateFormat(
                                                    'yyyy-MM-dd HH:mm:ss')
                                                .format(
                                              snapshot.data![index]
                                                  .toDate()
                                                  .subtract(
                                                      const Duration(hours: 5)),
                                            );

                                            String log = index % 2 == 0
                                                ? SettingsScreenConsts.get(
                                                    "login",
                                                    settingsService.language)
                                                : SettingsScreenConsts.get(
                                                    "logout",
                                                    settingsService.language);

                                            return Align(
                                              alignment: Alignment.center,
                                              child: Padding(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                        vertical: 5),
                                                child: Row(
                                                  children: [
                                                    SizedBox(
                                                      width: width * 0.2,
                                                      child: Text(
                                                        log,
                                                        textAlign:
                                                            TextAlign.center,
                                                        style: const TextStyle(
                                                          fontSize: 18,
                                                          fontFamily: "Text",
                                                          color: Colors.black,
                                                          shadows: [
                                                            Shadow(
                                                              color:
                                                                  Colors.white,
                                                              blurRadius: 20,
                                                            ),
                                                          ],
                                                        ),
                                                      ),
                                                    ),
                                                    SizedBox(
                                                      width: width * 0.2,
                                                      child: Text(
                                                        timestamp,
                                                        textAlign:
                                                            TextAlign.center,
                                                        style: const TextStyle(
                                                          fontSize: 18,
                                                          fontFamily: "Text",
                                                          color: Colors.black,
                                                          shadows: [
                                                            Shadow(
                                                              color:
                                                                  Colors.white,
                                                              blurRadius: 20,
                                                            ),
                                                          ],
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            );
                                          },
                                        );
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                    isLandscape(context) && isFocused
                        ? const SizedBox.shrink()
                        : const Divider(
                            color: Colors.white,
                          ),
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
