<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClosingLog;
use App\Services\EscalationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClosingController extends Controller
{
    public function __construct(private EscalationService $escalation) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'site_id'                    => 'required|exists:sites,id',
            'log_date'                   => 'date|nullable',

            // Section A — Sales close
            'zreport_completed'          => 'boolean',
            'zreport_photo_path'         => 'nullable|string',
            'card_settlement_done'       => 'boolean',
            'cash_expected'              => 'nullable|numeric',
            'cash_actual'                => 'nullable|numeric',
            'cash_variance_reason'       => 'nullable|string',

            // Section B — Product disposition
            'unsold_stock_recorded'      => 'boolean',
            'unsold_stock_notes'         => 'nullable|string',

            // Section C — Cleaning
            'cleaning_done'              => 'boolean',
            'walkthrough_photo_path'     => 'nullable|string',

            // Section D — Equipment
            'final_fridge_temp_ok'       => 'boolean',
            'equipment_shutdown_ok'      => 'boolean',
            'equipment_notes'            => 'nullable|string',

            // Section E — Security
            'cash_secured'               => 'boolean',
            'deposit_made'               => 'boolean',
            'deposit_amount'             => 'nullable|numeric',
            'security_confirmed'         => 'boolean',
            'alarm_set'                  => 'boolean',

            // Production-specific (kitchen close)
            'production_reconciled'      => 'nullable|boolean',
            'ingredient_shortfalls'      => 'nullable|string',
            'tomorrow_prep_set'          => 'nullable|boolean',

            'is_complete'                => 'boolean',
        ]);

        $date = $data['log_date'] ?? today()->toDateString();

        // Auto-evaluate cash variance
        $cashVariance = null;
        $status = 'green';

        if (isset($data['cash_expected'], $data['cash_actual'])) {
            $cashVariance = $data['cash_actual'] - $data['cash_expected'];
            $status = $this->escalation->evaluateCashVariance(
                $data['site_id'],
                $cashVariance,
                auth()->user()->name
            );
        }

        $log = ClosingLog::updateOrCreate(
            ['site_id' => $data['site_id'], 'log_date' => $date],
            array_merge($data, [
                'user_id'      => auth()->id(),
                'log_date'     => $date,
                'closed_at'    => ($data['is_complete'] ?? false) ? now() : null,
                'cash_variance'=> $cashVariance,
                'status'       => $status,
            ])
        );

        $log->refresh();

        return response()->json($log->load(['site:id,name', 'user:id,name']), 201);
    }

    public function today(Request $request, int $site): JsonResponse
    {
        $log = ClosingLog::with(['user:id,name'])
            ->where('site_id', $site)
            ->whereDate('log_date', today())
            ->first();

        return response()->json($log);
    }
}
