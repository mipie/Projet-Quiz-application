import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';

class CameraService {
  final ImagePicker _picker = ImagePicker();
  final FirebaseStorage _storage = FirebaseStorage.instance;

  Future<String?> openCamera() async {
    try {
      final XFile? photo = await _picker.pickImage(source: ImageSource.camera);
      if (photo != null) {
        print("Photo capturée avec succès : ${photo.path}");
        return photo.path;
      } else {
        print("Aucune photo n'a été capturée.");
        return null;
      }
    } catch (e) {
      print("Erreur lors de la capture de l'image : $e");
      return null;
    }
  }

  Future<void> addAvatarToAvailableAvatars(String avatarPath) async {
    final userId = FirebaseAuth.instance.currentUser?.uid;
    if (userId == null) {
      print("User ID not found. Cannot add avatar.");
      return;
    }

    try {
      File originalFile = File(avatarPath);
      img.Image? originalImage =
          img.decodeImage(originalFile.readAsBytesSync());
      if (originalImage == null) {
        print("Erreur lors du décodage de l'image.");
        return;
      }

      img.Image compressedImage = img.copyResize(originalImage, width: 600);
      final compressedFile = File(avatarPath)
        ..writeAsBytesSync(img.encodeJpg(compressedImage, quality: 85));

      final storageRef = _storage.ref().child(
          'avatarsUploaded/$userId/${DateTime.now().millisecondsSinceEpoch}.jpg');

      final uploadTask = await storageRef.putFile(compressedFile);
      final downloadUrl = await uploadTask.ref.getDownloadURL();

      DocumentReference userRef =
          FirebaseFirestore.instance.collection('users').doc(userId);
      await userRef.update({
        'avatar.availableAvatars': FieldValue.arrayUnion([downloadUrl]),
        'avatar.currentAvatar': downloadUrl,
      });

      print("URL de l'avatar ajouté avec succès à availableAvatars.");
    } catch (e) {
      print("Erreur lors de l'ajout de l'avatar : $e");
    }
  }
}
