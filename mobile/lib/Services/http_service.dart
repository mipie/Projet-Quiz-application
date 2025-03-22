import 'dart:convert';

import 'package:http/http.dart' as http;

class HttpService {
  final String baseUrl = 'http://192.168.2.102:3000/api';

  // GET REQUEST
  Future<dynamic> get(String endpoint) async {
    final response = await http.get(Uri.parse('$baseUrl/game-data/$endpoint'));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Error with the request GET: ${response.statusCode}');
    }
  }

  // POST REQUEST
  Future<dynamic> post(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/game-data'),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode(data),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Error with the request POST: ${response.statusCode}');
    }
  }

  // PUT REQUEST
  Future<dynamic> put(Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$baseUrl/game-data'),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode(data),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Error with the request PUT: ${response.statusCode}');
    }
  }

  // DELETE REQUEST
  Future<dynamic> delete(String endpoint) async {
    final response =
        await http.delete(Uri.parse('$baseUrl/game-data/$endpoint'));

    if (response.statusCode != 204) {
      throw Exception('Error with the request DELETE: ${response.statusCode}');
    }
  }
}
