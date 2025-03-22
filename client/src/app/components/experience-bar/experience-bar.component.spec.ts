import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperienceBarComponent } from './experience-bar.component';

describe('ExperienceBarComponent', () => {
  let component: ExperienceBarComponent;
  let fixture: ComponentFixture<ExperienceBarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExperienceBarComponent]
    });
    fixture = TestBed.createComponent(ExperienceBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
