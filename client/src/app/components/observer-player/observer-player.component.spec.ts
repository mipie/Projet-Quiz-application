import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObserverPlayerComponent } from './observer-player.component';

describe('ObserverPlayerComponent', () => {
  let component: ObserverPlayerComponent;
  let fixture: ComponentFixture<ObserverPlayerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ObserverPlayerComponent]
    });
    fixture = TestBed.createComponent(ObserverPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
