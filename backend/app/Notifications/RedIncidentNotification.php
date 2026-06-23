<?php

namespace App\Notifications;

use App\Models\Incident;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RedIncidentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Incident $incident) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("🔴 RED INCIDENT — {$this->incident->site->name}")
            ->greeting("Immediate action required")
            ->line("**{$this->incident->title}**")
            ->line("Site: {$this->incident->site->name}")
            ->line("Reference: {$this->incident->reference}")
            ->line("Time: {$this->incident->raised_at->format('H:i, d M Y')}")
            ->action('View Incident', url("/incidents/{$this->incident->id}"))
            ->line("This incident requires your direct oversight. Do not delegate without first reviewing.")
            ->salutation("Palato Operations System");
    }

    /**
     * WhatsApp channel via Vonage
     * Requires: composer require vonage/client-core
     */
    public function toVonageWhatsapp(object $notifiable): array
    {
        $number = $notifiable->whatsapp_number ?? $notifiable->phone;
        if (! $number) return [];

        return [
            'to'   => $number,
            'from' => config('services.vonage.whatsapp_number'),
            'text' => implode("\n", [
                "🔴 *RED INCIDENT — Palato*",
                "━━━━━━━━━━━━━━━━━━━",
                "*Site:* {$this->incident->site->name}",
                "*Issue:* {$this->incident->title}",
                "*Ref:* {$this->incident->reference}",
                "*Time:* {$this->incident->raised_at->format('H:i')}",
                "━━━━━━━━━━━━━━━━━━━",
                "Immediate review required.",
            ]),
        ];
    }
}
