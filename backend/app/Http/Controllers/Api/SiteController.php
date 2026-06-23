<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Site::where('is_active', true)->orderBy('name')->get());
    }

    public function show(Site $site): JsonResponse
    {
        return response()->json($site);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:outlet,production,warehouse',
            'opening_owner' => 'nullable|string|max:255',
            'closing_owner' => 'nullable|string|max:255',
            'operating_hours' => 'nullable|string|max:255',
            'primary_supply_source' => 'nullable|string|max:255',
        ]);

        return response()->json(Site::create($data), 201);
    }

    public function update(Request $request, Site $site): JsonResponse
    {
        $data = $request->validate([
            'name' => 'string|max:255',
            'type' => 'string|in:outlet,production,warehouse',
            'opening_owner' => 'nullable|string|max:255',
            'closing_owner' => 'nullable|string|max:255',
            'operating_hours' => 'nullable|string|max:255',
            'primary_supply_source' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $site->update($data);
        return response()->json($site->fresh());
    }

    public function destroy(Site $site): JsonResponse
    {
        $site->update(['is_active' => false]);
        return response()->json(['message' => 'Site deactivated.']);
    }
}
