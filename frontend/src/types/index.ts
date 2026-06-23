// ── Enums ─────────────────────────────────────────────────────────
export type TrafficLight = 'green' | 'amber' | 'red';
export type UserRole = 'shift_manager' | 'production_lead' | 'operations_head' | 'finance' | 'owner';
export type SiteType = 'retail' | 'production' | 'production_retail';
export type CheckResult = 'pass' | 'amber' | 'red';
export type DispatchStatus = 'pending' | 'in_transit' | 'received' | TrafficLight;
export type ReadingPeriod = 'open' | 'mid' | 'close';

export type WasteReason =
  | 'overproduction' | 'expiry' | 'damage' | 'quality_failure'
  | 'return' | 'staff_error' | 'customer_recovery' | 'other';

export type WasteDisposition =
  | 'waste' | 'staff_consumption' | 'donation' | 'return_to_production' | 'next_day_sale';

export type IncidentCategory =
  | 'cash' | 'temperature' | 'dispatch_receiving' | 'waste'
  | 'equipment' | 'staffing' | 'customer' | 'security' | 'food_safety' | 'other';

// ── Core entities ─────────────────────────────────────────────────
export interface Site {
  id: number;
  name: string;
  type: SiteType;
  opening_owner?: string;
  closing_owner?: string;
  operating_hours?: string;
  primary_supply_source?: string;
  is_active: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  site_id: number | null;
  site?: Site;
}

// ── Opening ───────────────────────────────────────────────────────
export interface RefrigerationReading {
  unit: string;
  temp_c: number;
  within_range: boolean;
}

export interface OpeningLog {
  id: number;
  site_id: number;
  site?: Site;
  user?: User;
  log_date: string;
  opened_at: string | null;
  overnight_anomaly: 'none' | 'minor' | 'security_concern' | 'equipment_fault';
  anomaly_notes?: string;
  refrigeration_readings?: RefrigerationReading[];
  cash_float_counted?: number;
  pos_operational: boolean;
  card_terminal_operational: boolean;
  receiving_reconciled: boolean;
  team_brief_done: boolean;
  is_complete: boolean;
  status: TrafficLight;
}

// ── Dispatch ──────────────────────────────────────────────────────
export interface DispatchRecord {
  id: number;
  dispatch_id: string;
  origin_site_id: number;
  destination_site_id: number;
  originSite?: Site;
  destinationSite?: Site;
  dispatch_date: string;
  sku: string;
  quantity_dispatched: number;
  quantity_received: number | null;
  variance: number;
  packed_at: string;
  collected_at: string | null;
  received_at: string | null;
  packedBy?: User;
  collectedBy?: User;
  receivedBy?: User;
  status: DispatchStatus;
  pack_condition: 'good' | 'damaged' | 'suspect';
}

// ── Waste ─────────────────────────────────────────────────────────
export interface WasteEntry {
  id: number;
  site_id: number;
  site?: Site;
  recordedBy?: User;
  waste_date: string;
  recorded_at: string;
  sku: string;
  units_wasted: number;
  recipe_cost_per_unit: number;
  retail_price_per_unit: number;
  total_recipe_cost: number;
  total_retail_value: number;
  reason_code: WasteReason;
  disposition: WasteDisposition;
  notes?: string;
  status: TrafficLight;
}

export interface WasteSummary {
  total_recipe_cost: number;
  total_retail_value: number;
  total_units: number;
  by_reason: Record<WasteReason, { count: number; cost: number }>;
}

// ── Close Gate ────────────────────────────────────────────────────
export interface CloseGateSubmission {
  id: number;
  site_id: number;
  site?: Site;
  submittedBy?: User;
  gate_date: string;
  submitted_at: string;
  check_opening_complete: CheckResult;
  check_pos_zreport: CheckResult;
  check_cash_reconciled: CheckResult;
  check_card_settlement: CheckResult;
  check_temperatures: CheckResult;
  check_food_safety: CheckResult;
  check_unsold_stock: CheckResult;
  check_waste_records: CheckResult;
  check_receiving_reconciled: CheckResult;
  check_cleaning: CheckResult;
  check_equipment_status: CheckResult;
  check_cash_secured: CheckResult;
  check_security: CheckResult;
  check_notes?: Record<string, string>;
  gate_status: TrafficLight;
  checks_passed: number;
  checks_total: number;
  override_required: boolean;
  overrideApprovedBy?: User;
  override_reason?: string;
}

// ── Incidents ─────────────────────────────────────────────────────
export interface Incident {
  id: number;
  reference: string;
  site_id: number;
  site?: Site;
  raisedBy?: User;
  ownedBy?: User;
  resolvedBy?: User;
  raised_at: string;
  severity: TrafficLight;
  category: IncidentCategory;
  title: string;
  description: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolution_notes?: string;
  owner_notified: boolean;
}

// ── Cash ──────────────────────────────────────────────────────────
export interface CashReconciliation {
  id: number;
  site_id: number;
  site?: Site;
  submittedBy?: User;
  verifiedBy?: User;
  recon_date: string;
  pos_z_total: number;
  card_settlement_total: number;
  expected_cash: number;
  actual_cash_counted: number;
  cash_variance: number;
  deposit_made: boolean;
  deposit_amount?: number;
  deposit_reference?: string;
  status: TrafficLight;
  variance_reason?: string;
  finance_verified: boolean;
}

// ── Temperature ───────────────────────────────────────────────────
export interface TemperatureLog {
  id: number;
  site_id: number;
  site?: Site;
  recordedBy?: User;
  log_date: string;
  recorded_at: string;
  reading_period: ReadingPeriod;
  unit_name: string;
  unit_type: 'fridge' | 'freezer' | 'hot_hold';
  temp_c: number;
  min_limit_c: number;
  max_limit_c: number;
  within_range: boolean;
  corrective_action?: string;
  status: TrafficLight;
}

// ── SKU ───────────────────────────────────────────────────────────
export interface SkuCost {
  id: number;
  sku: string;
  category?: string;
  recipe_cost: number;
  retail_price: number;
  approved_dispositions?: WasteDisposition[];
  is_controlled: boolean;
  is_active: boolean;
}

// ── Dashboard ─────────────────────────────────────────────────────
export interface DailyDashboard {
  date: string;
  close_gate: CloseGateSubmission[];
  compliance_rate: number;
  open_incidents: Incident[];
  red_incident_count: number;
  waste: { total_recipe_cost: number; total_retail_value: number; top_skus: { sku: string; total: number }[] };
  cash: { reconciliations: CashReconciliation[]; total_variance: number; red_sites: number };
  dispatch_variances: DispatchRecord[];
  temperature_breaches: TemperatureLog[];
}
