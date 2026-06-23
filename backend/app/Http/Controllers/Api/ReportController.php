<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Site, CloseGateSubmission, WasteEntry, CashReconciliation, Incident, DispatchRecord, TemperatureLog};
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function custom(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        $start = Carbon::parse($request->start_date)->startOfDay();
        $end   = Carbon::parse($request->end_date)->endOfDay();

        // ── Close Gate ─────────────────────────────────────────────
        $gateStatus = CloseGateSubmission::whereBetween('gate_date', [$start, $end])
            ->select('site_id', 'gate_status', 'checks_passed', 'checks_total', 'submitted_by_user_id', 'gate_date')
            ->with(['site:id,name', 'submittedBy:id,name'])
            ->get();

        // ── Open & All Incidents ───────────────────────────────────
        $incidents = Incident::whereBetween('raised_at', [$start, $end])
            ->select('id', 'reference', 'site_id', 'severity', 'category', 'title', 'raised_at', 'is_resolved')
            ->with('site:id,name')
            ->orderBy('severity')
            ->get();

        // ── Waste KPIs ─────────────────────────────────────────────
        $wasteStats = WasteEntry::whereBetween('waste_date', [$start, $end])
            ->select(
                DB::raw('SUM(total_recipe_cost) as total_recipe_cost'),
                DB::raw('SUM(total_retail_value) as total_retail_value'),
                DB::raw('COUNT(*) as entries'),
            )
            ->first();

        $topWasteSKUs = WasteEntry::whereBetween('waste_date', [$start, $end])
            ->groupBy('sku')
            ->orderByDesc('total')
            ->limit(10)
            ->select('sku', DB::raw('SUM(total_recipe_cost) as total'))
            ->get();

        // ── Cash ───────────────────────────────────────────────────
        $cashRecons = CashReconciliation::whereBetween('recon_date', [$start, $end])
            ->select('site_id', 'cash_variance', 'status', 'finance_verified', 'recon_date')
            ->with('site:id,name')
            ->get();

        // ── Dispatch Variances ─────────────────────────────────────
        $dispatchVariances = DispatchRecord::whereBetween('dispatch_date', [$start, $end])
            ->whereIn('status', ['amber', 'red'])
            ->with(['destinationSite:id,name'])
            ->get(['id', 'dispatch_date', 'dispatch_id', 'sku', 'quantity_dispatched', 'quantity_received', 'status', 'destination_site_id']);

        // ── Temperatures ───────────────────────────────────────────
        $tempBreaches = TemperatureLog::whereBetween('log_date', [$start, $end])
            ->where('within_range', false)
            ->with('site:id,name')
            ->get(['id', 'log_date', 'site_id', 'unit_name', 'temp_c', 'reading_period', 'status', 'corrective_action']);

        return response()->json([
            'period'             => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'close_gate'         => $gateStatus,
            'incidents'          => $incidents,
            'red_incident_count' => $incidents->where('severity', 'red')->count(),
            'waste'              => [
                'total_recipe_cost'  => $wasteStats?->total_recipe_cost ?? 0,
                'total_retail_value' => $wasteStats?->total_retail_value ?? 0,
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
}
