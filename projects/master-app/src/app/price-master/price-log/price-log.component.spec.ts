import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceLogComponent } from './price-log.component';

describe('PriceLogComponent', () => {
  let component: PriceLogComponent;
  let fixture: ComponentFixture<PriceLogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PriceLogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PriceLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
