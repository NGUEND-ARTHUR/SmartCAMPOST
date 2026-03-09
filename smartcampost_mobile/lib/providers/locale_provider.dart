import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smartcampost_mobile/core/constants.dart';

class LocaleProvider extends ChangeNotifier {
  Locale _locale = const Locale('fr');
  Map<String, String> _translations = {};

  Locale get locale => _locale;
  Map<String, String> get translations => _translations;

  String tr(String key) => _translations[key] ?? key;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString(AppConstants.languageKey) ?? 'fr';
    await setLocale(Locale(code));
  }

  Future<void> setLocale(Locale locale) async {
    _locale = locale;
    await _loadTranslations(locale.languageCode);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.languageKey, locale.languageCode);
    notifyListeners();
  }

  Future<void> _loadTranslations(String langCode) async {
    final jsonStr = await rootBundle.loadString('assets/i18n/$langCode.json');
    final Map<String, dynamic> jsonMap = jsonDecode(jsonStr);
    _translations = jsonMap.map((k, v) => MapEntry(k, v.toString()));
  }

  void toggleLocale() {
    if (_locale.languageCode == 'fr') {
      setLocale(const Locale('en'));
    } else {
      setLocale(const Locale('fr'));
    }
  }
}
