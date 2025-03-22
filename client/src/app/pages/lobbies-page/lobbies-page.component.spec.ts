import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LobbiesPageComponent } from './lobbies-page.component';

describe('LobbiesPageComponent', () => {
  let component: LobbiesPageComponent;
  let fixture: ComponentFixture<LobbiesPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LobbiesPageComponent]
    });
    fixture = TestBed.createComponent(LobbiesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
