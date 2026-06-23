<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opening_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('sites');
            $table->foreignId('user_id')->constrained('users');  // shift manager
            $table->date('log_date');
            $table->timestamp('opened_at')->nullable();

            // Phase 1 — Premises & Safety
            $table->boolean('alarm_disarmed')->default(false);
            $table->boolean('overnight_walkthrough_done')->default(false);
            $table->enum('overnight_anomaly', ['none', 'minor', 'security_concern', 'equipment_fault'])->default('none');
            $table->text('anomaly_notes')->nullable();
            $table->string('anomaly_photo_path')->nullable();

            // Phase 2 — Refrigeration (JSON array of unit readings)
            $table->json('refrigeration_readings')->nullable();
            // [{ "unit": "Display Fridge", "temp_c": 3.2, "within_range": true }]
            $table->boolean('refrigeration_ok')->default(false);

            // Phase 3 — Equipment & Cash
            $table->boolean('pos_operational')->default(false);
            $table->boolean('card_terminal_operational')->default(false);
            $table->boolean('espresso_machine_operational')->nullable();
            $table->decimal('cash_float_counted', 10, 2)->nullable();
            $table->string('float_photo_path')->nullable();

            // Phase 4 — Receiving
            $table->boolean('receiving_reconciled')->default(false);
            $table->text('receiving_notes')->nullable();

            // Phase 5 — Team brief
            $table->boolean('team_brief_done')->default(false);
            $table->text('brief_notes')->nullable();

            // Meta
            $table->boolean('is_complete')->default(false);
            $table->enum('status', ['green', 'amber', 'red'])->default('green');

            $table->timestamps();
            $table->unique(['site_id', 'log_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opening_logs');
    }
};
