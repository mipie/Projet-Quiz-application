import 'package:flutter/material.dart';
import 'package:mobile/Screen/shop_screen_consts.dart';
import 'package:mobile/Screen/theme_consts.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Services/shop_service.dart';
import 'package:mobile/Services/user_service.dart';
import 'package:mobile/Services/wallet_service.dart';
import 'package:mobile/Widget/button.dart';
import 'package:mobile/Widget/dialog.dart';
import 'package:mobile/Widget/snack_bar.dart';
import 'package:provider/provider.dart';

class ShopScreen extends StatefulWidget {
  final String name;

  final List<String> avatarUrls;
  final List<String> themeUrls;
  final List<String> purchasedAvatarUrls;
  final List<String> purchasedThemeUrls;

  const ShopScreen({
    super.key,
    required this.name,
    required this.avatarUrls,
    required this.themeUrls,
    required this.purchasedAvatarUrls,
    required this.purchasedThemeUrls,
  });

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  SettingsService settingsService = SettingsService();
  WalletService walletService = WalletService();
  UserService userService = UserService();

  static const int itemPrice = 100;
  int? selectedAvatarIndex;
  int? selectedThemeIndex;

  Set<int> purchasedAvatars = {};
  Set<int> purchasedThemes = {};

  @override
  void initState() {
    super.initState();

    purchasedAvatars = widget.avatarUrls
        .asMap()
        .entries
        .where((entry) => widget.purchasedAvatarUrls.contains(entry.value))
        .map((entry) => entry.key)
        .toSet();

    purchasedThemes = widget.themeUrls
        .asMap()
        .entries
        .where((entry) => widget.purchasedThemeUrls.contains(entry.value))
        .map((entry) => entry.key)
        .toSet();
  }

  bool isLandscape(BuildContext context) {
    return MediaQuery.of(context).orientation == Orientation.landscape;
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context, listen: true);
    walletService = Provider.of<WalletService>(context, listen: true);

