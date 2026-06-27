import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:smartcampost_mobile/core/constants.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/models/parcel.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';
import 'package:smartcampost_mobile/providers/parcel_provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/push_notification_service.dart';

// Auth screens
import 'package:smartcampost_mobile/screens/auth/login_screen.dart';
import 'package:smartcampost_mobile/screens/auth/register_screen.dart';
import 'package:smartcampost_mobile/screens/auth/otp_login_screen.dart';
import 'package:smartcampost_mobile/screens/auth/forgot_password_screen.dart';

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
import 'package:smartcampost_mobile/screens/courier/failed_delivery_screen.dart';

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

// Risk screens
import 'package:smartcampost_mobile/screens/risk/risk_dashboard_screen.dart';
import 'package:smartcampost_mobile/screens/risk/compliance_alerts_screen.dart';

import 'package:smartcampost_mobile/screens/auth/onboarding_screen.dart';

// Shared screens
import 'package:smartcampost_mobile/screens/shared/notifications_screen.dart';
import 'package:smartcampost_mobile/screens/shared/profile_screen.dart';
import 'package:smartcampost_mobile/screens/shared/operational_screens.dart';
import 'package:smartcampost_mobile/screens/shared/ai_chat_screen.dart';
import 'package:smartcampost_mobile/screens/shared/gps_endpoint_list_screen.dart';
import 'package:smartcampost_mobile/screens/shared/ticket_detail_screen.dart';
import 'package:smartcampost_mobile/screens/client/parcel_tracking_map_screen.dart';
import 'package:smartcampost_mobile/screens/client/momo_payment_screen.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

String _tr(BuildContext context, String key) =>
    context.watch<LocaleProvider>().tr(key);

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final localeProvider = LocaleProvider();
  await localeProvider.init();

  final authProvider = AuthProvider();

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

  WidgetsBinding.instance.addPostFrameCallback((_) {
    unawaited(PushNotificationService.initialize());
    unawaited(authProvider.checkAuth());
  });
}

