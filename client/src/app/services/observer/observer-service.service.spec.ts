import { TestBed } from '@angular/core/testing';

import { ObserverServiceService } from './observer-service.service';

describe('ObserverServiceService', () => {
  let service: ObserverServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObserverServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