    double width = MediaQuery.of(context).size.width;
    double height = MediaQuery.of(context).size.height;

    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: GestureDetector(
        onTap: () {
          setState(() {
            selectedAvatarIndex = null;
            selectedThemeIndex = null;
          });
        },
        child: Container(
          width: width * 0.7,
          height: height * 0.9,
          decoration: BoxDecoration(
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
                Padding(
                  padding: const EdgeInsets.all(15),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      _buildHeader(),
                      const Divider(color: Colors.white),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.only(top: 10),
                          decoration: const BoxDecoration(
                            shape: BoxShape.rectangle,
                            color: Colors.white38,
                            borderRadius:
                                BorderRadius.vertical(top: Radius.circular(10)),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 15),
                            child: _buildShopSections(),
                          ),
                        ),
                      ),
                      const Divider(color: Colors.white),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      height: 75,
      decoration: BoxDecoration(
        color: ThemeConsts.get(
            "shopHeaderBackground", settingsService.currentTheme),
        border: Border.all(
            color: ThemeConsts.get(
                "shopHeaderBorder", settingsService.currentTheme),
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
      child: Center(
        child: Text(
          ShopScreenConsts.get("shop", settingsService.language),
          style: const TextStyle(
              color: Colors.black, fontSize: 30, fontFamily: "Text"),
        ),
      ),
    );
  }

  Widget _buildShopSections() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            walletService.buildBalanceDisplay(context),
          ],
        ),
        const Divider(color: Colors.black12, height: 20),
        _buildAvatarSection(),
        const Divider(color: Colors.black12, height: 20),
        _buildThemeSection(),
        const Divider(color: Colors.black12, height: 20),
        _buildPurchaseButton(),
      ],
    );
  }

  Widget _buildAvatarSection() {
    double height = MediaQuery.of(context).size.height;
    bool isPortrait =
        MediaQuery.of(context).orientation == Orientation.portrait;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            ShopScreenConsts.get("avatars", settingsService.language),
            style: const TextStyle(
              fontFamily: "Text",
              fontSize: 20,
              shadows: [
                Shadow(
                  color: Colors.white,
                  blurRadius: 10,
                )
              ],
            ),
          ),
          const SizedBox(
            height: 10,
          ),
          SizedBox(
            height: height * (isPortrait ? 0.2 : 0.15),
            child: GridView.builder(
              scrollDirection: Axis.horizontal,
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: isLandscape(context) ? 1 : 2,
                childAspectRatio: 1,
                mainAxisSpacing: 10,
              ),
              itemCount: widget.avatarUrls.length,
              itemBuilder: (context, index) {
                final isPurchased = purchasedAvatars.contains(index);

                return GestureDetector(
                  onTap: isPurchased
                      ? () {}
                      : () {
                          setState(() {
                            selectedAvatarIndex =
                                selectedAvatarIndex == index ? null : index;
                            selectedThemeIndex = null;
                          });
                        },
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Stack(
                        alignment: Alignment.bottomCenter,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            margin: const EdgeInsets.all(5),
                            padding: const EdgeInsets.all(45),
                            decoration: BoxDecoration(
                              color: Colors.transparent,
                              shape: BoxShape.circle,
                              border: selectedAvatarIndex == index &&
                                      !isPurchased
                                  ? Border.all(color: Colors.black87, width: 3)
                                  : Border.all(
                                      color: Colors.black26,
                                      width: 1.5,
                                    ),
                              boxShadow: [
                                BoxShadow(
                                  color: selectedAvatarIndex == index
                                      ? Colors.black54
                                      : !isPurchased
                                          ? Colors.white54
                                          : Colors.transparent,
                                  spreadRadius: 2,
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                              image: DecorationImage(
                                image: widget.avatarUrls.isNotEmpty &&
                                        widget.avatarUrls[index] != ""
                                    ? NetworkImage(widget.avatarUrls[index])
                                    : const AssetImage("assets/noImage.jpg"),
                                fit: BoxFit.cover,
                                opacity: isPurchased ? 0.2 : 1,
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 10,
                            child: Container(
                              width: 75,
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              decoration: const BoxDecoration(
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.white,
                                    blurRadius: 20,
                                    blurStyle: BlurStyle.normal,
                                  ),
                                ],
                              ),
                              child: !isPurchased
                                  ? Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        const Text(
                                          '$itemPrice',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            color: Colors.black,
                                            fontFamily: "Text",
                                            fontSize: 16,
                                            shadows: [
                                              Shadow(
                                                color: Colors.white,
                                                blurRadius: 5,
                                              )
                                            ],
                                          ),
                                        ),
                                        Padding(
                                          padding: const EdgeInsets.only(
                                              left: 5, bottom: 3),
                                          child: Image.asset(
                                            "assets/michtoken.png",
                                            height: 15,
                                          ),
                                        ),
                                      ],
                                    )
                                  : Text(
                                      ShopScreenConsts.get("purchased",
                                          settingsService.language),
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        color: Colors.black,
                                        fontFamily: "Text",
                                        fontSize: 14,
                                        shadows: [
                                          Shadow(
                                            color: Colors.white,
                                            blurRadius: 5,
                                          )
                                        ],
                                      ),
                                    ),
                            ),
                          ),
                        ],
                      ),
                      // ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildThemeSection() {
    double height = MediaQuery.of(context).size.height;
    bool isPortrait =
        MediaQuery.of(context).orientation == Orientation.portrait;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            ShopScreenConsts.get("themes", settingsService.language),
            style: const TextStyle(
              fontFamily: "Text",
              fontSize: 20,
              shadows: [
                Shadow(
                  color: Colors.white,
                  blurRadius: 10,
                )
              ],
            ),
          ),
          const SizedBox(
            height: 10,
          ),
          SizedBox(
            height: height * (isPortrait ? 0.2 : 0.15),
            child: GridView.builder(
              scrollDirection: Axis.horizontal,
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: isLandscape(context) ? 1 : 2,
                childAspectRatio: 1,
                mainAxisSpacing: 10,
              ),
              itemCount: widget.themeUrls.length,
              itemBuilder: (context, index) {
                final isPurchased = purchasedThemes.contains(index);

                return GestureDetector(
                  onTap: isPurchased
                      ? null
                      : () {
                          setState(() {
                            selectedThemeIndex =
                                selectedThemeIndex == index ? null : index;
                            selectedAvatarIndex = null;
                          });
                        },
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Stack(
                        alignment: Alignment.bottomCenter,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            margin: const EdgeInsets.all(5),
                            padding: const EdgeInsets.all(45),
                            decoration: BoxDecoration(
                              color: Colors.transparent,
                              shape: BoxShape.circle,
                              border: selectedThemeIndex == index &&
                                      !isPurchased
                                  ? Border.all(color: Colors.black54, width: 4)
                                  : Border.all(
                                      color: Colors.black26,
                                      width: 1.5,
                                    ),
                              boxShadow: [
                                BoxShadow(
                                  color: selectedThemeIndex == index
                                      ? Colors.black54
                                      : !isPurchased
                                          ? Colors.white54
                                          : Colors.transparent,
                                  spreadRadius: 2,
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                              image: DecorationImage(
                                image: widget.themeUrls.isNotEmpty &&
                                        widget.themeUrls[index] != ""
                                    ? NetworkImage(widget.themeUrls[index])
                                    : const AssetImage("assets/noImage.jpg"),
                                fit: BoxFit.cover,
                                opacity: isPurchased ? 0.2 : 1,
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 10,
                            child: Container(
                              width: 75,
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              decoration: const BoxDecoration(
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.white,
                                    blurRadius: 20,
                                    blurStyle: BlurStyle.normal,
                                  ),
                                ],
                              ),
                              child: !isPurchased
                                  ? Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        const Text(
                                          '$itemPrice',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            color: Colors.black,
                                            fontFamily: "Text",
                                            fontSize: 16,
                                            shadows: [
                                              Shadow(
                                                color: Colors.white,
                                                blurRadius: 5,
                                              )
                                            ],
                                          ),
                                        ),
                                        Padding(
                                          padding: const EdgeInsets.only(
                                              left: 5, bottom: 3),
                                          child: Image.asset(
                                            "assets/michtoken.png",
                                            height: 15,
                                          ),
                                        ),
                                      ],
                                    )
                                  : Text(
                                      ShopScreenConsts.get("purchased",
                                          settingsService.language),
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        color: Colors.black,
                                        fontFamily: "Text",
                                        fontSize: 14,
                                        shadows: [
                                          Shadow(
                                            color: Colors.white,
                                            blurRadius: 5,
                                          )
                                        ],
                                      ),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _purchaseItem(context) {
    if (!walletService.hasEnoughMoney(itemPrice)) {
      showDialog(
          context: context,
          builder: (context) {
            return MyDialog(
              text: ShopScreenConsts.get(
                  "notEnoughMoney", settingsService.language),
              positiveButtonText: "OK!",
              positiveButtonAction: () {
                Navigator.of(context).pop();
              },
            );
          });
      return;
    }
    if (selectedAvatarIndex != null &&
        walletService.hasEnoughMoney(itemPrice)) {
      final avatarUrl = widget.avatarUrls[selectedAvatarIndex!];
      Provider.of<ShopService>(context, listen: false)
          .purchaseAvatar(avatarUrl);
      setState(() {
        purchasedAvatars.add(selectedAvatarIndex!);
        selectedAvatarIndex = null;
        walletService.buy(itemPrice);
      });
      _successfulPurchase();
    } else if (selectedThemeIndex != null &&
        walletService.hasEnoughMoney(itemPrice)) {
      final themeUrl = widget.themeUrls[selectedThemeIndex!];
      Provider.of<ShopService>(context, listen: false).purchaseTheme(themeUrl);
      setState(() {
        purchasedThemes.add(selectedThemeIndex!);
        selectedThemeIndex = null;
        walletService.buy(itemPrice);
      });
      _successfulPurchase();
    }
  }

  void _successfulPurchase() {
    //Lang
    showSnackBar(context,
        ShopScreenConsts.get("successfulPurchase", settingsService.language));
  }

  Widget _buildPurchaseButton() {
    return MyButton(
      onTab: (selectedAvatarIndex != null || selectedThemeIndex != null)
          ? () {
              _purchaseItem(context);
            }
          : () {},
      disabled: !(selectedAvatarIndex != null || selectedThemeIndex != null),
      text: ShopScreenConsts.get("buy", settingsService.language),
      fontSize: 20,
      backgroundColor: const Color.fromRGBO(12, 230, 164, 0.82),
      width: 200,
    );
  }
}
