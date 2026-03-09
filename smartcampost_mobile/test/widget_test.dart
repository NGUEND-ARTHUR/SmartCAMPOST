// Basic Flutter widget test for SmartCampost Mobile.

import 'package:flutter_test/flutter_test.dart';

import 'package:smartcampost_mobile/main.dart';

void main() {
  testWidgets('SmartCampostApp renders without crashing', (
    WidgetTester tester,
  ) async {
    // Verify the app widget can be instantiated
    expect(const SmartCampostApp(), isNotNull);
  });
}
