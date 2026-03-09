import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:smartcampost_mobile/core/constants.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/models/parcel.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';
import 'package:smartcampost_mobile/providers/parcel_provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';

// Auth screens
import 'package:smartcampost_mobile/screens/auth/login_screen.dart';
import 'package:smartcampost_mobile/screens/auth/register_screen.dart';
import 'package:smartcampost_mobile/screens/auth/otp_login_screen.dart';

// Client screens
import 'package:smartcampost_mobile/screens/client/client_dashboard_screen.dart';
import 'package:smartcampost_mobile/screens/client/parcel_list_screen.dart';
import 'package:smartcampost_mobile/screens/client/parcel_detail_screen.dart';
import 'package:smartcampost_mobile/screens/client/create_parcel_screen.dart';
import 'package:smartcampost_mobile/screens/client/track_parcel_screen.dart';

// Courier screens
import 'package:smartcampost_mobile/screens/courier/courier_dashboard_screen.dart';
import 'package:smartcampost_mobile/screens/courier/pickup_assignments_screen.dart';
import 'package:smartcampost_mobile/screens/courier/delivery_screen.dart';
import 'package:smartcampost_mobile/screens/courier/qr_scan_screen.dart';
import 'package:smartcampost_mobile/screens/courier/delivery_confirmation_screen.dart';

// Agent screens
import 'package:smartcampost_mobile/screens/agent/agent_dashboard_screen.dart';
import 'package:smartcampost_mobile/screens/agent/parcel_validation_screen.dart';
import 'package:smartcampost_mobile/screens/agent/scan_intake_screen.dart';

// Staff screens
import 'package:smartcampost_mobile/screens/staff/staff_dashboard_screen.dart';
import 'package:smartcampost_mobile/screens/staff/parcel_management_screen.dart';
import 'package:smartcampost_mobile/screens/staff/analytics_screen.dart';

// Admin screens
import 'package:smartcampost_mobile/screens/admin/admin_dashboard_screen.dart';
import 'package:smartcampost_mobile/screens/admin/user_management_screen.dart';
import 'package:smartcampost_mobile/screens/admin/tariff_management_screen.dart';

// Finance screens
import 'package:smartcampost_mobile/screens/finance/finance_dashboard_screen.dart';
import 'package:smartcampost_mobile/screens/finance/payments_screen.dart';

// Risk screens
import 'package:smartcampost_mobile/screens/risk/risk_dashboard_screen.dart';
import 'package:smartcampost_mobile/screens/risk/compliance_alerts_screen.dart';

// Shared screens
import 'package:smartcampost_mobile/screens/shared/notifications_screen.dart';
import 'package:smartcampost_mobile/screens/shared/profile_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final localeProvider = LocaleProvider();
  await localeProvider.init();

  final authProvider = AuthProvider();
  await authProvider.checkAuth();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider.value(value: localeProvider),
        ChangeNotifierProvider(create: (_) => ParcelProvider()),
      ],
      child: const SmartCampostApp(),
    ),
  );
}

