import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api/api.service';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private conversionFactorSubject = new BehaviorSubject<number>(1);
  private isConversionActiveSubject = new BehaviorSubject<boolean>(false);

  conversionFactor$ = this.conversionFactorSubject.asObservable();
  isConversionActive$ = this.isConversionActiveSubject.asObservable();

  constructor(private api: ApiService) { }

  fetchConversionFactor(): Promise<number> {
    return new Promise((resolve) => {
      this.api.post('get_conversion_factor', {}).subscribe({
        next: (res: any) => {
          const def = res.data?.find(f => f.name === 'DEFAULT');

          if (def) {
            this.conversionFactorSubject.next(def.inrToUsd);
            this.isConversionActiveSubject.next(!!def.status);
            resolve(def.inrToUsd);
          } else {
            this.conversionFactorSubject.next(1);
            this.isConversionActiveSubject.next(false);
            resolve(1);
          }
        },
        error: () => {
          // Fallback to defaults on error (e.g. 401 Unauthorized)
          this.conversionFactorSubject.next(1);
          this.isConversionActiveSubject.next(false);
          resolve(1);
        }
      });
    });
  }



  get currentFactor(): number {
    return this.conversionFactorSubject.value;
  }

  get isActive(): boolean {
    return this.isConversionActiveSubject.value;
  }


  convert(value: any): number {
    const num = parseFloat(value);
    return this.isActive
      ? parseFloat((num / this.currentFactor).toFixed(4))
      : isNaN(num) ? 0 : num;
  }



  format(value: number, currencyLabel: string = '$'): string {
    const converted = this.convert(value);
    return `${converted.toFixed(4)}`;
  }

  formatCurrency(value: number, currencyLabel: string = '$'): string {
    const converted = this.convert(value);
    const parts = converted.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return `${parts.join('.')}`;
  }


  formatWithCommas(value: number): string {
    const converted = this.convert(value);
    const parts = converted.toFixed(2).split('.');
    parts[0] = parts[0].replace(/(\d)(?=(\d\d)+\d$)/g, '$1,');
    return parts.join('.');
  }

  formatCost(value: number): string {
    const converted = this.convert(value);
    const parts = converted.toFixed(4).split('.');
    parts[0] = parts[0].replace(/(\d)(?=(\d\d)+\d$)/g, '$1,');
    return parts.join('.');
  }
}
