import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataMigrationComponent } from './data-migration.component';

describe('DataMigrationComponent', () => {
  let component: DataMigrationComponent;
  let fixture: ComponentFixture<DataMigrationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataMigrationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataMigrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
