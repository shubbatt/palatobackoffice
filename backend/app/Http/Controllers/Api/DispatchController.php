<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DispatchRecord;
use App\Services\EscalationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DispatchController extends Controller
{
    public function __construct(private EscalationService $escalation) {}

    /**
     * Stage 1: Production Lead creates dispatch.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'origin_site_id'      => 'required|exists:sites,id',
            'destination_site_id' => 'required|exists:sites,id|different:origin_site_id',
            'sku'                 => 'required|string|max:100',
            'quantity_dispatched' => 'required|integer|min:1',
            'temperature_sensitive' => 'boolean',
            'pack_temp_c'         => 'nullable|numeric',
            'pack_condition'      => 'in:good,damaged,suspect',
            'pack_photo_path'     => 'nullable|string',
        ]);

        $record = DispatchRecord::create([
            ...$data,
            'packed_by_user_id' => auth()->id(),
            'packed_at'         => now(),
            'dispatch_date'     => today(),
            'status'            => 'pending',
        ]);

        return response()->json($record->load(['originSite', 'destinationSite', 'packedBy']), 201);
    }

    /**
     * Stage 1: Production Lead creates multiple dispatches in bulk.
     */
    public function storeBulk(Request $request): JsonResponse
    {
        $data = $request->validate([
            'dispatches'                         => 'required|array|min:1',
            'dispatches.*.origin_site_id'        => 'required|exists:sites,id',
            'dispatches.*.destination_site_id'   => 'required|exists:sites,id|different:dispatches.*.origin_site_id',
            'dispatches.*.sku'                   => 'required|string|max:100',
            'dispatches.*.quantity_dispatched'   => 'required|integer|min:1',
            'dispatches.*.temperature_sensitive' => 'boolean',
            'dispatches.*.pack_temp_c'           => 'nullable|numeric',
            'dispatches.*.pack_condition'        => 'in:good,damaged,suspect',
            'dispatches.*.pack_photo_path'       => 'nullable|string',
        ]);

        $records = [];
        $now = now();
        $userId = auth()->id();
        $today = today();

        foreach ($data['dispatches'] as $dispatchData) {
            $dispatchData['temperature_sensitive'] = $dispatchData['temperature_sensitive'] ?? false;
            $dispatchData['pack_condition'] = $dispatchData['pack_condition'] ?? 'good';

            $records[] = DispatchRecord::create([
                ...$dispatchData,
                'packed_by_user_id' => $userId,
                'packed_at'         => $now,
                'dispatch_date'     => $today,
                'status'            => 'pending',
            ]);
        }

        return response()->json([
            'message' => 'Bulk dispatch created', 
            'count' => count($records)
        ], 201);
    }

    /**
     * Stage 2: Driver confirms collection.
     */
    public function confirmCollection(Request $request, DispatchRecord $dispatch): JsonResponse
    {
        abort_if($dispatch->collected_at !== null, 409, 'Already collected.');

        $dispatch->update([
            'collected_by_user_id' => auth()->id(),
            'collected_at'         => now(),
            'status'               => 'in_transit',
        ]);

        return response()->json($dispatch->fresh());
    }

    /**
     * Stage 3: Outlet manager confirms receipt and logs quantity.
     * Segregation: receiver != packer.
     */
    public function confirmReceipt(Request $request, DispatchRecord $dispatch): JsonResponse
    {
        abort_if($dispatch->received_at !== null, 409, 'Already received.');
        abort_if(
            $dispatch->packed_by_user_id === auth()->id(),
            403,
            'Receiver cannot be the same person who packed the dispatch.'
        );

        $data = $request->validate([
            'quantity_received' => 'required|integer|min:0',
            'received_condition' => 'in:good,damaged,suspect',
            'receive_photo_path' => 'nullable|string',
            'variance_notes'    => 'nullable|string',
        ]);

        $dispatch->update([
            ...$data,
            'received_by_user_id' => auth()->id(),
            'received_at'         => now(),
        ]);

        // Evaluate variance and escalate if needed
        $sku = $dispatch->sku;
        $skuCost = \App\Models\SkuCost::where('sku', $sku)->value('recipe_cost') ?? 100;
        $status = $this->escalation->evaluateDispatchVariance(
            $dispatch->destination_site_id,
            $sku,
            $dispatch->quantity_dispatched,
            $data['quantity_received'],
            $skuCost
        );

        $dispatch->update(['status' => $status]);

        return response()->json($dispatch->fresh()->load(['packedBy', 'receivedBy']));
    }

    /**
     * List dispatches for a site and date.
     */
    public function index(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', $request->get('date', today()->toDateString()));
        $endDate = $request->get('end_date', $startDate);

        $query = DispatchRecord::with(['originSite', 'destinationSite', 'packedBy', 'receivedBy']);

        if ($startDate === $endDate) {
            $query->whereDate('dispatch_date', $startDate);
        } else {
            $query->whereDate('dispatch_date', '>=', $startDate)
                  ->whereDate('dispatch_date', '<=', $endDate);
        }

        if ($request->has('site_id')) {
            $query->where('destination_site_id', $request->site_id);
        }

        return response()->json(['data' => $query->orderByDesc('dispatch_date')->orderByDesc('created_at')->get()]);
    }
}
