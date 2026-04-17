import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemtypeMasterComponent } from './itemtype-master.component';

describe('ItemtypeMasterComponent', () => {
  let component: ItemtypeMasterComponent;
  let fixture: ComponentFixture<ItemtypeMasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemtypeMasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemtypeMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
