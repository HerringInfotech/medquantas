import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UomMasterComponent } from './uom-master.component';

describe('UomMasterComponent', () => {
  let component: UomMasterComponent;
  let fixture: ComponentFixture<UomMasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UomMasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UomMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
