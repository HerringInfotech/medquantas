import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FgmasterFormComponent } from './fgmaster-form.component';

describe('FgmasterFormComponent', () => {
  let component: FgmasterFormComponent;
  let fixture: ComponentFixture<FgmasterFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FgmasterFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FgmasterFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
