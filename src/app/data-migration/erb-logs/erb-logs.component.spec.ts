import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ErbLogsComponent } from './erb-logs.component';

describe('ErbLogsComponent', () => {
  let component: ErbLogsComponent;
  let fixture: ComponentFixture<ErbLogsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ErbLogsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErbLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
