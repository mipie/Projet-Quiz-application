class RoomService {
  static final RoomService _instance = RoomService._internal();

  RoomService._internal();

  factory RoomService() {
    return _instance;
  }

  String _mode = '';
  int _price = 0;

  String get mode => _mode;
  int get price => _price;

  set mode(String mode) {
    _mode = mode;
  }

  set price(int value) {
    _price = value;
  }
}
