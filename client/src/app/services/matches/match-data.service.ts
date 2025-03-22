import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Match } from '@app/interfaces/match/match';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class MatchDataService {
    static currentMatch: Match;
    private http: HttpClient = inject(HttpClient);
    private readonly baseUrl: string = environment.serverUrl;

    static resetMatch(): void {
        MatchDataService.currentMatch = new Match();
    }

    getData(): Observable<Match[]> {
        return this.http.get<Match[]>(`${this.baseUrl}/match-data`).pipe(catchError(this.handleError<Match[]>('getData')));
    }

    addMatch(match: Match): Observable<unknown> {
        return this.http.post(`${this.baseUrl}/match-data`, match).pipe(catchError(this.handleError<Match>('addMatch')));
    }

    deleteAllMatches(): Observable<unknown> {
        return this.http.delete(`${this.baseUrl}/match-data`).pipe(catchError(this.handleError<Match>('deleteAllMatches')));
    }

    handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
