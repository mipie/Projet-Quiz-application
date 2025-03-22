import 'package:flutter/material.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/dialog.dart';
import 'package:mobile/Widget/join_code_consts.dart';
import 'package:mobile/Widget/text_field.dart';
import 'package:provider/provider.dart';

class JoinCodeDialog extends StatelessWidget {
  final TextEditingController codeController;

  const JoinCodeDialog({required this.codeController, super.key});

  @override
  Widget build(BuildContext context) {
    SettingsService settingsService = Provider.of<SettingsService>(context);

    return MyDialog(
      title: JoinCodeConsts.get("roomsCode", settingsService.language),
      content: Column(
        children: [
          const SizedBox(height: 20),
          TextFieldInput(
            textEditingController: codeController,
            hintText: "Ex.: 7777",
            prefixIcon: Icons.numbers,
            keyboardType: TextInputType.number,
            borderWidth: 1,
            width: 200,
            borderRadius: 0,
            backgroundColor: Colors.white,
            enabledBorderColor: Colors.grey,
            focusedBorderColor: Colors.black54,
          ),
        ],
      ),
      positiveButtonText: JoinCodeConsts.get("enter", settingsService.language),
      positiveButtonDisable: codeController.text.isEmpty,
      positiveButtonAction: () {
        if (codeController.text.isNotEmpty) {
          Navigator.of(context).pop(true);
        }
      },
      negativeButtonAction: () {
        Navigator.of(context).pop(false);
      },
      negativeButtonText:
          JoinCodeConsts.get("cancel", settingsService.language),
    );
  }
}
