import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { GameDataService } from './game-data.service';

describe('GameDataService', () => {
    let service: GameDataService;
    let http: HttpClient;
    const baseUrl = environment.serverUrl;
    const dataMock: GameDetails = {
        id: 1,
        isVisible: true,
        isChecked: false,
        game: {
            $schema: 'Game1.json',
            title: 'Game1',
            description: "Si le test marche, c'est magnifique.",
            duration: 30,
            lastModification: new Date('2023-09-11T20:20:39+00:00'),
            questions: [
                {
                    type: 'QCM',
                    text: 'Quelle est la première question?',
                    points: 10,
                    choices: [
                        {
                            text: 'Choice1',
                            isCorrect: true,
                            id: 111111,
                        },
                        {
                            text: 'Choice2',
                            isCorrect: false,
                            id: 222222,
                        },
                    ],
                    id: 1,
                },
            ],
        },
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(GameDataService);
        http = TestBed.inject(HttpClient);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return the list of games from the database', () => {
        const listDataMock: GameDetails[] = [dataMock];
        const httpSpy = spyOn(http, 'get').and.returnValue(of(listDataMock));
        service.getData().subscribe((response) => expect(response).toBeTruthy());
        expect(httpSpy).toHaveBeenCalledWith(`${baseUrl}/game-data`);
    });

    it('should return the game from the precise id desired', () => {
        const httpSpy = spyOn(http, 'get').and.returnValue(of(dataMock));
        service.getGameById(dataMock.id).subscribe((response) => expect(response).toBeTruthy());
        expect(httpSpy).toHaveBeenCalledWith(`${baseUrl}/game-data/${dataMock.id}`);
    });

    it('should add a new game to the database', () => {
        const httpSpy = spyOn(http, 'post').and.returnValue(of(dataMock));
        service.addGame(dataMock).subscribe((response) => expect(response).toBeTruthy());
        expect(httpSpy).toHaveBeenCalledWith(`${baseUrl}/game-data`, dataMock);
    });

    it('should modify game from the database', () => {
        const httpSpy = spyOn(http, 'patch').and.returnValue(of(dataMock));
        service.modifyGame(dataMock).subscribe((response) => expect(response).toBeTruthy());
        expect(httpSpy).toHaveBeenCalledWith(`${baseUrl}/game-data`, dataMock);
    });

    it('should delete game from the database', () => {
        const httpSpy = spyOn(http, 'delete').and.returnValue(of({}));
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        service.deleteGame(dataMock.id!).subscribe((response) => expect(response).toBeTruthy());
        expect(httpSpy).toHaveBeenCalledWith(`${baseUrl}/game-data/${dataMock.id}`);
    });

    it('should return a function that returns an observable with the provided result', () => {
        const request = 'test request';
        const result = 'test result';
        const error = new Error('test error');

        const errorHandler = service.handleError(request, result);
        const observable = errorHandler(error);

        expect(observable).toBeInstanceOf(Observable);
        observable.subscribe((value) => {
            expect(value).toBe(result);
        });
    });
});
