import { TestBed } from '@angular/core/testing';

import { RoomService } from './room.service';

describe('RoomService', () => {
    let service: RoomService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RoomService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it("should get room's activity state", () => {
        service['gameActive'] = true;
        expect(service.activeGame).toBeTrue();
    });

    it("should set room's activity state", () => {
        service.activeGame = true;
        expect(service['gameActive']).toBeTrue();
    });

    it("should get room's organizer state", () => {
        service['isOrganizer'] = true;
        expect(service.isHost).toBeTrue();
    });

    it("should set room's organizer state if player is the host and change his name to 'Organisateur'", () => {
        service.isHost = true;
        expect(service['isOrganizer']).toBeTrue();
        expect(service['player']).toEqual('Organisateur');
    });

    it("should set room's organizer state if player is not the host and NOT change his name", () => {
        const expectedName = service.name;
        service.isHost = false;
        expect(service['isOrganizer']).toBeFalse();
        expect(service['player']).toEqual(expectedName);
    });

    it("should get room's code", () => {
        const expectedCode = '8555';
        service['room'] = expectedCode;
        expect(service.code).toEqual(expectedCode);
    });

    it("should set room's code", () => {
        const expectedCode = '8555';
        service.code = expectedCode;
        expect(service['room']).toEqual(expectedCode);
    });

    it("should get player's name", () => {
        const expectedName = 'John';
        service['player'] = expectedName;
        expect(service.name).toEqual(expectedName);
    });

    it("should set player's name", () => {
        const expectedName = 'John';
        service.name = expectedName;
        expect(service['player']).toEqual(expectedName);
    });
});
