<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OpeningLog;
use App\Services\EscalationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OpeningController extends Controller
{
    public function __construct(private EscalationService $escalation) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'site_id'                     => 'required|exists:sites,id',
            'log_date'                    => 'date|nullable',
            'overnight_anomaly'           => 'in:none,minor,security_concern,equipment_fault',
            'anomaly_notes'               => 'nullable|string|max:1000',
            'anomaly_photo_path'          => 'nullable|string',
            'refrigeration_readings'      => 'nullable|array',
            'refrigeration_readings.*.unit'     => 'required|string',
            'refrigeration_readings.*.temp_c'   => 'required|numeric',
            'refrigeration_readings.*.within_range' => 'required|boolean',
            'cash_float_counted'          => 'nullable|numeric|min:0',
            'float_photo_path'            => 'nullable|string',
            'pos_operational'             => 'boolean',
            'card_terminal_operational'   => 'boolean',
            'espresso_machine_operational'=> 'nullable|boolean',
            'receiving_reconciled'        => 'boolean',
            'receiving_notes'             => 'nullable|string',
            'team_brief_done'             => 'boolean',
            'brief_notes'                 => 'nullable|string',
            'is_complete'                 => 'boolean',
        ]);

        $date = $data['log_date'] ?? today()->toDateString();

        // Determine status from refrigeration readings
        $status = 'green';
        if (! empty($data['refrigeration_readings'])) {
            foreach ($data['refrigeration_readings'] as $r) {
                if (! $r['within_range']) {
                    $status = 'amber';
                    // Escalate temperature breach
                    $this->escalation->evaluateTemperature(
                        $data['site_id'],
                        $r['unit'],
                        $r['temp_c'],
                        0,    // min limit — will be validated against food-safety schedule
                        8,    // max limit (default fridge)
                        false
                    );
                }
            }
        }

        if (($data['overnight_anomaly'] ?? 'none') === 'security_concern') {
            $status = 'red';
        }

        $log = OpeningLog::updateOrCreate(
            ['site_id' => $data['site_id'], 'log_date' => $date],
            array_merge($data, [
                'user_id'    => auth()->id(),
                'log_date'   => $date,
                'opened_at'  => ($data['is_complete'] ?? false) ? now() : null,
                'status'     => $status,
            ])
        );

        return response()->json($log->load(['site:id,name', 'user:id,name']), 201);
    }

    public function today(Request $request, int $site): JsonResponse
    {
        $log = OpeningLog::with(['user:id,name'])
            ->where('site_id', $site)
            ->whereDate('log_date', today())
            ->first();

        return response()->json($log);
    }

    public function update(Request $request, OpeningLog $log): JsonResponse
    {
        $this->authorize('update', $log);

        $log->update($request->validate([
            'team_brief_done'  => 'boolean',
            'brief_notes'      => 'nullable|string',
            'receiving_reconciled' => 'boolean',
            'receiving_notes'  => 'nullable|string',
            'is_complete'      => 'boolean',
        ]));

        if ($log->is_complete && ! $log->opened_at) {
            $log->update(['opened_at' => now()]);
        }

        return response()->json($log->fresh());
    }

    public function index(Request $request): JsonResponse
    {
        $logs = OpeningLog::with(['site:id,name', 'user:id,name'])
            ->whereDate('log_date', $request->get('date', today()))
            ->when($request->site_id, fn($q, $id) => $q->where('site_id', $id))
            ->get();

        return response()->json($logs);
    }
}
