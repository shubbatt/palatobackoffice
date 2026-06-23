<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CloseGateSubmission extends Model
{
    protected $fillable = [
        'site_id','submitted_by_user_id','gate_date','submitted_at',
        'check_opening_complete','check_pos_zreport','check_cash_reconciled',
        'check_card_settlement','check_temperatures','check_food_safety',
        'check_unsold_stock','check_waste_records','check_receiving_reconciled',
        'check_cleaning','check_equipment_status','check_cash_secured','check_security',
        'check_notes','gate_status','checks_passed','checks_total',
        'override_required','override_approved_by','override_reason',
        'override_containment','override_responsible_person',
        'override_deadline','override_approved_at',
    ];
    protected $casts = [
        'gate_date'           => 'date',
        'submitted_at'        => 'datetime',
        'override_approved_at'=> 'datetime',
        'override_deadline'   => 'date',
        'check_notes'         => 'array',
        'override_required'   => 'boolean',
    ];
    public function site(): BelongsTo            { return $this->belongsTo(Site::class); }
    public function submittedBy(): BelongsTo     { return $this->belongsTo(User::class, 'submitted_by_user_id'); }
    public function overrideApprovedBy(): BelongsTo { return $this->belongsTo(User::class, 'override_approved_by'); }
}
