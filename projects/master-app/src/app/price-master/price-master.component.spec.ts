import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceMasterComponent } from './price-master.component';

describe('PriceMasterComponent', () => {
  let component: PriceMasterComponent;
  let fixture: ComponentFixture<PriceMasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PriceMasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PriceMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
