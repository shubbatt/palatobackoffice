<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class SkuCost extends Model {
    protected $fillable = ['sku','category','recipe_cost','retail_price','approved_dispositions','is_controlled','is_active'];
    protected $casts = ['recipe_cost'=>'decimal:2','retail_price'=>'decimal:2','is_controlled'=>'boolean','is_active'=>'boolean','approved_dispositions'=>'array'];
}
