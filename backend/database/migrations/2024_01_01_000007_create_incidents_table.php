<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Incidents ──────────────────────────────────────────────
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique(); // INC-XXXXXX
            $table->foreignId('site_id')->constrained('sites');
            $table->foreignId('raised_by_user_id')->constrained('users');
            $table->timestamp('raised_at');

            $table->enum('severity', ['green', 'amber', 'red']);
            $table->enum('category', [
                'cash',
                'temperature',
                'dispatch_receiving',
                'waste',
                'equipment',
                'staffing',
                'customer',
                'security',
                'food_safety',
                'other',
            ]);

            $table->string('title');
            $table->text('description');
            $table->json('evidence_paths')->nullable();

            // Resolution
            $table->foreignId('owned_by_user_id')->nullable()->constrained('users');
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users');
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->boolean('is_resolved')->default(false);

            // Escalation tracking
            $table->boolean('owner_notified')->default(false);
            $table->timestamp('owner_notified_at')->nullable();

            $table->timestamps();
            $table->index(['severity', 'is_resolved']);
            $table->index(['site_id', 'raised_at']);
        });

        // ── Cash Reconciliations ───────────────────────────────────
        Schema::create('cash_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('sites');
            $table->foreignId('submitted_by_user_id')->constrained('users');
            $table->date('recon_date');

            // Sales
            $table->decimal('pos_z_total', 12, 2);
            $table->decimal('card_settlement_total', 12, 2);
            $table->decimal('expected_cash', 12, 2);
            $table->decimal('actual_cash_counted', 12, 2);
            $table->decimal('cash_variance', 12, 2)->storedAs('actual_cash_counted - expected_cash');

            // Deposit
            $table->boolean('deposit_made')->default(false);
            $table->decimal('deposit_amount', 12, 2)->nullable();
            $table->string('deposit_reference')->nullable();
            $table->string('zreport_photo_path')->nullable();

            // Status
            $table->enum('status', ['green', 'amber', 'red'])->default('green');
            $table->text('variance_reason')->nullable();

            // Finance independent check
            $table->boolean('finance_verified')->default(false);
            $table->foreignId('verified_by_user_id')->nullable()->constrained('users');
            $table->timestamp('verified_at')->nullable();

            $table->timestamps();
            $table->unique(['site_id', 'recon_date']);
        });

        // ── Temperature Logs ───────────────────────────────────────
        Schema::create('temperature_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('sites');
            $table->foreignId('recorded_by_user_id')->constrained('users');
            $table->date('log_date');
            $table->enum('reading_period', ['open', 'mid', 'close']);
            $table->timestamp('recorded_at');

            $table->string('unit_name');  // "Display Fridge", "Walk-in Cold"
            $table->string('unit_type')->nullable(); // fridge, freezer, hot_hold
            $table->decimal('temp_c', 5, 2);
            $table->decimal('min_limit_c', 5, 2)->nullable();
            $table->decimal('max_limit_c', 5, 2)->nullable();
            $table->boolean('within_range')->default(true);
            $table->text('corrective_action')->nullable();
            $table->enum('status', ['green', 'amber', 'red'])->default('green');

            $table->timestamps();
            $table->index(['site_id', 'log_date']);
        });

        // ── SKU Cost File (Waste valuation) ────────────────────────
        Schema::create('sku_costs', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique();
            $table->string('category')->nullable();
            $table->decimal('recipe_cost', 10, 2);    // MVR per unit
            $table->decimal('retail_price', 10, 2);   // MVR per unit
            $table->json('approved_dispositions')->nullable(); // next_day, staff, donation, etc.
            $table->boolean('is_controlled')->default(false);  // requires photo evidence for waste
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('temperature_logs');
        Schema::dropIfExists('cash_reconciliations');
        Schema::dropIfExists('incidents');
        Schema::dropIfExists('sku_costs');
    }
};
