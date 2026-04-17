import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxMasterComponent } from './tax-master.component';

describe('TaxMasterComponent', () => {
  let component: TaxMasterComponent;
  let fixture: ComponentFixture<TaxMasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaxMasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
