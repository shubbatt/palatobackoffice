<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClosingLog extends Model
{
    protected $fillable = [
        'site_id','user_id','log_date','closed_at',
        'zreport_completed','zreport_photo_path',
        'card_settlement_done',
        'cash_expected','cash_actual','cash_variance','cash_variance_reason',
        'unsold_stock_recorded','unsold_stock_notes',
        'cleaning_done','walkthrough_photo_path',
        'final_fridge_temp_ok','equipment_shutdown_ok','equipment_notes',
        'cash_secured','deposit_made','deposit_amount','security_confirmed','alarm_set',
        'production_reconciled','ingredient_shortfalls','tomorrow_prep_set',
        'is_complete','status',
    ];

    protected $casts = [
        'log_date'               => 'date',
        'closed_at'              => 'datetime',
        'zreport_completed'      => 'boolean',
        'card_settlement_done'   => 'boolean',
        'unsold_stock_recorded'  => 'boolean',
        'cleaning_done'          => 'boolean',
        'final_fridge_temp_ok'   => 'boolean',
        'equipment_shutdown_ok'  => 'boolean',
        'cash_secured'           => 'boolean',
        'deposit_made'           => 'boolean',
        'security_confirmed'     => 'boolean',
        'alarm_set'              => 'boolean',
        'production_reconciled'  => 'boolean',
        'tomorrow_prep_set'      => 'boolean',
        'is_complete'            => 'boolean',
        'cash_expected'          => 'decimal:2',
        'cash_actual'            => 'decimal:2',
        'cash_variance'          => 'decimal:2',
        'deposit_amount'         => 'decimal:2',
    ];

    public function site(): BelongsTo { return $this->belongsTo(Site::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
