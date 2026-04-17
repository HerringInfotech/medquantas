import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appNumber]',
  providers: [{ provide: NG_VALIDATORS, useExisting: NumberDirective, multi: true }]
})
export class NumberDirective implements Validator {


  constructor() { }

  validate(control: AbstractControl): ValidationErrors | null {
    debugger;
    const value = control.value;
    const isValid = /^[0-9]+$/.test(value) || value === 'Above';
    return isValid ? null : { 'numberOrAbove': true };
  }

}
