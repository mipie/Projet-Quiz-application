import 'package:flutter/material.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/button.dart';
import 'package:provider/provider.dart';

class MyDialog extends StatelessWidget {
  final String? text;
  final String? title;
  final Widget? content;
  final String positiveButtonText;
  final bool? positiveButtonDisable;
  final VoidCallback positiveButtonAction;
  final String? negativeButtonText;
  final bool? negativeButtonDisable;
  final VoidCallback? negativeButtonAction;

  const MyDialog({
    super.key,
    this.title = "",
    this.text = "",
    this.content,
    required this.positiveButtonText,
    required this.positiveButtonAction,
    this.positiveButtonDisable = false,
    this.negativeButtonText,
    this.negativeButtonAction,
    this.negativeButtonDisable = false,
  });

  @override
  Widget build(BuildContext context) {
    SettingsService settingsService = Provider.of<SettingsService>(context);
    double width = MediaQuery.of(context).size.width;
    bool isPortrait =
        MediaQuery.of(context).orientation == Orientation.portrait;

    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        width: width * (isPortrait ? 0.7 : 0.55),
        // height: MediaQuery.of(context).size.height * 0.5,
        decoration: BoxDecoration(
          shape: BoxShape.rectangle,
          border: Border.all(color: Colors.black87, width: 5),
          borderRadius: BorderRadius.circular(15),
        ),
        child: Container(
          padding: const EdgeInsets.all(30),
          decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.rectangle,
              border: Border.all(color: Colors.white, width: 5),
              borderRadius: BorderRadius.circular(15),
              image: DecorationImage(
                image: settingsService.currentThemeUrl != ""
                    ? NetworkImage(settingsService.currentThemeUrl)
                    : const AssetImage("assets/noImage.jpg"),
                fit: BoxFit.cover,
                opacity: 0.4,
              )),
          child: SingleChildScrollView(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              mainAxisSize: MainAxisSize.min,
              children: [
                title == null
                    ? const SizedBox()
                    : Center(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 15, bottom: 20),
                          child: Text(
                            title!,
                            style: const TextStyle(
                              fontFamily: "Text",
                              fontSize: 30,
                              shadows: [
                                Shadow(
                                  blurRadius: 50,
                                  color: Colors.white,
                                )
                              ],
                            ),
                          ),
                        ),
                      ),
                content ?? const SizedBox.shrink(),
                text == null
                    ? const SizedBox.shrink()
                    : Center(
                        heightFactor: 1.5,
                        child: Padding(
                          padding:
                              EdgeInsets.only(bottom: content == null ? 40 : 0),
                          child: Text(
                            text!,
                            style: const TextStyle(
                              fontFamily: "Text",
                              fontSize: 20,
                              color: Colors.black87,
                              shadows: [
                                Shadow(
                                  blurRadius: 50,
                                  color: Colors.white,
                                )
                              ],
                            ),
                          ),
                        ),
                      ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    MyButton(
                      onTab: positiveButtonAction,
                      text: positiveButtonText,
                      disabled: positiveButtonDisable,
                      fontSize: 20,
                      width: positiveButtonText.length <= 3
                          ? 80
                          : positiveButtonText.length * 20,
                    ),
                    if (negativeButtonText != null)
                      MyButton(
                        onTab: negativeButtonAction ?? () {},
                        text: negativeButtonText,
                        disabled: negativeButtonDisable,
                        fontSize: 20,
                        width: negativeButtonText!.length <= 3
                            ? 80
                            : negativeButtonText!.length * 20,
                        backgroundColor:
                            const Color.fromARGB(255, 255, 116, 106),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