class SmartCampostApp extends StatelessWidget {
  const SmartCampostApp({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final localeProvider = context.watch<LocaleProvider>();

    final router = GoRouter(
      navigatorKey: _rootNavigatorKey,
      initialLocation: '/login',
      refreshListenable: authProvider,
      redirect: (context, state) {
        final isAuth = authProvider.isAuthenticated;
        final isAuthRoute =
            state.matchedLocation == '/login' ||
            state.matchedLocation == '/register' ||
            state.matchedLocation == '/otp-login' ||
            state.matchedLocation == '/forgot-password' ||
            state.matchedLocation == '/qr-verify';

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
          path: '/onboarding',
          builder: (context, state) => const OnboardingScreen(),
        ),
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
              path: 'parcels/new',
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
            GoRoute(
              path: 'tracking',
              builder: (context, state) => const TrackParcelScreen(),
            ),
            GoRoute(
              path: 'pickups',
              builder: (context, state) => const ClientPickupsScreen(),
            ),
            GoRoute(
              path: 'payments',
              builder: (context, state) => const PaymentsListScreen(),
            ),
            GoRoute(
              path: 'pay/:parcelId',
              builder: (context, state) {
                final parcelId = state.pathParameters['parcelId']!;
                final amount = double.tryParse(state.uri.queryParameters['amount'] ?? '') ?? 0;
                final ref = state.uri.queryParameters['ref'];
                return MomoPaymentScreen(parcelId: parcelId, amount: amount, trackingRef: ref);
              },
            ),
            GoRoute(
              path: 'invoices',
              builder: (context, state) => const InvoicesScreen(),
            ),
            GoRoute(
              path: 'tracking-map/:parcelId',
              builder: (context, state) {
                final parcelId = state.pathParameters['parcelId']!;
                final ref = state.uri.queryParameters['ref'];
                return ParcelTrackingMapScreen(parcelId: parcelId, trackingRef: ref);
              },
            ),
            GoRoute(
              path: 'addresses',
              builder: (context, state) => const AddressBookScreen(),
            ),
            GoRoute(
              path: 'support',
              builder: (context, state) => const SupportCenterScreen(),
            ),
            GoRoute(
              path: 'settings',
              builder: (context, state) => const ProfileScreen(),
            ),
            GoRoute(
              path: 'profile',
              builder: (context, state) => const ProfileScreen(),
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
              path: 'deliveries/failed',
              builder: (context, state) => const FailedDeliveryScreen(),
            ),
            GoRoute(
              path: 'scan',
              builder: (context, state) => const QrScanScreen(),
            ),
            GoRoute(
              path: 'scans',
              builder: (context, state) => const QrScanScreen(),
            ),
            GoRoute(
              path: 'map',
              builder: (context, state) => const CourierMapScreen(),
            ),
            GoRoute(
              path: 'live-logistics',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'live_logistics'),
                endpoint: '/logistics/live',
                icon: Icons.radar,
                emptyTitle: _tr(context, 'no_live_logistics'),
              ),
            ),
            GoRoute(
              path: 'gps',
              builder: (context, state) => EndpointActionScreen(
                title: _tr(context, 'mobile_gps_update'),
                endpoint: '/logistics/gps/mobile',
                icon: Icons.my_location,
                fields: const ['latitude', 'longitude', 'speed', 'heading'],
                submitLabel: _tr(context, 'send_gps_update'),
              ),
            ),
            GoRoute(
              path: 'route-optimization',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'route_optimization'),
                endpoint: '/logistics/route-optimization',
                icon: Icons.route,
                emptyTitle: _tr(context, 'no_route_recommendations'),
              ),
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
            GoRoute(
              path: 'scans',
              builder: (context, state) => const ScanIntakeScreen(),
            ),
            GoRoute(
              path: 'intake',
              builder: (context, state) => const ScanIntakeScreen(),
            ),
            GoRoute(
              path: 'parcels',
              builder: (context, state) => const ParcelValidationScreen(),
            ),
            GoRoute(
              path: 'parcels/new',
              builder: (context, state) => const CreateParcelScreen(),
            ),
            GoRoute(
              path: 'pickups',
              builder: (context, state) => const ClientPickupsScreen(),
            ),
            GoRoute(
              path: 'map',
              builder: (context, state) => const CourierMapScreen(),
            ),
            GoRoute(
              path: 'live-logistics',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'live_logistics'),
                endpoint: '/logistics/live',
                icon: Icons.radar,
                emptyTitle: _tr(context, 'no_live_logistics'),
              ),
            ),
            GoRoute(
              path: 'gps',
              builder: (context, state) => EndpointActionScreen(
                title: _tr(context, 'mobile_gps_update'),
                endpoint: '/logistics/gps/mobile',
                icon: Icons.my_location,
                fields: const ['latitude', 'longitude', 'speed', 'heading'],
                submitLabel: _tr(context, 'send_gps_update'),
              ),
            ),
            GoRoute(
              path: 'route-optimization',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'route_optimization'),
                endpoint: '/logistics/route-optimization',
                icon: Icons.route,
                emptyTitle: _tr(context, 'no_route_recommendations'),
              ),
            ),
            GoRoute(
              path: 'assign-courier',
              builder: (context, state) => const AssignCourierScreen(),
            ),
            GoRoute(
              path: 'delivery-tools',
              builder: (context, state) => EndpointActionScreen(
                title: _tr(context, 'delivery_otp_tools'),
                endpoint: '/delivery/otp/send',
                icon: Icons.password,
                fields: const ['parcelId', 'phoneNumber'],
                submitLabel: _tr(context, 'send_otp'),
              ),
            ),
            GoRoute(
              path: 'profile',
              builder: (context, state) => const ProfileScreen(),
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
            GoRoute(
              path: 'pickups',
              builder: (context, state) => const PickupAssignmentsScreen(),
            ),
            GoRoute(
              path: 'deliveries',
              builder: (context, state) => const StaffDeliveryMonitoringScreen(),
            ),
            GoRoute(
              path: 'payments',
              builder: (context, state) => const PaymentsListScreen(),
            ),
            GoRoute(
              path: 'finance',
              builder: (context, state) => const FinanceDashboardScreen(),
            ),
            GoRoute(
              path: 'support',
              builder: (context, state) => const StaffSupportInboxScreen(),
            ),
            GoRoute(
              path: 'track',
              builder: (context, state) => const TrackParcelScreen(),
            ),
            GoRoute(
              path: 'live-logistics',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'live_logistics'),
                endpoint: '/logistics/live',
                icon: Icons.radar,
                emptyTitle: _tr(context, 'no_live_logistics'),
              ),
            ),
            GoRoute(
              path: 'gps-trackers',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'gps_trackers'),
                endpoint: '/logistics/trackers',
                icon: Icons.gps_fixed,
                emptyTitle: _tr(context, 'no_gps_trackers'),
              ),
            ),
            GoRoute(
              path: 'gps-trackers/new',
              builder: (context, state) => EndpointActionScreen(
                title: _tr(context, 'register_gps_tracker'),
                endpoint: '/logistics/trackers',
                icon: Icons.add_location_alt,
                fields: const ['deviceId', 'imei', 'label', 'assignedType', 'assignedId', 'vehicleId'],
                submitLabel: _tr(context, 'register_gps_tracker'),
              ),
            ),
            GoRoute(
              path: 'iot-gps',
              builder: (context, state) => EndpointActionScreen(
                title: _tr(context, 'iot_gps_update'),
                endpoint: '/logistics/gps/iot',
                icon: Icons.settings_input_antenna,
                fields: const ['deviceId', 'imei', 'latitude', 'longitude', 'speed', 'heading'],
                submitLabel: _tr(context, 'send_gps_update'),
              ),
            ),
            GoRoute(
              path: 'route-optimization',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'route_optimization'),
                endpoint: '/logistics/route-optimization',
                icon: Icons.route,
                emptyTitle: _tr(context, 'no_route_recommendations'),
              ),
            ),
            GoRoute(
              path: 'pickup-recommendations',
              builder: (context, state) => GpsEndpointListScreen(
                title: _tr(context, 'pickup_recommendations'),
                baseEndpoint: '/logistics/pickup-assignment/recommendations',
                icon: Icons.assignment_ind,
                emptyTitle: _tr(context, 'no_pickup_recommendations'),
              ),
            ),
            GoRoute(
              path: 'distance-pricing',
              builder: (context, state) => EndpointActionScreen(
                title: _tr(context, 'distance_pricing'),
                endpoint: '/logistics/pricing/distance-quote',
                icon: Icons.payments,
                fields: const ['distanceKm', 'weightKg', 'complexity'],
                submitLabel: _tr(context, 'calculate_price'),
              ),
            ),
            GoRoute(
              path: 'scans',
              builder: (context, state) => const ScanIntakeScreen(),
            ),
            GoRoute(
              path: 'congestion',
              builder: (context, state) => const CongestionScreen(),
            ),
            GoRoute(
              path: 'bulk-scans',
              builder: (context, state) => EndpointActionScreen(
                title: _tr(context, 'hub_bulk_scan'),
                endpoint: '/scan-events/bulk',
                icon: Icons.qr_code_scanner,
                fields: const ['bagId', 'eventType', 'agencyId', 'trackingRefs'],
                submitLabel: _tr(context, 'submit_bulk_scan'),
              ),
            ),
            GoRoute(
              path: 'notification-templates',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'notification_templates'),
                endpoint: '/notifications/templates',
                icon: Icons.notifications_active_outlined,
                emptyTitle: _tr(context, 'no_notification_templates'),
              ),
            ),
            GoRoute(
              path: 'otp-logs',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'otp_logs'),
                endpoint: '/otp/logs',
                icon: Icons.history,
                emptyTitle: _tr(context, 'no_otp_logs'),
              ),
            ),
            GoRoute(
              path: 'advanced-analytics',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'ai_route_analytics'),
                endpoint: '/analytics/route-optimization',
                icon: Icons.auto_graph,
                emptyTitle: _tr(context, 'no_ai_analytics'),
              ),
            ),
            GoRoute(
              path: 'ai-discovery',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'ai_discovery'),
                endpoint: '/ai/runtime/discovery/automation-opportunities',
                icon: Icons.psychology,
                emptyTitle: _tr(context, 'no_ai_discovery'),
              ),
            ),
            GoRoute(
              path: 'rbac-permissions',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'rbac_permissions'),
                endpoint: '/rbac/roles/ADMIN/permissions',
                icon: Icons.verified_user,
                emptyTitle: _tr(context, 'no_rbac_permissions'),
              ),
            ),
            GoRoute(
              path: 'profile',
              builder: (context, state) => const ProfileScreen(),
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
              path: 'accounts',
              builder: (context, state) => const AuditLogsScreen(),
            ),
            GoRoute(
              path: 'clients',
              builder: (context, state) => const UserManagementScreen(),
            ),
            GoRoute(
              path: 'agents',
              builder: (context, state) => const UserManagementScreen(),
            ),
            GoRoute(
              path: 'agencies',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'agencies'),
                endpoint: '/agencies',
                icon: Icons.business,
                emptyTitle: _tr(context, 'no_agencies'),
              ),
            ),
            GoRoute(
              path: 'staff-management',
              builder: (context, state) => const UserManagementScreen(),
            ),
            GoRoute(
              path: 'couriers',
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
              path: 'pickups',
              builder: (context, state) => const PickupAssignmentsScreen(),
            ),
            GoRoute(
              path: 'deliveries',
              builder: (context, state) => const StaffDeliveryMonitoringScreen(),
            ),
            GoRoute(
              path: 'payments',
              builder: (context, state) => const PaymentsListScreen(),
            ),
            GoRoute(
              path: 'support',
              builder: (context, state) => const StaffSupportInboxScreen(),
            ),
            GoRoute(
              path: 'scans',
              builder: (context, state) => const ScanIntakeScreen(),
            ),
            GoRoute(
              path: 'analytics',
              builder: (context, state) => const AnalyticsScreen(),
            ),
            GoRoute(
              path: 'audit',
              builder: (context, state) => const AuditLogsScreen(),
            ),
            GoRoute(
              path: 'integrations',
              builder: (context, state) => const IntegrationsScreen(),
            ),
            GoRoute(
              path: 'ussd',
              builder: (context, state) => const UssdMonitorScreen(),
            ),
            GoRoute(
              path: 'live-logistics',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'live_logistics'),
                endpoint: '/logistics/live',
                icon: Icons.radar,
                emptyTitle: _tr(context, 'no_live_logistics'),
              ),
            ),
            GoRoute(
              path: 'gps-trackers',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'gps_trackers'),
                endpoint: '/logistics/trackers',
                icon: Icons.gps_fixed,
                emptyTitle: _tr(context, 'no_gps_trackers'),
              ),
            ),
            GoRoute(
              path: 'gps-trackers/new',
              builder: (context, state) => EndpointActionScreen(
                title: _tr(context, 'register_gps_tracker'),
                endpoint: '/logistics/trackers',
                icon: Icons.add_location_alt,
                fields: const ['deviceId', 'imei', 'label', 'assignedType', 'assignedId', 'vehicleId'],
                submitLabel: _tr(context, 'register_gps_tracker'),
              ),
            ),
            GoRoute(
              path: 'iot-gps',
              builder: (context, state) => EndpointActionScreen(
                title: _tr(context, 'iot_gps_update'),
                endpoint: '/logistics/gps/iot',
                icon: Icons.settings_input_antenna,
                fields: const ['deviceId', 'imei', 'latitude', 'longitude', 'speed', 'heading'],
                submitLabel: _tr(context, 'send_gps_update'),
              ),
            ),
            GoRoute(
              path: 'route-optimization',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'route_optimization'),
                endpoint: '/logistics/route-optimization',
                icon: Icons.route,
                emptyTitle: _tr(context, 'no_route_recommendations'),
              ),
            ),
            GoRoute(
              path: 'pickup-recommendations',
              builder: (context, state) => GpsEndpointListScreen(
                title: _tr(context, 'pickup_recommendations'),
                baseEndpoint: '/logistics/pickup-assignment/recommendations',
                icon: Icons.assignment_ind,
                emptyTitle: _tr(context, 'no_pickup_recommendations'),
              ),
            ),
            GoRoute(
              path: 'distance-pricing',
              builder: (context, state) => EndpointActionScreen(
                title: _tr(context, 'distance_pricing'),
                endpoint: '/logistics/pricing/distance-quote',
                icon: Icons.payments,
                fields: const ['distanceKm', 'weightKg', 'complexity'],
                submitLabel: _tr(context, 'calculate_price'),
              ),
            ),
            GoRoute(
              path: 'bulk-scans',
              builder: (context, state) => EndpointActionScreen(
                title: _tr(context, 'hub_bulk_scan'),
                endpoint: '/scan-events/bulk',
                icon: Icons.qr_code_scanner,
                fields: const ['bagId', 'eventType', 'agencyId', 'trackingRefs'],
                submitLabel: _tr(context, 'submit_bulk_scan'),
              ),
            ),
            GoRoute(
              path: 'notification-templates',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'notification_templates'),
                endpoint: '/notifications/templates',
                icon: Icons.notifications_active_outlined,
                emptyTitle: _tr(context, 'no_notification_templates'),
              ),
            ),
            GoRoute(
              path: 'otp-logs',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'otp_logs'),
                endpoint: '/otp/logs',
                icon: Icons.history,
                emptyTitle: _tr(context, 'no_otp_logs'),
              ),
            ),
            GoRoute(
              path: 'advanced-analytics',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'ai_route_analytics'),
                endpoint: '/analytics/route-optimization',
                icon: Icons.auto_graph,
                emptyTitle: _tr(context, 'no_ai_analytics'),
              ),
            ),
            GoRoute(
              path: 'ai-discovery',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'ai_discovery'),
                endpoint: '/ai/runtime/discovery/automation-opportunities',
                icon: Icons.psychology,
                emptyTitle: _tr(context, 'no_ai_discovery'),
              ),
            ),
            GoRoute(
              path: 'rbac-permissions',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'rbac_permissions'),
                endpoint: '/rbac/roles/ADMIN/permissions',
                icon: Icons.verified_user,
                emptyTitle: _tr(context, 'no_rbac_permissions'),
              ),
            ),
            GoRoute(
              path: 'rbac-permissions/grant',
              builder: (context, state) => EndpointActionScreen(
                title: _tr(context, 'grant_permission'),
                endpoint: '/rbac/roles/ADMIN/permissions',
                icon: Icons.admin_panel_settings,
                fields: const ['permission', 'description'],
                submitLabel: _tr(context, 'grant_permission'),
              ),
            ),
            GoRoute(
              path: 'risk',
              builder: (context, state) => const ComplianceAlertsScreen(),
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
              builder: (context, state) => const PaymentsListScreen(),
            ),
            GoRoute(
              path: 'refunds',
              builder: (context, state) => const RefundsScreen(),
            ),
            GoRoute(
              path: 'invoices',
              builder: (context, state) => const InvoicesScreen(),
            ),
            GoRoute(
              path: 'analytics',
              builder: (context, state) => const AnalyticsScreen(),
            ),
            GoRoute(
              path: 'exceptions',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'finance_exceptions'),
                endpoint: '/payments/exceptions',
                icon: Icons.warning_amber,
                emptyTitle: _tr(context, 'no_finance_exceptions'),
              ),
            ),
            GoRoute(
              path: 'profile',
              builder: (context, state) => const ProfileScreen(),
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
            GoRoute(
              path: 'alerts',
              builder: (context, state) => const ComplianceAlertsScreen(),
            ),
            GoRoute(
              path: 'risk-alerts',
              builder: (context, state) => const ComplianceAlertsScreen(),
            ),
            GoRoute(
              path: 'audit',
              builder: (context, state) => const AuditLogsScreen(),
            ),
            GoRoute(
              path: 'cases',
              builder: (context, state) => EndpointListScreen(
                title: _tr(context, 'cases_investigations'),
                endpoint: '/risk/cases',
                icon: Icons.gavel,
                emptyTitle: _tr(context, 'no_investigation_cases'),
              ),
            ),
            GoRoute(
              path: 'integrations',
              builder: (context, state) => const IntegrationsScreen(),
            ),
            GoRoute(
              path: 'profile',
              builder: (context, state) => const ProfileScreen(),
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
        GoRoute(
          path: '/support',
          builder: (context, state) => const SupportCenterScreen(),
          routes: [
            GoRoute(
              path: ':ticketId',
              builder: (context, state) => TicketDetailScreen(
                ticketId: state.pathParameters['ticketId']!,
              ),
            ),
          ],
        ),
        GoRoute(
          path: '/ai-chat',
          builder: (context, state) => const AiChatScreen(),
        ),
        GoRoute(
          path: '/forgot-password',
          builder: (context, state) => const ForgotPasswordScreen(),
        ),
        GoRoute(
          path: '/qr-verify',
          builder: (context, state) => EndpointActionScreen(
            title: _tr(context, 'qr_verification'),
            endpoint: '/qr/verify',
            icon: Icons.qr_code_2,
            fields: const ['qrContent', 'latitude', 'longitude'],
            submitLabel: _tr(context, 'verify_qr'),
          ),
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
      builder: (context, child) => GlobalBackTrailOverlay(
        navigatorKey: _rootNavigatorKey,
        child: child ?? const SizedBox.shrink(),
      ),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
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
