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

  get grossMinutes(): number {
    const start = this.toMinutes(this.startTime);
    const end = this.toMinutes(this.endTime);
    if (start === null || end === null) return 0;
    return end >= start ? end - start : (24 * 60 - start) + end;
  }

  get breakMinutes(): number {
    return this.breaks.reduce((total, item) => {
      if (!item.enabled || !Number.isFinite(Number(item.amount))) return total;
      const value = Math.max(0, Number(item.amount));
      return total + (item.unit === 'hours' ? value * 60 : value);
    }, 0);
  }

  get netMinutes(): number {
    return Math.max(0, this.grossMinutes - this.breakMinutes);
  }

  get isInvalid(): boolean {
    return this.grossMinutes <= 0 || this.breakMinutes > this.grossMinutes;
  }

  get isOvernight(): boolean {
    const start = this.toMinutes(this.startTime);
    const end = this.toMinutes(this.endTime);
    return start !== null && end !== null && end < start;
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

  reset(): void {
    this.startTime = '08:00';
    this.endTime = '17:00';
    this.breaks = [
      { enabled: true, amount: 30, unit: 'minutes' },
      { enabled: false, amount: 0, unit: 'minutes' }
    ];
  }

  private toMinutes(value: string): number | null {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }
}