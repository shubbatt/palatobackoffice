<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DispatchRecord extends Model
{
    protected $fillable = [
        'dispatch_id', 'origin_site_id', 'destination_site_id', 'dispatch_date',
        'sku', 'sku_category', 'quantity_dispatched', 'temperature_sensitive',
        'pack_temp_c', 'pack_condition', 'pack_photo_path',
        'packed_by_user_id', 'packed_at',
        'collected_by_user_id', 'collected_at', 'driver_signature_path',
        'received_by_user_id', 'received_at', 'quantity_received',
        'received_condition', 'receive_photo_path', 'variance_notes',
        'status', 'is_inter_outlet_transfer',
    ];

    protected $casts = [
        'dispatch_date'       => 'date',
        'packed_at'           => 'datetime',
        'collected_at'        => 'datetime',
        'received_at'         => 'datetime',
        'temperature_sensitive' => 'boolean',
        'is_inter_outlet_transfer' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $record) {
            $record->dispatch_id ??= 'DSP-' . strtoupper(substr(uniqid(), -6));
        });

        static::updating(function (self $record) {
            if ($record->isDirty('quantity_received')) {
                $record->status = $record->calculateStatus();
            }
        });
    }

    public function calculateStatus(): string
    {
        if ($this->quantity_received === null) {
            return 'pending';
        }
        $diff = $this->quantity_dispatched - $this->quantity_received;
        if ($diff === 0) return 'green';
        if ($diff > 1 || $this->quantity_dispatched >= 10) return 'red';
        return 'amber';
    }

    // ── Relations ─────────────────────────────────────────────────

    public function originSite(): BelongsTo
    {
        return $this->belongsTo(Site::class, 'origin_site_id');
    }

    public function destinationSite(): BelongsTo
    {
        return $this->belongsTo(Site::class, 'destination_site_id');
    }

    public function packedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'packed_by_user_id');
    }

    public function collectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'collected_by_user_id');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by_user_id');
    }

    // ── Scopes ────────────────────────────────────────────────────

    public function scopeToday($query)
    {
        return $query->whereDate('dispatch_date', today());
    }

    public function scopeForSite($query, int $siteId)
    {
        return $query->where('destination_site_id', $siteId);
    }

    public function scopeWithVariance($query)
    {
        return $query->whereIn('status', ['amber', 'red']);
    }
}
