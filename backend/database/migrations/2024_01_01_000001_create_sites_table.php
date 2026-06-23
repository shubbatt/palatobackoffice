<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sites', function (Blueprint $table) {
            $table->id();
            $table->string('name');                        // Café Malé, Hulhumalé, CPK, Bakehouse
            $table->enum('type', ['retail', 'production', 'production_retail']);
            $table->string('opening_owner')->nullable();
            $table->string('closing_owner')->nullable();
            $table->string('operating_hours')->nullable();  // e.g. "08:00-22:00"
            $table->string('primary_supply_source')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sites');
    }
};
