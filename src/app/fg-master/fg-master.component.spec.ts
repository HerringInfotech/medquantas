import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FgMasterComponent } from './fg-master.component';

describe('FgMasterComponent', () => {
  let component: FgMasterComponent;
  let fixture: ComponentFixture<FgMasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FgMasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FgMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
