<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class TemperatureLog extends Model {
    protected $fillable = ['site_id','recorded_by_user_id','log_date','reading_period','recorded_at','unit_name','unit_type','temp_c','min_limit_c','max_limit_c','within_range','corrective_action','status'];
    protected $casts = ['log_date'=>'date','recorded_at'=>'datetime','within_range'=>'boolean','temp_c'=>'decimal:2','min_limit_c'=>'decimal:2','max_limit_c'=>'decimal:2'];
    public function site(): BelongsTo       { return $this->belongsTo(Site::class); }
    public function recordedBy(): BelongsTo { return $this->belongsTo(User::class,'recorded_by_user_id'); }
}
