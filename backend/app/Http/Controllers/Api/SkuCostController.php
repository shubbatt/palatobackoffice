<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SkuCost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SkuCostController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(SkuCost::where('is_active', true)->orderBy('category')->orderBy('sku')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'sku'                    => 'required|string|max:100|unique:sku_costs,sku',
            'category'               => 'nullable|string|max:100',
            'recipe_cost'            => 'required|numeric|min:0',
            'retail_price'           => 'required|numeric|min:0',
            'approved_dispositions'  => 'nullable|array',
            'approved_dispositions.*'=> 'in:next_day_sale,staff_consumption,donation,return_to_production,waste',
            'is_controlled'          => 'boolean',
        ]);

        return response()->json(SkuCost::create($data), 201);
    }

    public function update(Request $request, SkuCost $skuCost): JsonResponse
    {
        $data = $request->validate([
            'recipe_cost'  => 'numeric|min:0',
            'retail_price' => 'numeric|min:0',
            'is_controlled'=> 'boolean',
            'is_active'    => 'boolean',
            'approved_dispositions' => 'nullable|array',
        ]);

        $skuCost->update($data);
        return response()->json($skuCost->fresh());
    }

    public function destroy(SkuCost $skuCost): JsonResponse
    {
        $skuCost->update(['is_active' => false]); // Soft deactivate, preserve waste history
        return response()->json(['message' => 'SKU deactivated.']);
    }
}
