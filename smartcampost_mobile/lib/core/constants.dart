class AppConstants {
  AppConstants._();

  static const String appName = 'SmartCAMPOST';

  // API — production (Render)
  static const String prodBaseUrl =
      'https://smartcampost-backend.onrender.com/api';
  // API — local development
  static const String localBaseUrl =
      'http://10.0.2.2:8082/api'; // Android emulator
  static const String localIosBaseUrl = 'http://localhost:8082/api';
  static const Duration apiTimeout = Duration(seconds: 30);

  // Auth
  static const String tokenKey = 'auth_token';
  static const String userKey = 'auth_user';
  static const String languageKey = 'preferred_language';

  // Pagination
  static const int defaultPageSize = 10;

  // Location
  static const double defaultLatitude = 3.8480;
  static const double defaultLongitude = 11.5021; // Yaoundé
}

class UserRole {
  UserRole._();
  static const String client = 'CLIENT';
  static const String agent = 'AGENT';
  static const String courier = 'COURIER';
  static const String staff = 'STAFF';
  static const String admin = 'ADMIN';
  static const String finance = 'FINANCE';
  static const String risk = 'RISK';
}

class ParcelStatusValues {
  ParcelStatusValues._();
  static const String created = 'CREATED';
  static const String accepted = 'ACCEPTED';
  static const String takenInCharge = 'TAKEN_IN_CHARGE';
  static const String inTransit = 'IN_TRANSIT';
  static const String arrivedHub = 'ARRIVED_HUB';
  static const String arrivedDestAgency = 'ARRIVED_DEST_AGENCY';
  static const String outForDelivery = 'OUT_FOR_DELIVERY';
  static const String delivered = 'DELIVERED';
  static const String pickedUpAtAgency = 'PICKED_UP_AT_AGENCY';
  static const String returnedToSender = 'RETURNED_TO_SENDER';
  static const String returned = 'RETURNED';
  static const String cancelled = 'CANCELLED';
}
