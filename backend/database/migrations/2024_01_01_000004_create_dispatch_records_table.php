<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dispatch_records', function (Blueprint $table) {
            $table->id();
            $table->string('dispatch_id', 12)->unique(); // DSP-XXXXXX

            // Origin & destination
            $table->foreignId('origin_site_id')->constrained('sites');
            $table->foreignId('destination_site_id')->constrained('sites');
            $table->date('dispatch_date');

            // SKU details
            $table->string('sku');
            $table->string('sku_category')->nullable();
            $table->integer('quantity_dispatched');
            $table->boolean('temperature_sensitive')->default(false);
            $table->decimal('pack_temp_c', 5, 2)->nullable();
            $table->enum('pack_condition', ['good', 'damaged', 'suspect'])->default('good');
            $table->string('pack_photo_path')->nullable();

            // Stage 1 — Pack at origin (Production Lead)
            $table->foreignId('packed_by_user_id')->constrained('users');
            $table->timestamp('packed_at');

            // Stage 2 — Driver handover
            $table->foreignId('collected_by_user_id')->nullable()->constrained('users');
            $table->timestamp('collected_at')->nullable();
            $table->string('driver_signature_path')->nullable();

            // Stage 3 — Outlet receive (Shift Manager)
            $table->foreignId('received_by_user_id')->nullable()->constrained('users');
            $table->timestamp('received_at')->nullable();
            $table->integer('quantity_received')->nullable();
            $table->enum('received_condition', ['good', 'damaged', 'suspect'])->nullable();
            $table->string('receive_photo_path')->nullable();

            // Calculated variance
            $table->integer('variance')->virtualAs('quantity_dispatched - COALESCE(quantity_received, 0)');
            $table->text('variance_notes')->nullable();

            // Escalation
            $table->enum('status', ['pending', 'in_transit', 'received', 'green', 'amber', 'red'])->default('pending');
            $table->boolean('is_inter_outlet_transfer')->default(false);

            $table->timestamps();

            $table->index(['destination_site_id', 'dispatch_date']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dispatch_records');
    }
};
