import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:mobile/Screen/home_screen.dart';
import 'package:mobile/Screen/login_screen.dart';
import 'package:mobile/Services/authentication.dart';
import 'package:mobile/Services/settings_service.dart';
import 'package:mobile/Widget/button.dart';
import 'package:mobile/Widget/snack_bar.dart';
import 'package:mobile/Widget/text_field.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  // for controller
  SettingsService settingsService = SettingsService();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController nameController = TextEditingController();
  bool isLoading = false;
  bool hasClickedOnce = false;
  bool showPassword = false;
  String? selectedAvatarUrl;

  // Liste d'URLs d'avatars
  List<String> avatarUrls = [];

  @override
  void initState() {
    super.initState();
    fetchAvatars();
  }

  // Récupère les URLs d'avatars depuis Firebase Storage
  Future<void> fetchAvatars() async {
    final storageRef = FirebaseStorage.instance.ref().child('avatars');
    final ListResult result = await storageRef.listAll();
    List<String> urls = [];

    for (var ref in result.items) {
      final url = await ref.getDownloadURL();
      urls.add(url);
    }

    setState(() {
      avatarUrls = urls;
      selectedAvatarUrl = avatarUrls.isNotEmpty ? avatarUrls[0] : null;
    });
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    nameController.dispose();
    super.dispose();
  }

  void signUpUser() async {
    setState(() {
      hasClickedOnce = true;
    });
    FocusScope.of(context).unfocus(); // Fermer le clavier
    String res = await AuthServices().signUpUser(
      email: emailController.text,
      password: passwordController.text,
      name: nameController.text,
      avatarUrl: selectedAvatarUrl,
      availableAvatars: avatarUrls, // avatars de storage
    );
    if (res == "Success") {
      isLoading = true;
      try {
        DocumentReference channelRef =
            FirebaseFirestore.instance.collection('channels').doc('KAM? PAF!');

        await channelRef.update({
          "messages": FieldValue.arrayUnion([
            {
              "message": "${nameController.text} a rejoint la plateforme.",
              "time": Timestamp.now(),
              "username": nameController.text,
              "fromAdmins": true,
            },
          ])
        });

        // channelService.subscribeToChannelTopics("Salon Général");
      } catch (e) {
        print('Erreur au moment de joindre KAM? PAF!: $e');
      }
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

        isLoading = true;
        hasClickedOnce = false;
        // navigate next screen
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => HomeScreen(name: nameController.text),
          ),
        );
      } else {
        isLoading = false;
        setState(() {
          hasClickedOnce = false;
        });

        // show the error message
        showSnackBar(context, res);
      }
    } else {
      isLoading = false;
      setState(() {
        hasClickedOnce = false;
      });
      showSnackBar(context, res);
    }
  }

  @override
  Widget build(BuildContext context) {
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        SizedBox(
                          height: height / 4,
                          child: const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "KAM? PAF!",
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 80,
                                    fontFamily: "Title",
                                    shadows: [
                                      BoxShadow(
                                        color: Colors.white,
                                        offset: Offset(0, 10),
                                        blurRadius: 150,
                                        spreadRadius: 0,
                                      )
                                    ]),
                              ),
                              Text(
                                "Créez votre compte",
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 30,
                                  fontFamily: "Text",
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 2),
                        TextFieldInput(
                          textEditingController: emailController,
                          hintText: "Adresse courriel",
                          prefixIcon: Icons.email,
                          width: 400,
                          elevation: 15,
                          shadowColor: Colors.amber,
                        ),
                        TextFieldInput(
                          textEditingController: nameController,
                          hintText: "Nom d'utilisateur",
                          maxLength: 12,
                          countChars: true,
                          prefixIcon: Icons.person,
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
                        SizedBox(height: height / 40),
                        const Text(
                          "Choisissez un avatar",
                          style: TextStyle(
                            fontSize: 20,
                            fontFamily: "Text",
                            fontWeight: FontWeight.normal,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Center(
                          child: Wrap(
                            spacing: 15.0,
                            children: avatarUrls.map((avatarUrl) {
                              bool isSelected = selectedAvatarUrl == avatarUrl;
                              return GestureDetector(
                                onTap: () {
                                  setState(() {
                                    selectedAvatarUrl = avatarUrl;
                                  });
                                },
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  transform: isSelected
                                      ? Matrix4.translationValues(0, -10, 0)
                                      : Matrix4.identity(),
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: isSelected
                                          ? Colors.black
                                          : Colors.transparent,
                                      width: 3,
                                    ),
                                    borderRadius: BorderRadius.circular(50),
                                  ),
                                  child: ClipOval(
                                    child: Image.network(
                                      avatarUrl,
                                      width: 80,
                                      height: 80,
                                      fit: BoxFit.cover,
                                      loadingBuilder:
                                          (context, child, loadingProgress) {
                                        if (loadingProgress == null) {
                                          return child;
                                        }
                                        return const CircularProgressIndicator();
                                      },
                                      errorBuilder:
                                          (context, error, stackTrace) {
                                        return const Icon(Icons.error);
                                      },
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                        SizedBox(height: height / 50),
                        hasClickedOnce
                            ? const Padding(
                                padding: EdgeInsets.symmetric(vertical: 26.5),
                                child: CircularProgressIndicator(
                                    color: Colors.white),
                              )
                            : MyButton(onTab: signUpUser, text: "S'inscrire"),
                        SizedBox(height: height / 75),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              "Vous avez déjà un compte? ",
                              style: TextStyle(
                                  fontSize: 22,
                                  fontFamily: "Text",
                                  shadows: [
                                    BoxShadow(
                                      color: Colors.white,
                                      blurRadius: 30,
                                    )
                                  ]),
                            ),
                            GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const LoginScreen(),
                                  ),
                                );
                              },
                              child: Stack(
                                children: <Widget>[
                                  Text(
                                    "Connectez-vous",
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
                                              spreadRadius: 0,
                                              color: Colors.white)
                                        ]),
                                  ),
                                  Text(
                                    "Connectez-vous",
                                    style: TextStyle(
                                      fontSize: 22,
                                      foreground: Paint()
                                        ..style = PaintingStyle.stroke
                                        ..strokeWidth = 1.5
                                        ..color = Colors.white,
                                    ),
                                  ),
                                  const Text(
                                    "Connectez-vous",
                                    style: TextStyle(
                                      fontSize: 22,
                                      color: Color.fromRGBO(12, 230, 164, 0.82),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
