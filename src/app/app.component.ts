
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type BreakUnit = 'minutes' | 'hours';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  startTime = '08:00';
  endTime = '17:00';

  breaks = [
    { enabled: true, amount: 30, unit: 'minutes' as BreakUnit },
    { enabled: false, amount: 0, unit: 'minutes' as BreakUnit }
  ];

  // Standard expected working duration: 8 hours net
  readonly targetWorkMinutes = 8 * 60;

  get grossMinutes(): number {
    const start = this.toMinutes(this.startTime);
    const end = this.toMinutes(this.endTime);

    if (start === null || end === null) return 0;

    return end >= start
      ? end - start
      : (24 * 60 - start) + end;
  }

  get breakMinutes(): number {
    return this.breaks.reduce((total, item) => {
      if (!item.enabled || !Number.isFinite(Number(item.amount))) {
        return total;
      }

      const value = Math.max(0, Math.floor(Number(item.amount)));

      return total + (
        item.unit === 'hours' ? value * 60 : value
      );
    }, 0);
  }

  get netMinutes(): number {
    return Math.max(0, this.grossMinutes - this.breakMinutes);
  }

  get isInvalid(): boolean {
    return this.grossMinutes <= 0 ||
      this.breakMinutes > this.grossMinutes;
  }

  get isOvernight(): boolean {
    const start = this.toMinutes(this.startTime);
    const end = this.toMinutes(this.endTime);

    return start !== null &&
      end !== null &&
      end < start;
  }

  normalizeMinutes(value: number | string): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

  get breakRecommendations() {
    const start = this.toMinutes(this.startTime);

    if (start === null) return [];

    return [30, 45].map(breakDuration => {
      const totalMinutes = this.targetWorkMinutes + breakDuration;
      const endMinutes = (start + totalMinutes) % (24 * 60);

      return {
        breakMinutes: breakDuration,
        endTime: this.minutesToTime(endMinutes),
        overnight: start + totalMinutes >= 24 * 60
      };
    });
  }

  formatDuration(minutes: number): string {
    const safe = Math.max(0, Math.round(minutes));
    const hours = Math.floor(safe / 60);
    const mins = safe % 60;

    return `${hours} Std. ${String(mins).padStart(2, '0')} Min.`;
  }

  formatDecimal(minutes: number): string {
    return (minutes / 60).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' Std.';
  }

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
    const safe = ((minutes % 1440) + 1440) % 1440;

    const hours = Math.floor(safe / 60);
    const mins = safe % 60;

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  applyRecommendation(breakDuration: number): void {
    const recommendation = this.breakRecommendations.find(
      item => item.breakMinutes === breakDuration
    );

    if (!recommendation) return;

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

  reset(): void {
    this.startTime = '08:00';
    this.endTime = '17:00';

    this.breaks = [
      { enabled: true, amount: 30, unit: 'minutes' },
      { enabled: false, amount: 0, unit: 'minutes' }
    ];
  }

  private toMinutes(value: string): number | null {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      return null;
    }

    const [hours, minutes] = value.split(':').map(Number);

    return hours * 60 + minutes;
  }
}
