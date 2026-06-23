<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('close_gate_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('sites');
            $table->foreignId('submitted_by_user_id')->constrained('users');
            $table->date('gate_date');
            $table->timestamp('submitted_at');

            // 13 required checks — each: pass | amber | red | na
            $table->enum('check_opening_complete', ['pass', 'amber', 'red'])->default('pass');
            $table->enum('check_pos_zreport', ['pass', 'amber', 'red'])->default('pass');
            $table->enum('check_cash_reconciled', ['pass', 'amber', 'red'])->default('pass');
            $table->enum('check_card_settlement', ['pass', 'amber', 'red'])->default('pass');
            $table->enum('check_temperatures', ['pass', 'amber', 'red'])->default('pass');
            $table->enum('check_food_safety', ['pass', 'amber', 'red'])->default('pass');
            $table->enum('check_unsold_stock', ['pass', 'amber', 'red'])->default('pass');
            $table->enum('check_waste_records', ['pass', 'amber', 'red'])->default('pass');
            $table->enum('check_receiving_reconciled', ['pass', 'amber', 'red'])->default('pass');
            $table->enum('check_cleaning', ['pass', 'amber', 'red'])->default('pass');
            $table->enum('check_equipment_status', ['pass', 'amber', 'red'])->default('pass');
            $table->enum('check_cash_secured', ['pass', 'amber', 'red'])->default('pass');
            $table->enum('check_security', ['pass', 'amber', 'red'])->default('pass');

            // Notes per failed check
            $table->json('check_notes')->nullable();

            // Computed gate status
            $table->enum('gate_status', ['green', 'amber', 'red'])->default('green');
            $table->integer('checks_passed');
            $table->integer('checks_total')->default(13);

            // Override (only Ops Head / Owner can approve)
            $table->boolean('override_required')->default(false);
            $table->foreignId('override_approved_by')->nullable()->constrained('users');
            $table->text('override_reason')->nullable();
            $table->text('override_containment')->nullable();
            $table->string('override_responsible_person')->nullable();
            $table->date('override_deadline')->nullable();
            $table->timestamp('override_approved_at')->nullable();

            $table->timestamps();
            $table->unique(['site_id', 'gate_date']);
            $table->index(['gate_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('close_gate_submissions');
    }
};
