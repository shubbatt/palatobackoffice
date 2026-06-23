<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CloseGateSubmission;
use App\Services\CloseGateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CloseGateController extends Controller
{
    public function __construct(private CloseGateService $gateService) {}

    public function submit(Request $request): JsonResponse
    {
        $data = $request->validate([
            'site_id'    => 'required|exists:sites,id',
            'gate_date'  => 'date|nullable',

            // 13 checks — each must be pass | amber | red
            'check_opening_complete'      => 'required|in:pass,amber,red',
            'check_pos_zreport'           => 'required|in:pass,amber,red',
            'check_cash_reconciled'       => 'required|in:pass,amber,red',
            'check_card_settlement'       => 'required|in:pass,amber,red',
            'check_temperatures'          => 'required|in:pass,amber,red',
            'check_food_safety'           => 'required|in:pass,amber,red',
            'check_unsold_stock'          => 'required|in:pass,amber,red',
            'check_waste_records'         => 'required|in:pass,amber,red',
            'check_receiving_reconciled'  => 'required|in:pass,amber,red',
            'check_cleaning'              => 'required|in:pass,amber,red',
            'check_equipment_status'      => 'required|in:pass,amber,red',
            'check_cash_secured'          => 'required|in:pass,amber,red',
            'check_security'              => 'required|in:pass,amber,red',

            'check_notes' => 'nullable|array',
        ]);

        $data['gate_date'] = $data['gate_date'] ?? today()->toDateString();

        $submission = $this->gateService->submit($data, auth()->user());

        return response()->json($submission->load(['site:id,name', 'submittedBy:id,name']), 201);
    }

    public function approveOverride(Request $request, CloseGateSubmission $submission): JsonResponse
    {
        $data = $request->validate([
            'reason'              => 'required|string',
            'containment'         => 'required|string',
            'responsible_person'  => 'required|string',
            'deadline'            => 'required|date',
        ]);

        $this->gateService->approveOverride($submission, auth()->user(), $data);

        return response()->json($submission->fresh()->load(['overrideApprovedBy:id,name']));
    }

    public function index(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', $request->get('date', today()->toDateString()));
        $endDate = $request->get('end_date', $startDate);

        $submissions = CloseGateSubmission::with(['site:id,name', 'submittedBy:id,name'])
            ->whereBetween('gate_date', [$startDate, $endDate])
            ->orderByDesc('gate_date')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($submissions);
    }
}
