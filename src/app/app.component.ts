
import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import { FormsModule } from '@angular/forms';

type BreakUnit = 'minutes' | 'hours';

interface WorkBreak {
  enabled: boolean;
  amount: number;
  unit: BreakUnit;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {

  startTime = '08:00';
  endTime = '17:00';

  // Default net working time: 8.25 hours
  targetWorkHours = 8.25;

  breaks: WorkBreak[] = [
    { enabled: true, amount: 30, unit: 'minutes' },
    { enabled: false, amount: 0, unit: 'minutes' }
  ];

  // Notification settings
  notificationStatus = 'Benachrichtigungen aktivieren';
  notificationMessage = '';

  private notificationInterval: ReturnType<typeof setInterval> | null = null;
  private lastNotificationKey = '';

  ngOnInit(): void {
    // Check for upcoming end-of-work notifications every 15 seconds.
    this.notificationInterval = setInterval(() => {
      this.checkEndNotification();
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.notificationInterval !== null) {
      clearInterval(this.notificationInterval);
    }
  }

  // -----------------------------------------
  // WORKING TIME CALCULATIONS
  // -----------------------------------------

  get targetWorkMinutes(): number {
    return Math.round(this.targetWorkHours * 60);
  }

  get grossMinutes(): number {
    const start = this.toMinutes(this.startTime);
    const end = this.toMinutes(this.endTime);

    if (start === null || end === null) {
      return 0;
    }

    return end >= start
      ? end - start
      : (24 * 60 - start) + end;
  }

  get breakMinutes(): number {
    return this.breaks.reduce((total, item) => {

      if (
        !item.enabled ||
        !Number.isFinite(Number(item.amount))
      ) {
        return total;
      }

      const value = Math.max(
        0,
        Math.floor(Number(item.amount))
      );

      return total + (
        item.unit === 'hours'
          ? value * 60
          : value
      );

    }, 0);
  }

  get netMinutes(): number {
    return Math.max(
      0,
      this.grossMinutes - this.breakMinutes
    );
  }

  get isInvalid(): boolean {
    return (
      this.grossMinutes <= 0 ||
      this.breakMinutes > this.grossMinutes
    );
  }

  get isOvernight(): boolean {
    const start = this.toMinutes(this.startTime);
    const end = this.toMinutes(this.endTime);

    return (
      start !== null &&
      end !== null &&
      end < start
    );
  }

  // -----------------------------------------
  // TARGET WORKING TIME
  // -----------------------------------------

  normalizeTargetHours(value: number | string): void {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      this.targetWorkHours = 8.25;
      return;
    }

    const clamped = Math.min(
      24,
      Math.max(0.25, parsed)
    );

    // Only allow quarter-hour increments.
    this.targetWorkHours = Math.round(clamped * 4) / 4;
  }

  normalizeMinutes(value: number | string): number {
    return Math.max(
      0,
      Math.floor(Number(value) || 0)
    );
  }

  // -----------------------------------------
  // WORKING TIME WARNINGS
  // -----------------------------------------

  // Warning begins 30 minutes before 9 hours.
  // Only shown when total breaks are 30 minutes or less.
  get showNineHourWarning(): boolean {
    return (
      this.grossMinutes >= 8 * 60 + 30 &&
      this.grossMinutes < 10 * 60 &&
      this.breakMinutes <= 30
    );
  }

  // Warning begins 30 minutes before 10 hours.
  get showTenHourWarning(): boolean {
    return (
      this.grossMinutes >= 9 * 60 + 30 &&
      this.grossMinutes < 10 * 60
    );
  }

  // -----------------------------------------
  // END TIME RECOMMENDATIONS
  // -----------------------------------------

  get breakRecommendations() {
    const start = this.toMinutes(this.startTime);

    if (start === null) {
      return [];
    }

    return [30, 45].map(breakDuration => {

      const totalMinutes =
        this.targetWorkMinutes + breakDuration;

      const endMinutes =
        (start + totalMinutes) % (24 * 60);

      return {
        breakMinutes: breakDuration,
        endTime: this.minutesToTime(endMinutes),
        overnight: start + totalMinutes >= 24 * 60
      };

    });
  }

  applyRecommendation(breakDuration: number): void {
    const recommendation = this.breakRecommendations.find(
      item => item.breakMinutes === breakDuration
    );

    if (!recommendation) {
      return;
    }

    this.breaks = [
      {
        enabled: true,
        amount: breakDuration,
        unit: 'minutes'
      },
      {
        enabled: false,
        amount: 0,
        unit: 'minutes'
      }
    ];

    this.endTime = recommendation.endTime;
  }

  // -----------------------------------------
  // FORMATTING
  // -----------------------------------------

  formatDuration(minutes: number): string {
    const safe = Math.max(
      0,
      Math.round(minutes)
    );

    const hours = Math.floor(safe / 60);
    const mins = safe % 60;

    return `${hours} Std. ${String(mins).padStart(2, '0')} Min.`;
  }

  formatDecimal(minutes: number): string {
    return (
      minutes / 60
    ).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' Std.';
  }

  // -----------------------------------------
  // CURRENT TIME
  // -----------------------------------------

  setStartTimeNow(): void {
    this.startTime = this.getCurrentTime();
  }

  setEndTimeNow(): void {
    this.endTime = this.getCurrentTime();
  }

  private getCurrentTime(): string {
    const now = new Date();

    return this.minutesToTime(
      now.getHours() * 60 + now.getMinutes()
    );
  }

  private minutesToTime(minutes: number): string {
    const safe = (
      (minutes % 1440) + 1440
    ) % 1440;

    const hours = Math.floor(safe / 60);
    const mins = safe % 60;

    return (
      `${String(hours).padStart(2, '0')}:` +
      `${String(mins).padStart(2, '0')}`
    );
  }

  private toMinutes(value: string): number | null {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      return null;
    }

    const [hours, minutes] = value.split(':').map(Number);

    return hours * 60 + minutes;
  }

