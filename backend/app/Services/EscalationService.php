<?php

namespace App\Services;

use App\Models\Incident;
use App\Models\User;
use App\Notifications\RedIncidentNotification;
use App\Notifications\AmberIncidentNotification;
use Illuminate\Support\Facades\Notification;

class EscalationService
{
    /**
     * Cash variance thresholds (MVR)
     */
    private const CASH_GREEN_MAX  = 50;
    private const CASH_AMBER_MAX  = 500;
    // > 500 = RED

    /**
     * Evaluate a cash variance and raise incidents automatically.
     */
    public function evaluateCashVariance(
        int $siteId,
        float $variance,
        string $manager,
        bool $repeated = false
    ): string {
        $abs = abs($variance);

        if ($abs > self::CASH_AMBER_MAX) {
            $severity = 'red';
            $title    = "Cash variance MVR {$abs} — immediate review required";
        } elseif ($abs > self::CASH_GREEN_MAX || $repeated) {
            $severity = 'amber';
            $title    = "Cash variance MVR {$abs}" . ($repeated ? ' (repeated pattern)' : '');
        } else {
            return 'green'; // Manager logs, no incident needed
        }

        $this->raiseIncident($siteId, $severity, 'cash', $title, $manager);
        return $severity;
    }

    /**
     * Evaluate a temperature reading.
     */
    public function evaluateTemperature(
        int $siteId,
        string $unit,
        float $tempC,
        float $minC,
        float $maxC,
        bool $overnight = false
    ): string {
        if ($tempC >= $minC && $tempC <= $maxC) {
            return 'green';
        }

        if ($overnight) {
            $severity = 'red';
            $title    = "Overnight temperature breach: {$unit} at {$tempC}°C";
        } else {
            $severity = 'amber';
            $title    = "Temperature out of range: {$unit} at {$tempC}°C (limit {$minC}–{$maxC}°C)";
        }

        $this->raiseIncident($siteId, $severity, 'temperature', $title, '');
        return $severity;
    }

    /**
     * Evaluate dispatch variance.
     */
    public function evaluateDispatchVariance(
        int $siteId,
        string $sku,
        int $dispatched,
        int $received,
        float $unitCost,
        bool $isHighValue = false
    ): string {
        $diff      = $dispatched - $received;
        $costDiff  = $diff * $unitCost;

        if ($diff === 0) return 'green';

        if ($isHighValue || abs($costDiff) > 100 || $diff > 1) {
            $severity = 'red';
            $title    = "Dispatch loss: {$diff} × {$sku} = MVR {$costDiff}";
        } else {
            $severity = 'amber';
            $title    = "Dispatch variance: {$diff} × {$sku} — log for next-day investigation";
        }

        $this->raiseIncident($siteId, $severity, 'dispatch_receiving', $title, '');
        return $severity;
    }

    /**
     * Evaluate waste cost against thresholds.
     */
    public function evaluateWaste(
        int $siteId,
        string $sku,
        int $units,
        float $recipeCost,
        float $threshold
    ): string {
        $total = $units * $recipeCost;

        if ($total <= $threshold) return 'green';

        $severity = $total > ($threshold * 3) ? 'red' : 'amber';
        $title    = "Waste threshold breach: {$units} × {$sku} = MVR {$total} (threshold MVR {$threshold})";

        $this->raiseIncident($siteId, $severity, 'waste', $title, '');
        return $severity;
    }

    /**
     * Core incident creation + notification dispatch.
     */
    public function raiseIncident(
        int $siteId,
        string $severity,
        string $category,
        string $title,
        string $raisedByName
    ): Incident {
        $incident = Incident::create([
            'reference'         => 'INC-' . strtoupper(substr(uniqid(), -6)),
            'site_id'           => $siteId,
            'raised_by_user_id' => auth()->id() ?? 1,
            'raised_at'         => now(),
            'severity'          => $severity,
            'category'          => $category,
            'title'             => $title,
            'description'       => $title,
            'is_resolved'       => false,
        ]);

        // Notify Operations Head for AMBER; both Ops Head and Owner for RED
        $opsHeads = User::where('role', 'operations_head')->where('is_active', true)->get();
        $owners   = User::where('role', 'owner')->where('is_active', true)->get();

        if ($severity === 'amber') {
            Notification::send($opsHeads, new AmberIncidentNotification($incident));
        }

        if ($severity === 'red') {
            $incident->update(['owner_notified' => true, 'owner_notified_at' => now()]);
            Notification::send($opsHeads->merge($owners), new RedIncidentNotification($incident));
        }

        return $incident;
    }
}
