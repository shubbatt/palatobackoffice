<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncidentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Incident::with(['site:id,name', 'raisedBy:id,name', 'ownedBy:id,name', 'resolvedBy:id,name'])
            ->when($request->start_date, fn($q, $v) => $q->whereDate('raised_at', '>=', $v))
            ->when($request->end_date, fn($q, $v) => $q->whereDate('raised_at', '<=', $v))
            ->when($request->severity,    fn($q, $v) => $q->where('severity', $v))
            ->when($request->site_id,     fn($q, $v) => $q->where('site_id', $v))
            ->when($request->resolved !== null, fn($q) => $q->where('is_resolved', $request->boolean('resolved')))
            ->orderByRaw("CASE severity WHEN 'red' THEN 1 WHEN 'amber' THEN 2 WHEN 'green' THEN 3 ELSE 4 END")
            ->orderByDesc('raised_at');

        return response()->json(['data' => $query->get()]);
    }

    public function show(Incident $incident): JsonResponse
    {
        return response()->json(
            $incident->load(['site:id,name', 'raisedBy:id,name', 'ownedBy:id,name', 'resolvedBy:id,name'])
        );
    }

    public function resolve(Request $request, Incident $incident): JsonResponse
    {
        abort_if($incident->is_resolved, 409, 'Already resolved.');

        $data = $request->validate([
            'resolution_notes' => 'required_without:notes|string|min:10',
            'notes'            => 'required_without:resolution_notes|string|min:10',
        ]);

        $resolutionNotes = $data['resolution_notes'] ?? $data['notes'] ?? '';

        $incident->update([
            'is_resolved'        => true,
            'resolved_by_user_id'=> auth()->id(),
            'resolved_at'        => now(),
            'resolution_notes'   => $resolutionNotes,
        ]);

        return response()->json($incident->fresh()->load(['site:id,name', 'raisedBy:id,name', 'ownedBy:id,name', 'resolvedBy:id,name']));
    }
}
