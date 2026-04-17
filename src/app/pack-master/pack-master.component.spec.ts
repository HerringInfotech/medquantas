import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PackMasterComponent } from './pack-master.component';

describe('PackMasterComponent', () => {
  let component: PackMasterComponent;
  let fixture: ComponentFixture<PackMasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PackMasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PackMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
