import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemtypeFormComponent } from './itemtype-form.component';

describe('ItemtypeFormComponent', () => {
  let component: ItemtypeFormComponent;
  let fixture: ComponentFixture<ItemtypeFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemtypeFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemtypeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
