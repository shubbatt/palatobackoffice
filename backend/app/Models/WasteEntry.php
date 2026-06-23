<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WasteEntry extends Model
{
    protected $fillable = [
        'site_id','recorded_by_user_id','waste_date','recorded_at',
        'sku','units_wasted','recipe_cost_per_unit','retail_price_per_unit',
        'reason_code','notes','evidence_photo_path','disposition','status',
    ];
    protected $casts = [
        'waste_date'  => 'date',
        'recorded_at' => 'datetime',
        'recipe_cost_per_unit'  => 'decimal:2',
        'retail_price_per_unit' => 'decimal:2',
    ];
    public function site(): BelongsTo        { return $this->belongsTo(Site::class); }
    public function recordedBy(): BelongsTo  { return $this->belongsTo(User::class, 'recorded_by_user_id'); }
}
