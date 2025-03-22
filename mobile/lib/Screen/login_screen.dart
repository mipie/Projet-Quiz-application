import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/home_screen.dart';
import 'package:mobile/Screen/signup_screen.dart';
import 'package:mobile/Services/authentication.dart';
import 'package:mobile/Services/settings_service.dart';
// import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/button.dart';
import 'package:mobile/Widget/snack_bar.dart';
import 'package:mobile/Widget/text_field.dart';
import 'package:provider/provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LogInScreenState();
}

class _LogInScreenState extends State<LoginScreen> {
  // for controller
  final FirebaseAuth auth = FirebaseAuth.instance;
  final TextEditingController nameController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  SettingsService settingsService = SettingsService();
  bool isLoading = false;
  bool hasClickedOnce = false;

  @override
  initState() {
    super.initState();
  }

  void despose() {
    super.dispose();
    nameController.dispose();
    passwordController.dispose();
  }

  void logInUser() async {
    setState(() {
      hasClickedOnce = true;
    });
    String res = await AuthServices().logInUser(
      name: nameController.text,
      password: passwordController.text,
    );
    if (!mounted) {
      setState(() {
        hasClickedOnce = false;
      });
      return;
    }
    // log in success, user created and navigate next page
    // otherwise show the error message
    if (res == "Success") {
      String uid = FirebaseAuth.instance.currentUser?.uid ?? '';
      settingsService.updateAccountLogsHistory(uid);

      setState(() {
        isLoading = true;
      });
      hasClickedOnce = false;
      // navigate next screen
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => HomeScreen(name: nameController.text),
        ),
      );
    } else {
      setState(() {
        isLoading = false;
        hasClickedOnce = false;
      });
      // show the error message
      showSnackBar(context, res);
    }
  }

  @override
  Widget build(BuildContext context) {
    settingsService = Provider.of<SettingsService>(context, listen: false);

    double height = MediaQuery.of(context).size.height;
    return Stack(
      children: [
        Positioned.fill(
          child:
              Image.asset("assets/createPlayBackground.jpg", fit: BoxFit.cover),
        ),
        Scaffold(
          backgroundColor: Colors.transparent,
          body: Padding(
            padding: const EdgeInsets.all(25.0),
            child: Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    SizedBox(
                      height: height / 2.7,
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "KAM? PAF!",
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 120,
                              fontFamily: "Title",
                              shadows: [
                                BoxShadow(
                                  color: Colors.white,
                                  offset: Offset(0, 10),
                                  blurRadius: 150,
                                )
                              ],
                            ),
                          ),
                          Text(
                            "Connectez-vous à votre compte",
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 30,
                              fontFamily: "Text",
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextFieldInput(
                      textEditingController: nameController,
                      hintText: "Nom d'utilisateur",
                      prefixIcon: Icons.person,
                      maxLength: 20,
                      width: 400,
                      elevation: 15,
                      shadowColor: Colors.amber,
                    ),
                    TextFieldInput(
                      textEditingController: passwordController,
                      hintText: "Mot de passe",
                      showPassword: true,
                      prefixIcon: Icons.lock,
                      width: 400,
                      elevation: 15,
                      shadowColor: Colors.amber,
                    ),
                    SizedBox(
                      height: height / 25,
                    ),
                    hasClickedOnce
                        ? const Padding(
                            padding: EdgeInsets.symmetric(vertical: 26.5),
                            child:
                                CircularProgressIndicator(color: Colors.white),
                          )
                        : MyButton(
                            onTab: logInUser,
                            text: "Se connecter",
                          ),
                    SizedBox(
                      height: height / 75,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          "Vous n'avez pas de compte? ",
                          style: TextStyle(
                            fontSize: 22,
                            fontFamily: "Text",
                            shadows: [
                              BoxShadow(
                                color: Colors.white,
                                blurRadius: 30,
                              )
                            ],
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const SignUpScreen(),
                              ),
                            );
                          },
                          child: Stack(
                            children: <Widget>[
                              Text(
                                'Inscrivez-vous',
                                style: TextStyle(
                                  fontSize: 22,
                                  foreground: Paint()
                                    ..style = PaintingStyle.stroke
                                    ..strokeWidth = 5
                                    ..color = Colors.black,
                                  shadows: const [
                                    BoxShadow(
                                        offset: Offset(0, 8),
                                        blurRadius: 20,
                                        color: Colors.white)
                                  ],
                                ),
                              ),
                              Text(
                                'Inscrivez-vous',
                                style: TextStyle(
                                  fontSize: 22,
                                  foreground: Paint()
                                    ..style = PaintingStyle.stroke
                                    ..strokeWidth = 1.5
                                    ..color = Colors.white,
                                ),
                              ),
                              const Text(
                                'Inscrivez-vous',
                                style: TextStyle(
                                  fontSize: 22,
                                  color: Color.fromRGBO(12, 230, 164, 0.82),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