class SmartCampostApp extends StatelessWidget {
  const SmartCampostApp({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final localeProvider = context.watch<LocaleProvider>();

    final router = GoRouter(
      initialLocation: '/login',
      refreshListenable: authProvider,
      redirect: (context, state) {
        final isAuth = authProvider.isAuthenticated;
        final isAuthRoute =
            state.matchedLocation == '/login' ||
            state.matchedLocation == '/register' ||
            state.matchedLocation == '/otp-login';

        // Not authenticated → force to login
        if (!isAuth && !isAuthRoute) return '/login';

        // Authenticated but on auth route → go to role dashboard
        if (isAuth && isAuthRoute) {
          return _dashboardForRole(authProvider.userRole);
        }

        return null; // no redirect
      },
      routes: [
        // ─── Auth ───
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: '/otp-login',
          builder: (context, state) => const OtpLoginScreen(),
        ),

        // ─── Client ───
        GoRoute(
          path: '/client',
          builder: (context, state) => const ClientDashboardScreen(),
          routes: [
            GoRoute(
              path: 'parcels',
              builder: (context, state) => const ParcelListScreen(),
            ),
            GoRoute(
              path: 'parcels/create',
              builder: (context, state) => const CreateParcelScreen(),
            ),
            GoRoute(
              path: 'parcels/:id',
              builder: (context, state) {
                final id = state.pathParameters['id'] ?? '';
                return ParcelDetailScreen(parcelId: id);
              },
            ),
            GoRoute(
              path: 'track',
              builder: (context, state) => const TrackParcelScreen(),
            ),
          ],
        ),

        // ─── Courier ───
        GoRoute(
          path: '/courier',
          builder: (context, state) => const CourierDashboardScreen(),
          routes: [
            GoRoute(
              path: 'pickups',
              builder: (context, state) => const PickupAssignmentsScreen(),
            ),
            GoRoute(
              path: 'deliveries',
              builder: (context, state) => const DeliveryScreen(),
            ),
            GoRoute(
              path: 'delivery-confirm',
              builder: (context, state) {
                final parcel = state.extra as Parcel;
                return DeliveryConfirmationScreen(parcel: parcel);
              },
            ),
            GoRoute(
              path: 'scan',
              builder: (context, state) => const QrScanScreen(),
            ),
          ],
        ),

        // ─── Agent ───
        GoRoute(
          path: '/agent',
          builder: (context, state) => const AgentDashboardScreen(),
          routes: [
            GoRoute(
              path: 'validate',
              builder: (context, state) => const ParcelValidationScreen(),
            ),
            GoRoute(
              path: 'scan',
              builder: (context, state) => const ScanIntakeScreen(),
            ),
          ],
        ),

        // ─── Staff ───
        GoRoute(
          path: '/staff',
          builder: (context, state) => const StaffDashboardScreen(),
          routes: [
            GoRoute(
              path: 'parcels',
              builder: (context, state) => const ParcelManagementScreen(),
            ),
            GoRoute(
              path: 'analytics',
              builder: (context, state) => const AnalyticsScreen(),
            ),
          ],
        ),

        // ─── Admin ───
        GoRoute(
          path: '/admin',
          builder: (context, state) => const AdminDashboardScreen(),
          routes: [
            GoRoute(
              path: 'users',
              builder: (context, state) => const UserManagementScreen(),
            ),
            GoRoute(
              path: 'tariffs',
              builder: (context, state) => const TariffManagementScreen(),
            ),
            GoRoute(
              path: 'parcels',
              builder: (context, state) => const ParcelManagementScreen(),
            ),
            GoRoute(
              path: 'analytics',
              builder: (context, state) => const AnalyticsScreen(),
            ),
          ],
        ),

        // ─── Finance ───
        GoRoute(
          path: '/finance',
          builder: (context, state) => const FinanceDashboardScreen(),
          routes: [
            GoRoute(
              path: 'payments',
              builder: (context, state) => const PaymentsScreen(),
            ),
          ],
        ),

        // ─── Risk ───
        GoRoute(
          path: '/risk',
          builder: (context, state) => const RiskDashboardScreen(),
          routes: [
            GoRoute(
              path: 'compliance',
              builder: (context, state) => const ComplianceAlertsScreen(),
            ),
          ],
        ),

        // ─── Shared ───
        GoRoute(
          path: '/notifications',
          builder: (context, state) => const NotificationsScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    );

    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      routerConfig: router,
      locale: localeProvider.locale,
      supportedLocales: const [Locale('en'), Locale('fr')],
    );
  }

  static String _dashboardForRole(String role) {
    switch (role) {
      case UserRole.client:
        return '/client';
      case UserRole.courier:
        return '/courier';
      case UserRole.agent:
        return '/agent';
      case UserRole.staff:
        return '/staff';
      case UserRole.admin:
        return '/admin';
      case UserRole.finance:
        return '/finance';
      case UserRole.risk:
        return '/risk';
      default:
        return '/client';
    }
  }
}
