import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BomMasterComponent } from './bom-master.component';

describe('BomMasterComponent', () => {
  let component: BomMasterComponent;
  let fixture: ComponentFixture<BomMasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BomMasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BomMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
