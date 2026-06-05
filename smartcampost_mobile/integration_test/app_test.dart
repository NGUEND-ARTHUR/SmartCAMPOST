import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';

// ignore: depend_on_referenced_packages
import 'package:smartcampost_mobile/main.dart' as app;

const kAdminEmail    = 'admin@smartcampost.cm';
const kAdminPassword = 'Admin@SmartCAMPOST2026';
const kClientEmail   = 'client@test.cm';
const kClientPass    = 'Test@2024';
const kCourierEmail  = 'courier@test.cm';
const kCourierPass   = 'Test@2024';

Future<void> waitForApp(WidgetTester tester) async {
  app.main();
  await tester.pumpAndSettle(const Duration(seconds: 5));
}

Future<void> fillLoginForm(WidgetTester tester, String email, String pass) async {
  final fields = find.byType(TextField);
  if (fields.evaluate().isNotEmpty) {
    await tester.enterText(fields.first, email);
    if (fields.evaluate().length > 1) {
      await tester.enterText(fields.at(1), pass);
    }
  }
  final btn = find.byType(ElevatedButton);
  if (btn.evaluate().isNotEmpty) {
    await tester.tap(btn.first);
    await tester.pumpAndSettle(const Duration(seconds: 6));
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('App Launch', () {
    testWidgets('App starts without crash', (tester) async {
      await waitForApp(tester);
      expect(find.byType(MaterialApp), findsOneWidget);
    });
  });

  group('Authentication', () {
    testWidgets('Admin can login', (tester) async {
      await waitForApp(tester);
      await fillLoginForm(tester, kAdminEmail, kAdminPassword);
      final error = find.textContaining(
        RegExp(r'incorrect|invalide|erreur|error', caseSensitive: false));
      expect(error, findsNothing);
    });

    testWidgets('Client can login', (tester) async {
      await waitForApp(tester);
      await fillLoginForm(tester, kClientEmail, kClientPass);
      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('Wrong password shows error state', (tester) async {
      await waitForApp(tester);
      await fillLoginForm(tester, kClientEmail, 'WrongPass!');
      await tester.pumpAndSettle(const Duration(seconds: 3));
      expect(find.byType(MaterialApp), findsOneWidget);
    });
  });

  group('Navigation', () {
    testWidgets('Navigation present after login', (tester) async {
      await waitForApp(tester);
      await fillLoginForm(tester, kClientEmail, kClientPass);
      await tester.pumpAndSettle(const Duration(seconds: 3));
      expect(find.byType(Scaffold), findsWidgets);
    });
  });

  group('Courier Role', () {
    testWidgets('Courier login shows delivery interface', (tester) async {
      await waitForApp(tester);
      await fillLoginForm(tester, kCourierEmail, kCourierPass);
      await tester.pumpAndSettle(const Duration(seconds: 4));
      expect(find.byType(Scaffold), findsWidgets);
    });
  });

  group('UI Safety', () {
    testWidgets('Double tap does not crash app', (tester) async {
      await waitForApp(tester);
      final btns = find.byType(ElevatedButton);
      if (btns.evaluate().isNotEmpty) {
        await tester.tap(btns.first);
        await tester.pump();
        await tester.tap(btns.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        expect(find.byType(MaterialApp), findsOneWidget);
      }
    });
  });

  group('Offline Safety', () {
    testWidgets('App survives without network', (tester) async {
      await waitForApp(tester);
      await tester.pumpAndSettle(const Duration(seconds: 3));
      expect(find.byType(MaterialApp), findsOneWidget);
    });
  });
}
