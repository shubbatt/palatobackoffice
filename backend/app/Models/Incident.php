<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Incident extends Model {
    protected $fillable = ['reference','site_id','raised_by_user_id','raised_at','severity','category','title','description','evidence_paths','owned_by_user_id','resolved_by_user_id','resolved_at','resolution_notes','is_resolved','owner_notified','owner_notified_at'];
    protected $casts = ['raised_at'=>'datetime','resolved_at'=>'datetime','owner_notified_at'=>'datetime','is_resolved'=>'boolean','owner_notified'=>'boolean','evidence_paths'=>'array'];
    public function site(): BelongsTo       { return $this->belongsTo(Site::class); }
    public function raisedBy(): BelongsTo   { return $this->belongsTo(User::class,'raised_by_user_id'); }
    public function ownedBy(): BelongsTo    { return $this->belongsTo(User::class,'owned_by_user_id'); }
    public function resolvedBy(): BelongsTo { return $this->belongsTo(User::class,'resolved_by_user_id'); }
}
