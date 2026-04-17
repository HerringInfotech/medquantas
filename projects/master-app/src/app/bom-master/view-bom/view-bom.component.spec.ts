import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewBomComponent } from './view-bom.component';

describe('ViewBomComponent', () => {
  let component: ViewBomComponent;
  let fixture: ComponentFixture<ViewBomComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewBomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewBomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
