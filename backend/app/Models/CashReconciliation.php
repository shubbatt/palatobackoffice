<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class CashReconciliation extends Model {
    protected $fillable = ['site_id','submitted_by_user_id','recon_date','pos_z_total','card_settlement_total','expected_cash','actual_cash_counted','deposit_made','deposit_amount','deposit_reference','zreport_photo_path','status','variance_reason','finance_verified','verified_by_user_id','verified_at'];
    protected $casts = ['recon_date'=>'date','verified_at'=>'datetime','deposit_made'=>'boolean','finance_verified'=>'boolean','pos_z_total'=>'decimal:2','card_settlement_total'=>'decimal:2','expected_cash'=>'decimal:2','actual_cash_counted'=>'decimal:2','deposit_amount'=>'decimal:2'];
    public function site(): BelongsTo        { return $this->belongsTo(Site::class); }
    public function submittedBy(): BelongsTo { return $this->belongsTo(User::class,'submitted_by_user_id'); }
    public function verifiedBy(): BelongsTo  { return $this->belongsTo(User::class,'verified_by_user_id'); }
}
