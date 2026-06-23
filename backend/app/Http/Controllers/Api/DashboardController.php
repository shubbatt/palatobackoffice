<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Site, CloseGateSubmission, WasteEntry, CashReconciliation, Incident, DispatchRecord, TemperatureLog};
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Owner one-page dashboard — maximum one query group per KPI block.
     */
    public function ownerSummary(): JsonResponse
    {
        $date = today();

        // ── Close Gate ─────────────────────────────────────────────
        $gateStatus = CloseGateSubmission::whereDate('gate_date', $date)
            ->select('site_id', 'gate_status', 'checks_passed', 'checks_total', 'submitted_by_user_id')
            ->with(['site:id,name', 'submittedBy:id,name'])
            ->get()
            ->keyBy('site_id');

        // ── Open Incidents ─────────────────────────────────────────
        $openIncidents = Incident::where('is_resolved', false)
            ->select('id', 'reference', 'site_id', 'severity', 'category', 'title', 'raised_at')
            ->with('site:id,name')
            ->orderBy('severity') // red first
            ->get();

        // ── Waste KPIs ─────────────────────────────────────────────
        $wasteToday = WasteEntry::whereDate('waste_date', $date)
            ->select(
                DB::raw('SUM(total_recipe_cost) as total_recipe_cost'),
                DB::raw('SUM(total_retail_value) as total_retail_value'),
                DB::raw('COUNT(*) as entries'),
            )
            ->first();

        $topWasteSKUs = WasteEntry::whereDate('waste_date', $date)
            ->groupBy('sku')
            ->orderByDesc('total')
            ->limit(5)
            ->select('sku', DB::raw('SUM(total_recipe_cost) as total'))
            ->get();

        // ── Cash ───────────────────────────────────────────────────
        $cashRecons = CashReconciliation::whereDate('recon_date', $date)
            ->select('site_id', 'cash_variance', 'status', 'finance_verified')
            ->with('site:id,name')
            ->get();

        // ── Dispatch Variances ─────────────────────────────────────
        $dispatchVariances = DispatchRecord::whereDate('dispatch_date', $date)
            ->whereIn('status', ['amber', 'red'])
            ->with(['destinationSite:id,name'])
            ->get(['id', 'dispatch_id', 'sku', 'quantity_dispatched', 'quantity_received', 'status', 'destination_site_id']);

        // ── Temperatures ───────────────────────────────────────────
        $tempBreaches = TemperatureLog::whereDate('log_date', $date)
            ->where('within_range', false)
            ->with('site:id,name')
            ->get(['id', 'site_id', 'unit_name', 'temp_c', 'reading_period', 'status', 'corrective_action']);

        // ── Compliance score (gate completion rate) ────────────────
        $siteCount   = Site::where('is_active', true)->count();
        $greenGates  = $gateStatus->where('gate_status', 'green')->count();

        return response()->json([
            'date'               => $date->toDateString(),
            'close_gate'         => $gateStatus->values(),
            'compliance_rate'    => $siteCount > 0 ? round(($greenGates / $siteCount) * 100) : 0,
            'open_incidents'     => $openIncidents,
            'red_incident_count' => $openIncidents->where('severity', 'red')->count(),
            'waste'              => [
                'total_recipe_cost'  => $wasteToday?->total_recipe_cost ?? 0,
                'total_retail_value' => $wasteToday?->total_retail_value ?? 0,
                'top_skus'           => $topWasteSKUs,
            ],
            'cash' => [
                'reconciliations'  => $cashRecons,
                'total_variance'   => $cashRecons->sum('cash_variance'),
                'red_sites'        => $cashRecons->where('status', 'red')->count(),
            ],
            'dispatch_variances' => $dispatchVariances,
            'temperature_breaches' => $tempBreaches,
        ]);
    }

    /**
     * Weekly dashboard — for weekly 30–45 min Ops Head + Owner review.
     */
    public function weeklySummary(): JsonResponse
    {
        $start = now()->startOfWeek();
        $end   = now()->endOfWeek();

        $wasteTrend = WasteEntry::whereBetween('waste_date', [$start, $end])
            ->groupBy('waste_date', 'site_id')
            ->select('waste_date', 'site_id', DB::raw('SUM(total_recipe_cost) as daily_cost'))
            ->with('site:id,name')
            ->orderBy('waste_date')
            ->get();

        $gateCompliance = CloseGateSubmission::whereBetween('gate_date', [$start, $end])
            ->groupBy('gate_date', 'site_id')
            ->select('gate_date', 'site_id', 'gate_status')
            ->with('site:id,name')
            ->get();

        $cashVariances = CashReconciliation::whereBetween('recon_date', [$start, $end])
            ->select('recon_date', 'site_id', 'cash_variance', 'status')
            ->with('site:id,name')
            ->get();

        return response()->json([
            'period'          => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'waste_trend'     => $wasteTrend,
            'gate_compliance' => $gateCompliance,
            'cash_variances'  => $cashVariances,
        ]);
    }
}
