<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TemperatureLog;
use App\Services\EscalationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemperatureController extends Controller
{
    // Default limits — must be overridden by validated food-safety schedule per site
    private const FRIDGE_MIN  =  0.0;
    private const FRIDGE_MAX  =  8.0;
    private const FREEZER_MIN = -25.0;
    private const FREEZER_MAX = -15.0;
    private const HOT_HOLD_MIN = 63.0;
    private const HOT_HOLD_MAX = 85.0;

    public function __construct(private EscalationService $escalation) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'site_id'          => 'required|exists:sites,id',
            'log_date'         => 'date|nullable',
            'reading_period'   => 'required|in:open,mid,close',
            'unit_name'        => 'required|string|max:100',
            'unit_type'        => 'nullable|in:fridge,freezer,hot_hold',
            'temp_c'           => 'required|numeric',
            'corrective_action'=> 'nullable|string|max:1000',
        ]);

        [$minC, $maxC] = match($data['unit_type'] ?? 'fridge') {
            'freezer'  => [self::FREEZER_MIN,  self::FREEZER_MAX],
            'hot_hold' => [self::HOT_HOLD_MIN, self::HOT_HOLD_MAX],
            default    => [self::FRIDGE_MIN,   self::FRIDGE_MAX],
        };

        $withinRange = $data['temp_c'] >= $minC && $data['temp_c'] <= $maxC;
        $isOvernight = $data['reading_period'] === 'close' && ! $withinRange;

        $status = 'green';
        if (! $withinRange) {
            $status = $this->escalation->evaluateTemperature(
                $data['site_id'],
                $data['unit_name'],
                $data['temp_c'],
                $minC,
                $maxC,
                $isOvernight
            );
        }

        $log = TemperatureLog::create(array_merge($data, [
            'recorded_by_user_id' => auth()->id(),
            'log_date'    => $data['log_date'] ?? today(),
            'recorded_at' => now(),
            'min_limit_c' => $minC,
            'max_limit_c' => $maxC,
            'within_range'=> $withinRange,
            'status'      => $status,
        ]));

        return response()->json($log->load('site:id,name'), 201);
    }

    public function index(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', $request->get('date', today()->toDateString()));
        $endDate = $request->get('end_date', $startDate);

        $logs = TemperatureLog::with(['site:id,name', 'recordedBy:id,name'])
            ->whereBetween('log_date', [$startDate, $endDate])
            ->when($request->site_id, fn($q, $v) => $q->where('site_id', $v))
            ->orderByDesc('log_date')
            ->orderByDesc('recorded_at')
            ->get();

        return response()->json($logs);
    }
}
