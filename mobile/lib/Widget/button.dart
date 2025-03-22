import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';

class MyButton extends StatefulWidget {
  final VoidCallback onTab;
  final String? text;
  final double? fontSize;
  final double? borderRadius;
  final Color? backgroundColor;
  final Color? textColor;
  final double? width;
  final double? height;
  final bool? shadow;
  final bool? disabled;
  final Icon? icon1;
  final Icon? icon2;
  final BoxShape? shape;

  const MyButton({
    super.key,
    required this.onTab,
    this.text,
    this.fontSize = 25,
    this.borderRadius = 19,
    this.backgroundColor = const Color.fromRGBO(12, 230, 164, 0.82),
    this.textColor = Colors.black87,
    this.width = 250,
    this.height,
    this.shadow = true,
    this.disabled = false,
    this.icon1,
    this.icon2,
    this.shape = BoxShape.rectangle,
  });

  @override
  _MyButtonState createState() => _MyButtonState();
}

class _MyButtonState extends State<MyButton> {
  double _scale = 1.0;
  Color? _currentBackgroundColor;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) {
        setState(() {
          _scale = 0.9;
          _currentBackgroundColor = Color.fromRGBO(172, 250, 226, 0.82);
        });
      },
      onTapUp: (_) {
        setState(() {
          _scale = 1.0;
          _currentBackgroundColor = widget.backgroundColor!;
        });
      },
      onTapCancel: () {
        setState(() {
          _scale = 1.0;
          _currentBackgroundColor = widget.backgroundColor!;
        });
      },
      child: ElevatedButton(
        onPressed: widget.disabled!
            ? null
            : () {
                widget.onTab();
                final player = AudioPlayer();
                player.play(AssetSource('clickedButton.mp3'));
              },
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.all(Colors.transparent),
          elevation: WidgetStateProperty.all(0),
          padding: WidgetStateProperty.all(const EdgeInsets.all(0)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Opacity(
            opacity: widget.disabled! ? 0.5 : 1,
            child: AnimatedScale(
              scale: _scale,
              duration:
                  const Duration(milliseconds: 150), // Adjust animation speed
              curve: Curves.easeInOut,
              child: Container(
                width: widget.width,
                height: widget.shape != BoxShape.circle ? widget.height : null,
                decoration: BoxDecoration(
                  shape: widget.shape!,
                  borderRadius: widget.shape != BoxShape.circle
                      ? BorderRadius.circular(25)
                      : null,
                  border: Border.all(color: Colors.black, width: 5.5),
                  boxShadow: !widget.shadow!
                      ? null
                      : const [
                          BoxShadow(
                            offset: Offset(0, 10),
                            blurRadius: 30,
                            spreadRadius: -10,
                          )
                        ],
                ),
                child: Container(
                  width: widget.width,
                  alignment: Alignment.center,
                  padding: const EdgeInsets.symmetric(
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    shape: widget.shape!,
                    borderRadius: widget.shape != BoxShape.circle
                        ? BorderRadius.circular(20)
                        : null,
                    border: Border.all(color: Colors.white, width: 3),
                    color: _currentBackgroundColor ?? widget.backgroundColor,
                  ),
                  child: IntrinsicWidth(
                    child: Row(
                      children: [
                        if (widget.icon1 != null)
                          Padding(
                            padding: const EdgeInsets.all(5),
                            child: widget.icon1!,
                          ),
                        if (widget.text != null)
                          Text(
                            widget.text!,
                            style: TextStyle(
                              fontSize: widget.fontSize,
                              fontFamily: "Text",
                              color: widget.textColor,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
