<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Site extends Model
{
    protected $fillable = ['name', 'type', 'opening_owner', 'closing_owner', 'operating_hours', 'primary_supply_source', 'is_active'];

    public function users(): HasMany      { return $this->hasMany(User::class); }
    public function openingLogs(): HasMany { return $this->hasMany(OpeningLog::class); }
    public function closingLogs(): HasMany { return $this->hasMany(ClosingLog::class); }
    public function wasteEntries(): HasMany { return $this->hasMany(WasteEntry::class); }
    public function incidents(): HasMany  { return $this->hasMany(Incident::class); }
    public function dispatches(): HasMany  { return $this->hasMany(DispatchRecord::class, 'destination_site_id'); }
    public function closeGateSubmissions(): HasMany { return $this->hasMany(CloseGateSubmission::class); }
    public function cashReconciliations(): HasMany  { return $this->hasMany(CashReconciliation::class); }
    public function temperatureLogs(): HasMany      { return $this->hasMany(TemperatureLog::class); }
}
