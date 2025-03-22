/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Component, inject, OnInit } from '@angular/core';
import { GamesHistoric, Statistics, User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { LangueService } from '@app/services/langues/langue.service';
import { RankingService } from '@app/services/ranking/ranking.service';
import { StatisticsService } from '@app/services/statistics/statistics.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { UsernameService } from '@app/services/username/username.service';
import {
    COLUMNDEFEAT,
    COLUMNDRAW,
    COLUMNNAMEGAME,
    COLUMNPOINTS,
    COLUMNRANK,
    COLUMNRESULTAT,
    COLUMNUSERNAME,
    COLUMNVICTORY,
    GAMESLOST,
    GAMESPLAYED,
    GAMESWON,
    HISTORIC,
    LEADERBOARD,
    LOSER,
    NBQUESTIONGOODANSWER,
    NOHISTORY,
    RANKING,
    SECONDS,
    STATISTIC,
    TIMEBYGAME,
    TITLEHISTORIC,
    TITLELABEL,
    TITLESTATICTICS,
    WINNER,
} from './constants';

@Component({
    selector: 'app-statistic',
    templateUrl: './statistic.component.html',
    styleUrls: ['./statistic.component.scss'],
})
export class StatisticComponent implements OnInit {
    viewMode: string = 'Statistiques';
    backgroundImage: string = '';
    statisticsLabel: string = '';
    rankingLabel: string = '';
    historicLabel: string = '';
    gamesPlayedLabel: string = '';
    gamesWonLabel: string = '';
    gamesLostLabel: string = '';
    avgGoodAnsLabel: string = '';
    timePerGameLabel: string = '';
    titleStatistics: string = '';
    titleHistoric: string = '';
    nameLabel: string = '';
    resultLabel: string = '';
    victoryLabel: string = '';
    defeatLabel: string = '';
    secondsLabel: string = '';
    rankColumnLabel: string = '';
    usernameColumnLabel: string = '';
    pointsColumnLabel: string = '';
    victoryColumnLabel: string = '';
    drawColumnLabel: string = '';
    defeatColumnLabel: string = '';
    leaderboard: string = '';
    titleLabel: string = '';
    currentUser: User | null;
    users: User[] = [];
    allGamesPlayed: GamesHistoric[] = [];
    noHistory: string;
    informationsStatistics: { text: string; value: string }[] = [];
    private authentificationService: AuthService = inject(AuthService);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);
    private statisticService: StatisticsService = inject(StatisticsService);
    private rankingService: RankingService = inject(RankingService);
    private usernameService: UsernameService = inject(UsernameService);

    async ngOnInit(): Promise<void> {
        this.currentUser = await this.authentificationService.getCurrentUser();
        this.viewMode = 'Classement';
        if (this.currentUser) {
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.backgroundImage = `url(${theme})`;
            });
            this.languageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
            this.statisticService.currentStatistics(this.currentUser).subscribe((statistic) => {
                if (this.currentUser) {
                    this.currentUser.statistics = statistic;
                    this.updatedStatisticsValues(statistic);
                }
            });
            this.statisticService.currentGamesHistoric(this.currentUser).subscribe((gamesHistoric) => {
                this.allGamesPlayed = gamesHistoric;
                this.allGamesPlayed.sort((a, b) => b.date.seconds - a.date.seconds);
            });
            this.rankingService.currentOrderRanked().subscribe((usersRanked) => {
                this.users = usersRanked;
            });
            this.usernameService.username(this.currentUser).subscribe((username) => {
                if (this.currentUser) {
                    this.currentUser.username = username;
                }
            });
        }
    }

    updatedLabelLanguage(language: string): void {
        this.noHistory = NOHISTORY[language];
        this.leaderboard = LEADERBOARD[language];
        this.titleLabel = TITLELABEL[language];
        this.statisticsLabel = STATISTIC[language];
        this.rankingLabel = RANKING[language];
        this.historicLabel = HISTORIC[language];
        this.titleStatistics = TITLESTATICTICS[language];
        this.gamesPlayedLabel = GAMESPLAYED[language];
        this.gamesWonLabel = GAMESWON[language];
        this.gamesLostLabel = GAMESLOST[language];
        this.avgGoodAnsLabel = NBQUESTIONGOODANSWER[language];
        this.timePerGameLabel = TIMEBYGAME[language];
        this.titleHistoric = TITLEHISTORIC[language];
        this.nameLabel = COLUMNNAMEGAME[language];
        this.resultLabel = COLUMNRESULTAT[language];
        this.victoryLabel = WINNER[language];
        this.defeatLabel = LOSER[language];
        this.secondsLabel = SECONDS[language];
        this.rankColumnLabel = COLUMNRANK[language];
        this.usernameColumnLabel = COLUMNUSERNAME[language];
        this.pointsColumnLabel = COLUMNPOINTS[language];
        this.victoryColumnLabel = COLUMNVICTORY[language];
        this.drawColumnLabel = COLUMNDRAW[language];
        this.defeatColumnLabel = COLUMNDEFEAT[language];
    }

    updatedStatisticsValues(statistic: Statistics): void {
        const totalSeconds = statistic.averageTimePerGame;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.round(totalSeconds % 60);

        this.informationsStatistics = [
            { text: `${this.gamesPlayedLabel}`, value: `${statistic.gamesP}` },
            { text: `${this.gamesWonLabel}`, value: `${statistic.gamesW}` },
            { text: `${this.gamesLostLabel}`, value: `${statistic.gamesL}` },
            { text: `${this.avgGoodAnsLabel}`, value: `${(statistic.averageGoodAnsPerGame * 100).toFixed(2)}%` },
            { text: `${this.timePerGameLabel}`, value: `${minutes}m ${seconds}s` },
        ];
    }

    getRankedClass(points: number): string {
        if (points >= 150) {
            return 'rank-diamond';
        } else if (points >= 100) {
            return 'rank-gold';
        } else if (points >= 60) {
            return 'rank-silver';
        } else if (points >= 20) {
            return 'rank-bronze';
        }
        return '';
    }
}
