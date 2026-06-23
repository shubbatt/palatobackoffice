<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{WasteEntry, SkuCost};
use App\Services\EscalationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WasteController extends Controller
{
    // Pilot threshold — MVR per site per day. Finance resets after Week 4.
    private const DAILY_THRESHOLD_MVR = 500;

    public function __construct(private EscalationService $escalation) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'site_id'             => 'required|exists:sites,id',
            'waste_date'          => 'date|nullable',
            'sku'                 => 'required|string|max:100',
            'units_wasted'        => 'required|integer|min:1',
            'reason_code'         => 'required|in:overproduction,expiry,damage,quality_failure,return,staff_error,customer_recovery,other',
            'disposition'         => 'required|in:waste,staff_consumption,donation,return_to_production,next_day_sale',
            'notes'               => 'nullable|string|max:1000',
            'evidence_photo_path' => 'nullable|string',
        ]);

        // Look up recipe cost and retail price from SKU file
        $skuCost = SkuCost::where('sku', $data['sku'])->first();

        $recipeCostPerUnit  = $skuCost?->recipe_cost  ?? 100;
        $retailPricePerUnit = $skuCost?->retail_price ?? 200;

        $entry = WasteEntry::create(array_merge($data, [
            'recorded_by_user_id' => auth()->id(),
            'waste_date'          => $data['waste_date'] ?? today(),
            'recorded_at'         => now(),
            'recipe_cost_per_unit'  => $recipeCostPerUnit,
            'retail_price_per_unit' => $retailPricePerUnit,
        ]));

        // Evaluate against daily running total
        $dailyTotal = WasteEntry::where('site_id', $data['site_id'])
            ->whereDate('waste_date', $data['waste_date'] ?? today())
            ->sum('total_recipe_cost');

        $status = $this->escalation->evaluateWaste(
            $data['site_id'],
            $data['sku'],
            $data['units_wasted'],
            $recipeCostPerUnit,
            self::DAILY_THRESHOLD_MVR
        );

        $entry->update(['status' => $status]);
        $entry->refresh();

        return response()->json($entry->load('site:id,name'), 201);
    }

    public function index(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', $request->get('date', today()->toDateString()));
        $endDate = $request->get('end_date', $startDate);

        $entries = WasteEntry::with(['site:id,name', 'recordedBy:id,name'])
            ->whereBetween('waste_date', [$startDate, $endDate])
            ->when($request->site_id, fn($q, $id) => $q->where('site_id', $id))
            ->orderByDesc('waste_date')
            ->orderByDesc('recorded_at')
            ->get();

        // Aggregated summary
        $summary = [
            'total_recipe_cost'  => $entries->sum('total_recipe_cost'),
            'total_retail_value' => $entries->sum('total_retail_value'),
            'total_units'        => $entries->sum('units_wasted'),
            'by_reason'          => $entries->groupBy('reason_code')
                ->map(fn($g) => ['count' => $g->count(), 'cost' => $g->sum('total_recipe_cost')]),
        ];

        return response()->json(['data' => $entries, 'summary' => $summary]);
    }
}
