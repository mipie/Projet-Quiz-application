/* eslint-disable deprecation/deprecation */
/* eslint-disable @typescript-eslint/no-shadow */
import { Component, inject, OnInit } from '@angular/core';
import { Game, User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { EVALUATED, RATE, TITLE } from './constants';
import { LangueService } from '@app/services/langues/langue.service';
import { EvaluationService } from '@app/services/evaluation/evaluation.service';
import { take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-evaluation',
    templateUrl: './evaluation.component.html',
    styleUrls: ['./evaluation.component.scss'],
})
export class EvaluationComponent implements OnInit {
    currentUser: User | null;
    gameName: string | undefined = 'Best Game';
    backgroundImage: string = '';
    titleLabel: string = '';
    stars: string[] = Array.from({ length: 5 }, () => './assets/no-evaluated-star.png');
    isRated: boolean = false;
    games: Game[] = [];
    rateLabel: string = '';
    evaluatedLabel: string = '';
    private dialog: MatDialog = inject(MatDialog);
    private themeService: ThemeService = inject(ThemeService);
    private authService: AuthService = inject(AuthService);
    private languageService: LangueService = inject(LangueService);
    private evaluationService: EvaluationService = inject(EvaluationService);

    async ngOnInit(): Promise<void> {
        this.currentUser = await this.authService.getCurrentUser();
        if (this.currentUser) {
            this.generateStars(0);
            this.gameName = this.evaluationService.gameName;
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.backgroundImage = `url(${theme})`;
            });
            this.languageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
        }
    }

    updatedLabelLanguage(language: string): void {
        this.titleLabel = TITLE[language];
        this.rateLabel = RATE[language];
        this.evaluatedLabel = EVALUATED[language];
    }

    generateStars(rating: number): void {
        const totalStars = 5;
        this.stars = Array.from({ length: totalStars }, (_, index) =>
            index < rating ? './assets/evaluated-star.png' : './assets/no-evaluated-star.png',
        );
    }

    redirectToHome(): void {
        this.dialog.closeAll();
    }

    async rateGame(newRating: number): Promise<void> {
        if (this.currentUser) {
            const evaluation = await this.evaluationService.getEvaluation().pipe(take(1)).toPromise();
            if (evaluation) {
                const game = evaluation.games.find((game) => game.gameName === this.gameName);
                if (game) {
                    game.averageRating = parseFloat(((game.averageRating * game.uid.length + newRating) / (game.uid.length + 1)).toFixed(1));

                    game.uid.push(this.currentUser.uid);

                    await this.evaluationService.changeGamesEvaluation(this.currentUser, game);
                    this.generateStars(game.averageRating);
                }
            }
        }
    }

    onRateGame(newRating: number): void {
        this.isRated = true;
        this.generateStars(newRating);
        this.rateGame(newRating);
    }
}
