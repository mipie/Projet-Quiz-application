import 'package:mobile/Sockets/socket_service.dart';

class ObserverService {
  static final ObserverService _instance = ObserverService._internal();
  final SocketService _socketService = SocketService();
  ObserverService._internal();

  factory ObserverService() {
    return _instance;
  }

  bool _isOrg = true;
  bool _isLoading = false;
  String _playerName = '';

  bool get isOrg => _isOrg;
  bool get isLoading => _isLoading;
  String get playerName => _playerName;

  set isOrg(bool isOrg) {
    _isOrg = isOrg;
  }

  set isLoading(bool isLoading) {
    _isLoading = isLoading;
  }

  set playerName(String playerName) {
    _playerName = playerName;
  }

  void changeObserver(String player) {
    if (player == 'Organisateur') {
      isOrg = true;
    } else {
      isOrg = false;
    }
    _isLoading = true;
    _playerName = player;
    _socketService.sendMessage('changeObs', player);
  }

  void resetObs() {
    _isOrg = true;
    _playerName = '';
    _isLoading = false;
  }
}
