<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waste_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('sites');
            $table->foreignId('recorded_by_user_id')->constrained('users');
            $table->date('waste_date');
            $table->timestamp('recorded_at');

            // Product
            $table->string('sku');
            $table->integer('units_wasted');

            // Financial (tracked in 3 dimensions per framework)
            $table->decimal('recipe_cost_per_unit', 10, 2);   // from waste_cost_file
            $table->decimal('retail_price_per_unit', 10, 2);  // from waste_cost_file
            $table->decimal('total_recipe_cost', 10, 2)->storedAs('units_wasted * recipe_cost_per_unit');
            $table->decimal('total_retail_value', 10, 2)->storedAs('units_wasted * retail_price_per_unit');

            // Reason code
            $table->enum('reason_code', [
                'overproduction',
                'expiry',
                'damage',
                'quality_failure',
                'return',
                'staff_error',
                'customer_recovery',
                'other',
            ]);
            $table->text('notes')->nullable();
            $table->string('evidence_photo_path')->nullable();

            // Disposition
            $table->enum('disposition', [
                'waste',
                'staff_consumption',
                'donation',
                'return_to_production',
                'next_day_sale',
            ])->default('waste');

            // Escalation
            $table->enum('status', ['green', 'amber', 'red'])->default('green');

            $table->timestamps();
            $table->index(['site_id', 'waste_date']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waste_entries');
    }
};
