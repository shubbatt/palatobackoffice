<?php

namespace Database\Seeders;

use App\Models\{Site, User, SkuCost};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Sites ──────────────────────────────────────────────────
        $sites = [
            ['name' => 'Café Malé',                 'type' => 'retail',            'operating_hours' => '07:00-22:00'],
            ['name' => 'Hulhumalé',                 'type' => 'retail',            'operating_hours' => '07:30-21:00'],
            ['name' => 'Central Production Kitchen','type' => 'production',        'operating_hours' => '05:00-18:00'],
            ['name' => 'Bakehouse',                 'type' => 'production_retail', 'operating_hours' => '06:00-20:00'],
        ];
        foreach ($sites as $site) Site::firstOrCreate(['name' => $site['name']], $site);

        $male   = Site::where('name', 'Café Malé')->first();
        $cpk    = Site::where('name', 'Central Production Kitchen')->first();

        // ── Default Users ──────────────────────────────────────────
        User::firstOrCreate(['email' => 'aisha@palato.mv'], [
            'name'     => 'Aisha (Owner)',
            'role'     => 'owner',
            'site_id'  => null,
            'password' => Hash::make('changeme'),
        ]);

        User::firstOrCreate(['email' => 'opshead@palato.mv'], [
            'name'     => 'Operations Head',
            'role'     => 'operations_head',
            'site_id'  => null,
            'password' => Hash::make('changeme'),
        ]);

        User::firstOrCreate(['email' => 'finance@palato.mv'], [
            'name'     => 'Finance',
            'role'     => 'finance',
            'site_id'  => null,
            'password' => Hash::make('changeme'),
        ]);

        User::firstOrCreate(['email' => 'manager.male@palato.mv'], [
            'name'     => 'Ahmed R.',
            'role'     => 'shift_manager',
            'site_id'  => $male->id,
            'password' => Hash::make('changeme'),
        ]);

        User::firstOrCreate(['email' => 'prodlead@palato.mv'], [
            'name'     => 'Ibrahim K.',
            'role'     => 'production_lead',
            'site_id'  => $cpk->id,
            'password' => Hash::make('changeme'),
        ]);

        // ── SKU Cost File ──────────────────────────────────────────
        $skus = [
            ['sku' => 'Croissant',      'category' => 'Pastry',   'recipe_cost' => 45.00,  'retail_price' => 120.00, 'is_controlled' => false],
            ['sku' => 'Danish',         'category' => 'Pastry',   'recipe_cost' => 38.00,  'retail_price' => 100.00, 'is_controlled' => false],
            ['sku' => 'Sourdough',      'category' => 'Bread',    'recipe_cost' => 95.00,  'retail_price' => 250.00, 'is_controlled' => true],
            ['sku' => 'Cinnamon Roll',  'category' => 'Pastry',   'recipe_cost' => 55.00,  'retail_price' => 130.00, 'is_controlled' => false],
            ['sku' => 'Sandwich',       'category' => 'Savoury',  'recipe_cost' => 90.00,  'retail_price' => 180.00, 'is_controlled' => false],
            ['sku' => 'Whole Cake',     'category' => 'Cake',     'recipe_cost' => 400.00, 'retail_price' => 900.00, 'is_controlled' => true],
            ['sku' => 'Slice Cake',     'category' => 'Cake',     'recipe_cost' => 80.00,  'retail_price' => 180.00, 'is_controlled' => false],
            ['sku' => 'Cookie',         'category' => 'Pastry',   'recipe_cost' => 18.00,  'retail_price' => 50.00,  'is_controlled' => false],
            ['sku' => 'Muffin',         'category' => 'Pastry',   'recipe_cost' => 30.00,  'retail_price' => 75.00,  'is_controlled' => false],
            ['sku' => 'Focaccia',       'category' => 'Bread',    'recipe_cost' => 70.00,  'retail_price' => 160.00, 'is_controlled' => true],
        ];
        foreach ($skus as $sku) SkuCost::firstOrCreate(['sku' => $sku['sku']], $sku);
    }
}
