<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'phone', 'whatsapp_number',
        'password', 'role', 'site_id', 'is_active',
        'certified_at', 'email_verified_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'is_active'          => 'boolean',
        'certified_at'       => 'datetime',
        'email_verified_at'  => 'datetime',
    ];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function isManagement(): bool
    {
        return in_array($this->role, ['operations_head', 'finance', 'owner']);
    }

    public function canApproveOverride(): bool
    {
        return in_array($this->role, ['operations_head', 'owner']);
    }
}
