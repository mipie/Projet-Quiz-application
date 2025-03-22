import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MatchDataService } from './match-data.service';
import { Match } from '@app/interfaces/match/match';

describe('MatchDataService', () => {
    let service: MatchDataService;
    let http: HttpClient;
    const baseUrl = environment.serverUrl;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [MatchDataService],
        });
        service = TestBed.inject(MatchDataService);
        http = TestBed.inject(HttpClient);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should reset current match', () => {
        MatchDataService.currentMatch = new Match();
        MatchDataService.resetMatch();
        expect(MatchDataService.currentMatch).not.toBeNull();
    });

    it('should return the list of match from the database', () => {
        const listDataMock: Match[] = [];
        const httpSpy = spyOn(http, 'get').and.returnValue(of(listDataMock));
        service.getData().subscribe((response) => expect(response).toBeTruthy());
        expect(httpSpy).toHaveBeenCalledWith(`${baseUrl}/match-data`);
    });

    it('should add a new match to the database', () => {
        const listDataMock: Match = new Match();
        const httpSpy = spyOn(http, 'post').and.returnValue(of(listDataMock));
        service.addMatch(listDataMock).subscribe((response) => expect(response).toBeTruthy());
        expect(httpSpy).toHaveBeenCalledWith(`${baseUrl}/match-data`, listDataMock);
    });

    it('should delete all the match from the database', () => {
        const httpSpy = spyOn(http, 'delete').and.returnValue(of({}));
        service.deleteAllMatches().subscribe((response) => expect(response).toBeTruthy());
        expect(httpSpy).toHaveBeenCalledWith(`${baseUrl}/match-data`);
    });
    it('should handle error', () => {
        const result = { data: 'test' };
        const errorHandler = service.handleError('testRequest', result);

        errorHandler(new Error('Test error')).subscribe((res) => {
            expect(res).toEqual(result);
        });
    });
});