  // -----------------------------------------
  // BROWSER NOTIFICATIONS
  // -----------------------------------------

  async enableNotifications(): Promise<void> {

    if (!('Notification' in window)) {
      this.notificationMessage =
        'Dein Browser unterstützt keine Benachrichtigungen.';

      return;
    }

    if (Notification.permission === 'granted') {
      this.notificationStatus = '✓ Benachrichtigungen aktiviert';

      this.notificationMessage =
        'Du wirst 30 Minuten vor deinem Arbeitsende erinnert.';

      this.checkEndNotification();

      return;
    }

    if (Notification.permission === 'denied') {
      this.notificationMessage =
        'Benachrichtigungen wurden blockiert. ' +
        'Bitte erlaube sie in deinen Browser-Einstellungen.';

      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        this.notificationStatus =
          '✓ Benachrichtigungen aktiviert';

        this.notificationMessage =
          'Du wirst 30 Minuten vor deinem Arbeitsende erinnert.';

        this.checkEndNotification();

      } else {
        this.notificationMessage =
          'Du hast die Benachrichtigungen nicht erlaubt.';
      }

    } catch {
      this.notificationMessage =
        'Die Benachrichtigungen konnten nicht aktiviert werden.';
    }
  }

  private checkEndNotification(): void {

    if (
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    ) {
      return;
    }

    const start = this.toMinutes(this.startTime);
    const end = this.toMinutes(this.endTime);

    if (start === null || end === null || start === end) {
      return;
    }

    const now = new Date();

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    const endDate = new Date(now);

    // For overnight shifts, determine the correct end date.
    if (end < start && currentMinutes >= end) {
      endDate.setDate(endDate.getDate() + 1);
    }

    endDate.setHours(
      Math.floor(end / 60),
      end % 60,
      0,
      0
    );

    const remainingMilliseconds =
      endDate.getTime() - now.getTime();

    const remainingMinutes =
      remainingMilliseconds / 60000;

    // Notify only during the 30-minute window before work ends.
    if (
      remainingMinutes <= 30 &&
      remainingMinutes > 0
    ) {

      const notificationKey =
        `${endDate.toDateString()}-${this.endTime}`;

      // Prevent duplicate notifications.
      if (this.lastNotificationKey === notificationKey) {
        return;
      }

      this.lastNotificationKey = notificationKey;

      new Notification('ZEITWERK – Arbeitsende naht', {
        body:
          `Noch ${Math.ceil(remainingMinutes)} Minuten bis zu deinem ` +
          `geplanten Arbeitsende um ${this.endTime} Uhr.`,
        silent: false,
        tag: 'zeitwerk-work-end'
      });

    }
  }

  // -----------------------------------------
  // RESET
  // -----------------------------------------

  reset(): void {

    this.startTime = '08:00';
    this.endTime = '17:00';

    this.targetWorkHours = 8.25;

    this.breaks = [
      {
        enabled: true,
        amount: 30,
        unit: 'minutes'
      },
      {
        enabled: false,
        amount: 0,
        unit: 'minutes'
      }
    ];

    this.notificationMessage = '';

    // Allow a new notification for the reset schedule.
    this.lastNotificationKey = '';
  }
}
