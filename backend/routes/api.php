<?php

use App\Http\Controllers\Api\{
    AuthController,
    DashboardController,
    SiteController,
    OpeningController,
    ClosingController,
    DispatchController,
    WasteController,
    CloseGateController,
    IncidentController,
    CashReconciliationController,
    TemperatureController,
    SkuCostController,
    UserController,
    ReportController,
};
use Illuminate\Support\Facades\Route;

// ── Public ─────────────────────────────────────────────────────────
Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/seed', function () {
    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
    return response()->json(['message' => 'Database migrated and seeded successfully!']);
});

Route::get('/logs', function () {
    $logFile = storage_path('logs/laravel.log');
    if (!file_exists($logFile)) return "No logs";
    // Return last 100 lines
    $lines = file($logFile);
    return implode("", array_slice($lines, -100));
});

Route::get('/debug-dispatches', function () {
    return App\Models\DispatchRecord::all();
});

// ── Authenticated ──────────────────────────────────────────────────
Route::get('/error-test', function() {
    try {
        $data = \App\Models\Incident::first();
        return response()->json(['status' => 'deployed-v2', 'data' => $data]);
    } catch (\Throwable $e) {
        return response()->json(['status' => 'db_error', 'message' => $e->getMessage()]);
    }
});

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // ── Dashboard ─────────────────────────────────────────────────
    Route::prefix('dashboard')->group(function () {
        Route::get('/daily', [DashboardController::class, 'ownerSummary']);
        Route::get('/weekly', [DashboardController::class, 'weeklySummary']);
    });

    // ── Reports ───────────────────────────────────────────────────
    Route::prefix('reports')->middleware('role:owner')->group(function () {
        Route::get('/custom', [ReportController::class, 'custom']);
    });

    // ── Sites ─────────────────────────────────────────────────────
    Route::get('/sites', [SiteController::class, 'index']);
    Route::get('/sites/{site}', [SiteController::class, 'show']);
    Route::post('/sites', [SiteController::class, 'store'])->middleware('role:owner,operations_head,finance');
    Route::patch('/sites/{site}', [SiteController::class, 'update'])->middleware('role:owner,operations_head,finance');
    Route::delete('/sites/{site}', [SiteController::class, 'destroy'])->middleware('role:owner,operations_head,finance');

    // ── Opening ───────────────────────────────────────────────────
    // Roles: shift_manager, production_lead
    Route::prefix('opening')->middleware('role:shift_manager,production_lead')->group(function () {
        Route::post('/', [OpeningController::class, 'store']);
        Route::get('/today/{site}', [OpeningController::class, 'today']);
        Route::patch('/{log}', [OpeningController::class, 'update']);
    });

    // ── Dispatch (3-confirmation) ──────────────────────────────────
    Route::prefix('dispatch')->group(function () {
        Route::get('/', [DispatchController::class, 'index']);
        Route::post('/', [DispatchController::class, 'store'])
            ->middleware('role:production_lead,operations_head,owner');
        Route::patch('/{dispatch}/collect', [DispatchController::class, 'confirmCollection']);
        Route::patch('/{dispatch}/receive', [DispatchController::class, 'confirmReceipt'])
            ->middleware('role:shift_manager,operations_head,owner');
    });

    // ── Waste ──────────────────────────────────────────────────────
    Route::apiResource('waste', WasteController::class)->only(['index', 'store']);

    // ── Temperature ───────────────────────────────────────────────
    Route::apiResource('temperatures', TemperatureController::class)->only(['index', 'store']);

    // ── Cash Reconciliation ────────────────────────────────────────
    Route::prefix('cash')->group(function () {
        Route::get('/', [CashReconciliationController::class, 'index']);
        Route::post('/', [CashReconciliationController::class, 'store'])
            ->middleware('role:shift_manager');
        Route::patch('/{recon}/verify', [CashReconciliationController::class, 'verify'])
            ->middleware('role:finance,owner');
    });

    // ── Close Gate ────────────────────────────────────────────────
    Route::prefix('close-gate')->group(function () {
        Route::get('/', [CloseGateController::class, 'index']);
        Route::post('/', [CloseGateController::class, 'submit'])
            ->middleware('role:shift_manager,production_lead');
        Route::patch('/{submission}/override', [CloseGateController::class, 'approveOverride'])
            ->middleware('role:operations_head,owner');
    });

    // ── Incidents ─────────────────────────────────────────────────
    Route::apiResource('incidents', IncidentController::class)->only(['index', 'show']);
    Route::patch('/incidents/{incident}/resolve', [IncidentController::class, 'resolve'])
        ->middleware('role:operations_head,owner');

    // ── SKU Costs (Finance / Owner managed) ───────────────────────
    Route::get('sku-costs', [SkuCostController::class, 'index']);
    Route::apiResource('sku-costs', SkuCostController::class)
        ->except(['index'])
        ->middleware('role:finance,owner,operations_head');

    // ── Users (Admin managed) ────────────────────────────────────────
    Route::apiResource('users', UserController::class)
        ->middleware('role:owner,operations_head');

    // ── Closing ───────────────────────────────────────────────────
    Route::prefix('closing')->middleware('role:shift_manager,production_lead')->group(function () {
        Route::post('/', [ClosingController::class, 'store']);
        Route::get('/today/{site}', [ClosingController::class, 'today']);
    });
});
