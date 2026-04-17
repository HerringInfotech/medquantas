import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CostMasterComponent } from './cost-master.component';

describe('CostMasterComponent', () => {
  let component: CostMasterComponent;
  let fixture: ComponentFixture<CostMasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CostMasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CostMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
