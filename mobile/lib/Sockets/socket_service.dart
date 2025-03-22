import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  // Singleton pattern
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;

  late IO.Socket _socket;

  // Constructor privé
  SocketService._internal() {
    _initSocket();
  }

  // Initialize socket connection
  void _initSocket() {
    _socket = IO.io(
        'http://192.168.2.102:3001', // Replace with your network IP
        IO.OptionBuilder()
            .setTransports(['websocket']) // Utilise webSocket uniquement
            .enableAutoConnect() // Connexion automatique
            .setReconnectionAttempts(5) // Nombre de tentatives de reconnexion
            .setReconnectionDelay(500) // Délai entre les tentatives
            .build());

    _socket.onConnect((_) {
      print('Connected to the server');
    });

    _socket.onDisconnect((_) {
      print('Disconneted to the server');
    });

    _socket.onError((data) {
      print('Error socket: $data');
    });
  }

  // Méthode pour envoyer un message
  void sendMessage(String event, dynamic data) {
    _socket.emit(event, data);
  }

  // Méthode pour écouter un événement
  void listenToEvent(String event, Function(dynamic) callback) {
    _socket.off(event);
    _socket.on(event, (data) {
      callback(data);
    });
  }

  // Méthode pour se déconnecter
  void disconnect() {
    _socket.disconnect();
  }

  // Méthode pour se déconnecter
  void reconnect() {
    _socket.connect();
  }

  // Méthode pour savoir si il est connecter
  bool isConnect() {
    return _socket.connected;
  }

  void removeAllListeners() {
    _socket.clearListeners();
  }

  void removeListener(String event, Function(dynamic) callback) {
    _socket.off(event, callback);
  }

  void removeEvent(String event) {
    _socket.off(event);
  }
}
