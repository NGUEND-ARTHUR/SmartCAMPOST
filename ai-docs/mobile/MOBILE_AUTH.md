# SmartCAMPOST — Mobile Authentication

## Auth Methods

Same three pathways as web frontend, all producing a JWT stored in Flutter Secure Storage:

```
Phone + Password    OTP Login           Google OAuth2
      │                   │                    │
      └─────────────────────────────────────────┘
                          │
                   POST /api/auth/...
                          │
               { accessToken, user }
                          │
          AuthStorage.saveToken(accessToken)
          AuthStorage.saveUser(user)
                          │
          AuthProvider.setUser(user, token)
                          │
          GoRouter → role-based dashboard
```

---

## AuthProvider (`providers/auth_provider.dart`)

```dart
class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  bool _isAuthenticated = false;
  String? _error;

  // Getters
  bool get isAuthenticated => _isAuthenticated;
  User? get user => _user;
  String? get userRole => _user?.role;

  // Methods
  Future<void> login(String phone, String password);
  Future<void> register(RegisterRequest request);
  Future<void> requestOtp(String phone);
  Future<void> confirmOtp(String phone, String otp);
  Future<User> loginWithGoogle(String idToken);
  void logout();
  Future<void> checkAuth();  // Restores session from secure storage
  void clearError();
}
```

---

## Phone + Password Login

```dart
// AuthService.login()
POST /api/auth/login
Body: { "phone": "+237...", "password": "..." }
Returns: { "accessToken": "eyJ...", "user": { id, name, phone, role, email, ... } }

On success:
  await AuthStorage.saveToken(response.accessToken);
  await AuthStorage.saveUser(response.user);
  notifyListeners();
  → GoRouter.redirect triggers → navigate to role dashboard

On error:
  Set _error message
  notifyListeners()
  → LoginScreen shows error
```

---

## Google OAuth2

```dart
// LoginScreen
final GoogleSignIn _googleSignIn = GoogleSignIn(
  clientId: const String.fromEnvironment(
    'GOOGLE_CLIENT_ID',
    defaultValue: '428837425425-hvbdljimv02i2kapehk51haap4160v68.apps.googleusercontent.com',
  ),
  scopes: ['email'],
  serverClientId: '<same client id>',
);

// On button press:
final account = await _googleSignIn.signIn();
final auth = await account.authentication;
final idToken = auth.idToken;

// AuthService.loginWithGoogle(idToken)
POST /api/auth/google
Body: { "idToken": "<Google ID Token>" }
Returns: { "accessToken": "...", "user": { ... } }

// Same storage + navigate flow as password login
```

---

## OTP Login

```dart
// Step 1
POST /api/auth/login/otp/request
Body: { "phone": "+237..." }

// Step 2  
POST /api/auth/login/otp/confirm
Body: { "phone": "+237...", "otp": "482910" }
Returns: { "accessToken": "...", "user": { ... } }
```

---

## Password Reset

```dart
// Step 1: Send OTP
authService.requestPasswordReset(phone)
POST /api/auth/password/reset/request
Body: { "phone": "..." }

// Step 2: Confirm
authService.confirmPasswordReset(phone, otp, newPassword)
POST /api/auth/password/reset/confirm
Body: { "phone": "...", "otp": "...", "newPassword": "..." }

On success: navigate to /login
```

---

## Token Storage (`services/auth_storage.dart`)

```dart
// Flutter Secure Storage (AES-256 encrypted at rest)
static const _storage = FlutterSecureStorage();
static const _tokenKey = 'access_token';
static const _userKey = 'user_data';

static Future<void> saveToken(String token) async
  → _storage.write(key: _tokenKey, value: token);

static Future<String?> getToken() async
  → _storage.read(key: _tokenKey);

static Future<void> saveUser(User user) async
  → _storage.write(key: _userKey, value: jsonEncode(user.toJson()));

static Future<User?> getUser() async
  → returns User.fromJson(jsonDecode(await _storage.read(key: _userKey)));

static Future<void> clearAll() async
  → _storage.deleteAll();
```

---

## Session Restore on App Start

```dart
// main.dart
final authProvider = AuthProvider();
await authProvider.checkAuth();  // Loads user + token from secure storage

// If user found: authProvider._isAuthenticated = true
// GoRouter sees isAuthenticated=true → routes to role dashboard
// If not found: GoRouter routes to /login
```

---

## Dio Auth Interceptor

```dart
// core/api_client.dart
dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) async {
    final token = await AuthStorage.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  },
  onError: (error, handler) async {
    if (error.response?.statusCode == 401) {
      await AuthStorage.clearAll();
      // No auto-redirect to login (handled by GoRouter on next navigation)
    }
    handler.next(error);
  },
));
```

---

## GoRouter Auth Guard

```dart
// main.dart — GoRouter redirect
redirect: (context, state) {
  final isAuthenticated = authProvider.isAuthenticated;
  final isOnAuthRoute = state.fullPath?.startsWith('/login') == true
    || state.fullPath?.startsWith('/register') == true
    || ...;

  if (!isAuthenticated && !isOnAuthRoute) {
    return '/login';  // Force to login
  }
  if (isAuthenticated && isOnAuthRoute) {
    return _dashboardForRole(authProvider.userRole);  // Redirect to role dashboard
  }
  return null;  // Allow navigation
}

String _dashboardForRole(String? role) {
  switch (role) {
    case 'CLIENT':  return '/client';
    case 'COURIER': return '/courier';
    case 'AGENT':   return '/agent';
    case 'STAFF':   return '/staff';
    case 'ADMIN':   return '/admin';
    case 'FINANCE': return '/finance';
    case 'RISK':    return '/risk';
    default:        return '/login';
  }
}
```

---

## Known Auth Issues (Mobile)

1. **No token expiry check:** App does not decode JWT to check `exp`. Expired tokens cause silent 401 errors.
2. **No refresh token:** After 8h, user must log in again manually.
3. **401 handling incomplete:** `onError` in Dio clears storage but does not trigger navigation to login — user is stuck on current screen.
4. **Google Client ID hardcoded:** Default fallback in source code. Must use `--dart-define=GOOGLE_CLIENT_ID=...` in CI/CD.
5. **Server Client ID:** Same value used for both `clientId` and `serverClientId` in GoogleSignIn setup.
