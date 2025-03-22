import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class TextFieldInput extends StatefulWidget {
  final TextEditingController textEditingController;
  final String hintText;
  final bool showPassword;
  final bool? countChars;
  final IconData? prefixIcon;
  final int? maxLength;
  final Color? hintTextColor;
  final Color? valueTextColor;
  final double? fontSize;
  final Color? backgroundColor;
  final Color? shadowColor;
  final Color? enabledBorderColor;
  final Color? focusedBorderColor;
  final double? borderRadius;
  final double? borderWidth;
  final double? width;
  final double? elevation;
  final double? verticalPadding;
  final double? horizontalPadding;
  final bool? disable;
  final bool? centerText;
  final Function? onTap;
  final FocusNode? focusNode;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;

  const TextFieldInput({
    super.key,
    required this.textEditingController,
    required this.hintText,
    this.showPassword = false,
    this.countChars = false,
    this.prefixIcon,
    this.maxLength,
    this.hintTextColor = const Color.fromRGBO(0, 0, 0, 0.3),
    this.valueTextColor = Colors.black87,
    this.fontSize = 25,
    this.backgroundColor = const Color.fromRGBO(220, 220, 220, 0.8),
    this.shadowColor,
    this.enabledBorderColor = Colors.black87,
    this.focusedBorderColor = Colors.white,
    this.borderRadius = 17,
    this.borderWidth = 5,
    this.width,
    this.elevation = 0,
    this.verticalPadding = 5,
    this.horizontalPadding = 10,
    this.disable = false,
    this.centerText = false,
    this.onTap,
    this.focusNode,
    this.keyboardType = TextInputType.text,
    this.inputFormatters,
  });

  void dispose() {
    textEditingController.dispose();
  }

  @override
  State<TextFieldInput> createState() => _TextFieldInputState();
}

class _TextFieldInputState extends State<TextFieldInput> {
  bool isVisible = false;
  int charCount = 0;

  void changeVisibility() {
    setState(() {
      isVisible = !isVisible;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.width,
      child: Padding(
        padding: EdgeInsets.symmetric(
            horizontal: widget.horizontalPadding!,
            vertical: widget.verticalPadding!),
        child: Stack(
          children: [
            Material(
              elevation: widget.elevation!,
              shadowColor: widget.shadowColor,
              borderRadius: BorderRadius.circular(widget.borderRadius!),
              borderOnForeground: true,
              child: TextField(
                controller: widget.textEditingController,
                inputFormatters: widget.inputFormatters,
                focusNode: widget.focusNode,
                readOnly: widget.disable!,
                textAlign: widget.centerText == true
                    ? TextAlign.center
                    : TextAlign.start,
                keyboardType: widget.keyboardType!,
                maxLength: widget.maxLength,
                obscureText: widget.showPassword && !isVisible,
                obscuringCharacter: "●",
                style: TextStyle(
                  fontFamily: "Text",
                  fontSize: widget.fontSize,
                  color: widget.valueTextColor,
                ),
                decoration: InputDecoration(
                  contentPadding: const EdgeInsets.symmetric(
                    vertical: 10,
                    horizontal: 15,
                  ),
                  prefixIcon: widget.prefixIcon != null
                      ? Icon(
                          widget.prefixIcon,
                          color: const Color.fromRGBO(0, 0, 0, 0.65),
                        )
                      : null,
                  filled: true,
                  fillColor: widget.backgroundColor,
                  suffixIcon: widget.showPassword
                      ? IconButton(
                          icon: Icon(
                            isVisible ? Icons.visibility : Icons.visibility_off,
                          ),
                          onPressed: changeVisibility,
                          color: Colors.black87,
                        )
                      : null,
                  hintText: widget.hintText,
                  hintStyle: TextStyle(
                    color: widget.hintTextColor,
                    fontSize: widget.fontSize,
                    fontFamily: "Text",
                  ),
                  counterText: "",
                  disabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      width: widget.borderWidth!,
                      color: Colors.grey,
                    ),
                    borderRadius: BorderRadius.circular(widget.borderRadius!),
                  ),
                  errorBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      width: widget.borderWidth!,
                      color: const Color.fromRGBO(255, 0, 0, 0.8),
                    ),
                    borderRadius: BorderRadius.circular(widget.borderRadius!),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      width: widget.borderWidth!,
                      color: widget.enabledBorderColor!,
                    ),
                    borderRadius: BorderRadius.circular(widget.borderRadius!),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      width: widget.borderWidth!,
                      color: widget.focusedBorderColor!,
                    ),
                    borderRadius: BorderRadius.circular(widget.borderRadius!),
                  ),
                ),
                onChanged: (text) {
                  setState(() {
                    charCount = text.length;
                  });
                },
                onTap: () {
                  if (widget.onTap != null) {
                    widget.onTap!();
                  }
                },
              ),
            ),
            widget.countChars!
                ? Positioned(
                    right: 15,
                    bottom: 5,
                    child: Text(
                      '$charCount/${widget.maxLength ?? 0}',
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize:
                            widget.fontSize! * 0.7, // Adjust the size as needed
                        fontFamily: "Text",
                      ),
                    ),
                  )
                : Container(),
          ],
        ),
      ),
    );
  }
}
