import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameDataService {
    private readonly baseUrl: string = environment.serverUrl;
    constructor(private http: HttpClient) {}

    getData(): Observable<GameDetails[]> {
        return this.http.get<GameDetails[]>(`${this.baseUrl}/game-data`).pipe(catchError(this.handleError<GameDetails[]>('getData')));
    }

    getGameById(id: number | undefined): Observable<GameDetails> {
        return this.http.get<GameDetails>(`${this.baseUrl}/game-data/${id}`).pipe(catchError(this.handleError<GameDetails>('getGameById')));
    }

    addGame(game: GameDetails): Observable<unknown> {
        return this.http.post(`${this.baseUrl}/game-data`, game).pipe(catchError(this.handleError<GameDetails>('addGame')));
    }

    modifyGame(game: GameDetails): Observable<unknown> {
        return this.http.patch(`${this.baseUrl}/game-data`, game).pipe(catchError(this.handleError<GameDetails>('modifyGame')));
    }

    deleteGame(id: number): Observable<unknown> {
        return this.http.delete(`${this.baseUrl}/game-data/${id}`).pipe(catchError(this.handleError<GameDetails>('getGameById')));
    }

    handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
