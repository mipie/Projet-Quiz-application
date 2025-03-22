import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObserverOrgComponent } from './observer-org.component';

describe('ObserverOrgComponent', () => {
  let component: ObserverOrgComponent;
  let fixture: ComponentFixture<ObserverOrgComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ObserverOrgComponent]
    });
    fixture = TestBed.createComponent(ObserverOrgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
