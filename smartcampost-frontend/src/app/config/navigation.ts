import { ROLES } from "./roles";

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
}

export const clientMenu: NavItem[] = [
  { label: "Dashboard", path: "/client/dashboard" },
  { label: "Create Parcel", path: "/client/parcels/new" },
  { label: "My Parcels", path: "/client/parcels" },
  { label: "Track Parcel", path: "/client/track" },
  { label: "Pickups", path: "/client/pickups" },
  { label: "Payments & Invoices", path: "/client/payments" },
  { label: "Support Tickets", path: "/client/support" },
  { label: "Addresses", path: "/client/addresses" },
  { label: "Profile & Settings", path: "/client/settings" },
];

export const agentMenu: NavItem[] = [
  { label: "Dashboard", path: "/agent/dashboard" },
  { label: "Register Parcel", path: "/agent/parcels/new" },
  { label: "Parcels", path: "/agent/parcels" },
  { label: "Scan Console", path: "/agent/scans" },
  { label: "Pickups", path: "/agent/pickups" },
  { label: "Delivery Tools", path: "/agent/delivery-tools" },
  { label: "Notifications", path: "/agent/notifications" },
  { label: "Profile", path: "/agent/profile" },
];

export const courierMenu: NavItem[] = [
  { label: "Dashboard", path: "/courier/dashboard" },
  { label: "My Pickups", path: "/courier/pickups" },
  { label: "My Deliveries", path: "/courier/deliveries" },
  { label: "Route Map", path: "/courier/map" },
  { label: "Scan Events", path: "/courier/scans" },
  { label: "Profile", path: "/courier/profile" },
];

export const staffMenu: NavItem[] = [
  { label: "Ops Dashboard", path: "/staff/dashboard" },
  { label: "Parcels Management", path: "/staff/parcels" },
  { label: "Pickups Management", path: "/staff/pickups" },
  { label: "Scan Logs", path: "/staff/scans" },
  { label: "Delivery Monitoring", path: "/staff/deliveries" },
  { label: "Payments", path: "/staff/payments" },
  { label: "Support Inbox", path: "/staff/support" },
  { label: "Notifications", path: "/staff/notifications" },
  { label: "Analytics", path: "/staff/analytics" },
  { label: "Integrations", path: "/staff/integrations" },
  { label: "Profile", path: "/staff/profile" },
];

export const adminMenu: NavItem[] = [
  { label: "Admin Dashboard", path: "/admin/dashboard" },
  { label: "Parcels", path: "/admin/parcels" },
  { label: "Pickups", path: "/admin/pickups" },
  { label: "Scans", path: "/admin/scans" },
  { label: "Deliveries", path: "/admin/deliveries" },
  { label: "Payments", path: "/admin/payments" },
  { label: "Support", path: "/admin/support" },
  { label: "Notifications", path: "/admin/notifications" },
  { label: "Analytics", path: "/admin/analytics" },
  { label: "Users & Accounts", path: "/admin/accounts" },
  { label: "Agencies", path: "/admin/agencies" },
  { label: "Staff", path: "/admin/staff" },
  { label: "Agents", path: "/admin/agents" },
  { label: "Couriers", path: "/admin/couriers" },
  { label: "Tariffs & Pricing", path: "/admin/tariffs" },
  { label: "Integrations", path: "/admin/integrations" },
  { label: "USSD Sessions", path: "/admin/ussd" },
];

export const financeMenu: NavItem[] = [
  { label: "Finance Dashboard", path: "/finance/dashboard" },
  { label: "Payments", path: "/finance/payments" },
  { label: "Invoices", path: "/finance/invoices" },
  { label: "Refunds", path: "/finance/refunds" },
  { label: "Exceptions", path: "/finance/exceptions" },
  { label: "Analytics", path: "/finance/analytics" },
  { label: "Profile", path: "/finance/profile" },
];

export const riskMenu: NavItem[] = [
  { label: "Risk Dashboard", path: "/risk/dashboard" },
  { label: "Risk Alerts", path: "/risk/alerts" },
  { label: "Compliance Reports", path: "/risk/compliance" },
  { label: "Cases", path: "/risk/cases" },
  { label: "Integrations", path: "/risk/integrations" },
  { label: "Profile", path: "/risk/profile" },
];

export const roleMenus: Record<string, NavItem[]> = {
  [ROLES.CLIENT]: clientMenu,
  [ROLES.ADMIN]: adminMenu,
  [ROLES.STAFF]: staffMenu,
  [ROLES.AGENT]: agentMenu,
  [ROLES.COURIER]: courierMenu,
  [ROLES.FINANCE]: financeMenu,
  [ROLES.RISK]: riskMenu,
};


