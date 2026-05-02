import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/models/models.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/providers/parcel_provider.dart';
import 'package:smartcampost_mobile/screens/auth/login_screen.dart';
import 'package:smartcampost_mobile/screens/auth/register_screen.dart';
import 'package:smartcampost_mobile/screens/client/client_dashboard_screen.dart';

class TestLocaleProvider extends LocaleProvider {
  TestLocaleProvider({String languageCode = 'en'}) : _languageCode = languageCode;

  String _languageCode;

  static const Map<String, String> _translations = {
    'dashboard': 'Dashboard',
    'welcome': 'Welcome',
    'dashboard_subtitle': 'Track your parcels and manage deliveries',
    'new_parcel': 'New Parcel',
    'track': 'Track',
    'pickups': 'Pickups',
    'recent_parcels': 'Recent Parcels',
    'see_all': 'See all',
    'no_parcels': 'No parcels available',
    'home': 'Home',
    'parcels': 'Parcels',
    'support': 'Support',
    'profile': 'Profile',
    'login_subtitle': 'Enter your credentials to access your account',
    'phone': 'Phone',
    'password': 'Password',
    'field_required': 'Required',
    'invalid_phone': 'Invalid phone',
    'forgot_password': 'Forgot password?',
    'login': 'Login',
    'or': 'OR',
    'sign_in_with_google': 'Sign in with Google',
    'register': 'Register',
    'full_name': 'Full Name',
    'email': 'Email',
    'optional': 'Optional',
    'confirm_password': 'Confirm Password',
    'preferredLanguage': 'Preferred Language',
    'sendOtp': 'Send OTP',
  };

  @override
  Locale get locale => Locale(_languageCode);

  @override
  String tr(String key) => _translations[key] ?? key;

  @override
  Future<void> init() async {}

  @override
  Future<void> setLocale(Locale locale) async {
    _languageCode = locale.languageCode;
    notifyListeners();
  }

  @override
  void toggleLocale() {
    _languageCode = _languageCode == 'en' ? 'fr' : 'en';
    notifyListeners();
  }
}

class TestParcelProvider extends ParcelProvider {
  @override
  Future<void> loadMyParcels({bool refresh = false}) async {}
}

class TestAuthProvider extends AuthProvider {
  TestAuthProvider(this._user);

  final User _user;

  @override
  User? get user => _user;

  @override
  bool get isLoading => false;

  @override
  bool get isAuthenticated => true;

  @override
  String? get error => null;

  @override
  String get userRole => _user.role;
}

Widget buildTestApp({required Widget child}) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthProvider>.value(
        value: TestAuthProvider(
          User(
            id: '1',
            fullName: 'Jane Doe',
            role: 'CLIENT',
          ),
        ),
      ),
      ChangeNotifierProvider<LocaleProvider>.value(
        value: TestLocaleProvider(),
      ),
      ChangeNotifierProvider<ParcelProvider>.value(
        value: TestParcelProvider(),
      ),
    ],
    child: MaterialApp(home: child),
  );
}

void main() {
  testWidgets('Login screen validates required fields', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      buildTestApp(child: const LoginScreen()),
    );

    expect(find.text('Login'), findsOneWidget);
    await tester.tap(find.text('Login'));
    await tester.pump();

    expect(find.text('Required'), findsNWidgets(2));
  });

  testWidgets('Register screen renders and validates required fields', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      buildTestApp(child: const RegisterScreen()),
    );

    expect(find.text('Register'), findsWidgets);
    await tester.enterText(find.byType(TextFormField).at(2), 'Password1');
    await tester.enterText(find.byType(TextFormField).at(3), 'Password1');
    await tester.tap(find.widgetWithText(ElevatedButton, 'Register'));
    await tester.pump();

    expect(find.text('Required'), findsNWidgets(2));
  });

  testWidgets('Client dashboard shows the main actions', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      buildTestApp(child: const ClientDashboardScreen()),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('Welcome, Jane Doe'), findsOneWidget);
    expect(find.text('New Parcel'), findsAtLeastNWidgets(1));
    expect(find.text('Track'), findsAtLeastNWidgets(1));
    expect(find.text('Pickups'), findsAtLeastNWidgets(1));
    expect(find.text('Recent Parcels'), findsOneWidget);
  });
}
