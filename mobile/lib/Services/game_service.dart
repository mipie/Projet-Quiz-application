import 'package:flutter/material.dart';

class GameService with ChangeNotifier {
  int _totalPoints = 0;
  int _questionIndex = 0;
  int _time = 60;
  int _pointGrade = 0;
  int _goodAnswers = 0;
  double _selectedValue = 0.0;
  bool _disable = false;
  bool _isShowResult = false;
  bool _needBonus = false;
  bool _rightAnswer = true;
  bool _isPointGived = false;
  bool _isNext = false;
  bool _isAlreadyAns = false;
  bool _isWaiting = false;
  bool _isWaitingOrg = false;
  bool _interactif = false;
  bool _isPaused = false;
  bool _isPanicMode = false;
  String _userAnswer = '';
  List<int> _selectedChoices = [];

  // Getters
  int get totalPoints => _totalPoints;
  int get questionIndex => _questionIndex;
  int get time => _time;
  int get pointGrade => _pointGrade;
  int get goodAnswers => _goodAnswers;
  double get selectedValue => _selectedValue;
  bool get disable => _disable;
  bool get isShowResult => _isShowResult;
  bool get needBonus => _needBonus;
  bool get rightAnswer => _rightAnswer;
  bool get isPointGived => _isPointGived;
  bool get isNext => _isNext;
  bool get isAlreadyAns => _isAlreadyAns;
  bool get isWaiting => _isWaiting;
  bool get isWaitingOrg => _isWaitingOrg;
  bool get interactif => _interactif;
  bool get isPaused => _isPaused;
  bool get isPanicMode => _isPanicMode;
  String get userAnswer => _userAnswer;
  List<int> get selectedChoices => List.unmodifiable(_selectedChoices);

  // Setters with notification
  set totalPoints(int points) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _totalPoints = points;
      notifyListeners();
    });
  }

  set questionIndex(int index) {
    _questionIndex = index;
    notifyListeners();
  }

  set time(int newTime) {
    _time = newTime;
    notifyListeners();
  }

  set pointGrade(int grade) {
    _pointGrade = grade;
    notifyListeners();
  }

  set goodAnswers(int value) {
    _goodAnswers = value;
    notifyListeners();
  }

  set selectedValue(double value) {
    _selectedValue = value;
    notifyListeners();
  }

  set disable(bool value) {
    _disable = value;
    notifyListeners();
  }

  set isShowResult(bool value) {
    _isShowResult = value;
    notifyListeners();
  }

  set needBonus(bool value) {
    _needBonus = value;
    notifyListeners();
  }

  set rightAnswer(bool value) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _rightAnswer = value;
      notifyListeners();
    });
  }

  set isPointGived(bool value) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _isPointGived = value;
      notifyListeners();
    });
  }

  set isNext(bool value) {
    _isNext = value;
    notifyListeners();
  }

  set isAlreadyAns(bool value) {
    _isAlreadyAns = value;
    notifyListeners();
  }

  set isWaiting(bool value) {
    _isWaiting = value;
    notifyListeners();
  }

  set isWaitingOrg(bool value) {
    _isWaitingOrg = value;
    notifyListeners();
  }

  set interactif(bool value) {
    _interactif = value;
    notifyListeners();
  }

  set isPaused(bool value) {
    _isPaused = value;
    notifyListeners();
  }

  set isPanicMode(bool value) {
    _isPanicMode = value;
    notifyListeners();
  }

  set userAnswer(String answer) {
    _userAnswer = answer;
    notifyListeners();
  }

  void updateSelectedChoices(int index) {
    if (_selectedChoices.contains(index)) {
      _selectedChoices.remove(index);
    } else {
      _selectedChoices.add(index);
    }
    notifyListeners();
  }

  void resetForNextQuestion() {
    _disable = false;
    _isShowResult = false;
    _isPointGived = false;
    _needBonus = false;
    _interactif = false;
    _rightAnswer = true;
    _userAnswer = '';
    _selectedChoices.clear();
    notifyListeners();
  }

  void resetGame() {
    _totalPoints = 0;
    _questionIndex = 0;
    _time = 60;
    _pointGrade = 0;
    _goodAnswers = 0;
    _selectedValue = 0.0;
    _disable = false;
    _isShowResult = false;
    _needBonus = false;
    _rightAnswer = true;
    _isPointGived = false;
    _isNext = false;
    _isAlreadyAns = false;
    _isWaiting = false;
    _isWaitingOrg = false;
    _interactif = true;
    _isPaused = false;
    _isPanicMode = false;
    _userAnswer = '';
    _selectedChoices.clear();
    notifyListeners();
  }
}
