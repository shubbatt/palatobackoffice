<?php

namespace App\Services;

use App\Models\CloseGateSubmission;
use App\Models\User;

class CloseGateService
{
    private const CHECKS = [
        'check_opening_complete',
        'check_pos_zreport',
        'check_cash_reconciled',
        'check_card_settlement',
        'check_temperatures',
        'check_food_safety',
        'check_unsold_stock',
        'check_waste_records',
        'check_receiving_reconciled',
        'check_cleaning',
        'check_equipment_status',
        'check_cash_secured',
        'check_security',
    ];

    public function evaluate(array $checkValues): string
    {
        if (in_array('red', $checkValues)) return 'red';
        if (in_array('amber', $checkValues)) return 'amber';
        return 'green';
    }

    public function submit(array $data, User $submittedBy): CloseGateSubmission
    {
        $checkValues = array_map(fn ($key) => $data[$key] ?? 'pass', self::CHECKS);
        $gateStatus  = $this->evaluate($checkValues);
        $passed      = count(array_filter($checkValues, fn ($v) => $v === 'pass'));

        $submission = CloseGateSubmission::updateOrCreate(
            ['site_id' => $data['site_id'], 'gate_date' => $data['gate_date'] ?? today()],
            array_merge(
                array_combine(self::CHECKS, $checkValues),
                [
                    'submitted_by_user_id' => $submittedBy->id,
                    'submitted_at'         => now(),
                    'gate_status'          => $gateStatus,
                    'checks_passed'        => $passed,
                    'check_notes'          => $data['check_notes'] ?? null,
                    'override_required'    => $gateStatus === 'red',
                ]
            )
        );

        // Raise incident for RED gate
        if ($gateStatus === 'red') {
            app(EscalationService::class)->raiseIncident(
                $data['site_id'],
                'red',
                'security',
                "Close Gate FAILED — {$passed}/13 checks passed",
                $submittedBy->name
            );
        }

        return $submission;
    }

    public function approveOverride(CloseGateSubmission $submission, User $approver, array $data): void
    {
        // Segregation of duties — approver cannot be the submitter
        throw_if(
            $approver->id === $submission->submitted_by_user_id,
            \Exception::class,
            'The person who submitted the exception cannot approve their own override.'
        );

        throw_unless(
            in_array($approver->role, ['operations_head', 'owner']),
            \Exception::class,
            'Only Operations Head or Owner may approve overrides.'
        );

        $submission->update([
            'override_approved_by'    => $approver->id,
            'override_reason'         => $data['reason'],
            'override_containment'    => $data['containment'],
            'override_responsible_person' => $data['responsible_person'],
            'override_deadline'       => $data['deadline'],
            'override_approved_at'    => now(),
        ]);
    }
}
