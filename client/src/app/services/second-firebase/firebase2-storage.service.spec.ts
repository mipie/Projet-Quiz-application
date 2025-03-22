/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { Firebase2StorageService } from './firebase2-storage.service';

describe('Service: Firebase2Storage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Firebase2StorageService]
    });
  });

  it('should ...', inject([Firebase2StorageService], (service: Firebase2StorageService) => {
    expect(service).toBeTruthy();
  }));
});
