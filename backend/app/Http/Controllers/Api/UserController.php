<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        return User::with('site')->orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'phone' => 'nullable|string|max:255',
            'whatsapp_number' => 'nullable|string|max:255',
            'password' => 'required|string|min:6',
            'role' => ['required', Rule::in([
                'shift_manager', 'production_lead', 'operations_head', 'finance', 'owner'
            ])],
            'site_id' => 'nullable|exists:sites,id',
            'is_active' => 'boolean',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        return response()->json($user->load('site'), 201);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|max:255',
            'whatsapp_number' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:6',
            'role' => ['required', Rule::in([
                'shift_manager', 'production_lead', 'operations_head', 'finance', 'owner'
            ])],
            'site_id' => 'nullable|exists:sites,id',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['password']) && !empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json($user->load('site'));
    }

    public function destroy(User $user)
    {
        // Instead of hard deleting, we'll deactivate the user to maintain foreign keys
        $user->update(['is_active' => false]);
        return response()->json(['message' => 'User deactivated successfully']);
    }
}
