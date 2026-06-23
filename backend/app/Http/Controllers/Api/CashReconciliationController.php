<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashReconciliation;
use App\Services\EscalationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CashReconciliationController extends Controller
{
    public function __construct(private EscalationService $escalation) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'site_id'                => 'required|exists:sites,id',
            'recon_date'             => 'date|nullable',
            'pos_z_total'            => 'required|numeric|min:0',
            'card_settlement_total'  => 'required|numeric|min:0',
            'expected_cash'          => 'required|numeric|min:0',
            'actual_cash_counted'    => 'required|numeric|min:0',
            'deposit_made'           => 'boolean',
            'deposit_amount'         => 'nullable|numeric|min:0',
            'deposit_reference'      => 'nullable|string|max:100',
            'zreport_photo_path'     => 'nullable|string',
            'variance_reason'        => 'nullable|string|max:1000',
        ]);

        $variance = $data['actual_cash_counted'] - $data['expected_cash'];

        // Check for repeated variances this week
        $repeatedVariance = CashReconciliation::where('site_id', $data['site_id'])
            ->whereBetween('recon_date', [now()->startOfWeek(), now()])
            ->where('status', '!=', 'green')
            ->exists();

        $status = $this->escalation->evaluateCashVariance(
            $data['site_id'],
            $variance,
            auth()->user()->name,
            $repeatedVariance
        );

        $recon = CashReconciliation::updateOrCreate(
            ['site_id' => $data['site_id'], 'recon_date' => $data['recon_date'] ?? today()],
            array_merge($data, [
                'submitted_by_user_id' => auth()->id(),
                'status'               => $status,
            ])
        );

        $recon->refresh();

        return response()->json($recon->load('site:id,name'), 201);
    }

    public function verify(Request $request, CashReconciliation $recon): JsonResponse
    {
        // Finance segregation — verifier cannot be submitter
        abort_if(
            $recon->submitted_by_user_id === auth()->id(),
            403,
            'Finance cannot verify their own submission.'
        );

        $recon->update([
            'finance_verified'    => true,
            'verified_by_user_id' => auth()->id(),
            'verified_at'         => now(),
        ]);

        return response()->json($recon->fresh()->load(['site:id,name', 'verifiedBy:id,name']));
    }

    public function index(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', $request->get('date', today()->toDateString()));
        $endDate = $request->get('end_date', $startDate);

        $recons = CashReconciliation::with(['site:id,name', 'submittedBy:id,name', 'verifiedBy:id,name'])
            ->whereBetween('recon_date', [$startDate, $endDate])
            ->when($request->site_id, fn($q, $v) => $q->where('site_id', $v))
            ->orderByDesc('recon_date')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($recons);
    }
}
