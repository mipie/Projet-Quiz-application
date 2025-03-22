import { TestBed } from '@angular/core/testing';
import { SharedIdService } from './shared-id.service';

describe('Service: SharedId', () => {
    let service: SharedIdService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [SharedIdService],
        });
        service = TestBed.inject(SharedIdService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get id', () => {
        SharedIdService['identifier'] = undefined;
        expect(SharedIdService.id).toBeUndefined();
    });

    it('should set id', () => {
        SharedIdService.id = 1;
        expect(SharedIdService['identifier']).toEqual(1);
    });
});
