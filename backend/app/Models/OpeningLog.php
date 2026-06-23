<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpeningLog extends Model
{
    protected $fillable = [
        'site_id','user_id','log_date','opened_at',
        'alarm_disarmed','overnight_walkthrough_done','overnight_anomaly',
        'anomaly_notes','anomaly_photo_path',
        'refrigeration_readings','refrigeration_ok',
        'pos_operational','card_terminal_operational','espresso_machine_operational',
        'cash_float_counted','float_photo_path',
        'receiving_reconciled','receiving_notes',
        'team_brief_done','brief_notes',
        'is_complete','status',
    ];

    protected $casts = [
        'log_date'             => 'date',
        'opened_at'            => 'datetime',
        'refrigeration_readings' => 'array',
        'alarm_disarmed'       => 'boolean',
        'overnight_walkthrough_done' => 'boolean',
        'pos_operational'      => 'boolean',
        'card_terminal_operational'  => 'boolean',
        'espresso_machine_operational' => 'boolean',
        'receiving_reconciled' => 'boolean',
        'team_brief_done'      => 'boolean',
        'is_complete'          => 'boolean',
        'refrigeration_ok'     => 'boolean',
    ];

    public function site(): BelongsTo  { return $this->belongsTo(Site::class); }
    public function user(): BelongsTo  { return $this->belongsTo(User::class); }
}

// ─────────────────────────────────────────────────────────────────
// Save as separate file in production; combined here for brevity
// ─────────────────────────────────────────────────────────────────
