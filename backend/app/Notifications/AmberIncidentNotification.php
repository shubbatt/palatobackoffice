<?php

namespace App\Notifications;

use App\Models\Incident;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AmberIncidentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Incident $incident) {}

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("🟡 AMBER — {$this->incident->site->name}: {$this->incident->title}")
            ->greeting("Attention required")
            ->line("**{$this->incident->title}**")
            ->line("Site: {$this->incident->site->name} · Ref: {$this->incident->reference}")
            ->line("Category: " . ucfirst(str_replace('_', ' ', $this->incident->category)))
            ->action('Review & Assign', url("/incidents/{$this->incident->id}"))
            ->line("Please review and assign ownership within 2 hours.")
            ->salutation("Palato Operations System");
    }

    public function toVonageWhatsapp(object $notifiable): array
    {
        $number = $notifiable->whatsapp_number ?? $notifiable->phone;
        if (! $number) return [];

        return [
            'to'   => $number,
            'from' => config('services.vonage.whatsapp_number'),
            'text' => implode("\n", [
                "🟡 *AMBER — Palato*",
                "*Site:* {$this->incident->site->name}",
                "*Issue:* {$this->incident->title}",
                "*Ref:* {$this->incident->reference}",
                "Review within 2 hrs.",
            ]),
        ];
    }
}
