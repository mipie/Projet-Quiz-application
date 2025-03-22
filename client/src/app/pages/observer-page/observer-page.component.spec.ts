import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObserverPageComponent } from './observer-page.component';

describe('ObserverPageComponent', () => {
  let component: ObserverPageComponent;
  let fixture: ComponentFixture<ObserverPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ObserverPageComponent]
    });
    fixture = TestBed.createComponent(ObserverPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
