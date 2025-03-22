/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Component, Input, OnInit, inject } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { TO_RESULT } from '@app/constants';
import { Player } from '@app/interfaces/player/player';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { ExperienceService } from '@app/services/experience/experience.service';
import { MatchDataService } from '@app/services/matches/match-data.service';
import { ObserverService } from '@app/services/observer/observer-service.service';
import { RankingService } from '@app/services/ranking/ranking.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { StatisticsService } from '@app/services/statistics/statistics.service';
import { WalletService } from '@app/services/wallet/wallet.service';

@Component({
    selector: 'app-player-list',
    templateUrl: './player-list.component.html',
    styleUrls: ['./player-list.component.scss'],
})
export class PlayerListComponent implements OnInit {
    static isGameFinishedHandled: boolean = false;
    @Input() isObserver: boolean = false;
    gameName: string = '';
    endTime: number;
    players: Player[] = [];
    isFinish: boolean = false;
    message: string = 'peut interagir';
    order: 'desc' | 'asc';
    activeSort: 'color' | 'name' | 'bonus' | 'score';
    private socketService: SocketsService = inject(SocketsService);
    private roomService: RoomService = inject(RoomService);
    private currentService: CurrentGameService = inject(CurrentGameService);
    private observerService: ObserverService = inject(ObserverService);
    private dialogService: DialogsService = inject(DialogsService);
    private statisticService: StatisticsService = inject(StatisticsService);
    private walletService: WalletService = inject(WalletService);
    private experienceService: ExperienceService = inject(ExperienceService);
    private rankingService: RankingService = inject(RankingService);

    get isGameDone(): boolean {
        return this.currentService.isGameDone;
    }

    get observedPlayer(): string {
        return this.observerService.playerName;
    }

    ngOnInit() {
        this.gameName = MatchDataService.currentMatch.title;
        this.socketService.send('uploadPlayers', this.roomService.code);
        this.socketService.on('getPlayers', (players: Player[]) => {
            if (players) {
                this.players = players.slice(1);
                this.dialogService.players = this.players;
                MatchDataService.currentMatch.bestScore = this.getMaxScore(this.players);
                this.setPlayers();
            }
        });

        this.socketService.on('getGameFinished', async (finish: boolean) => {
            if (!PlayerListComponent.isGameFinishedHandled) {
                PlayerListComponent.isGameFinishedHandled = true;
                this.isFinish = finish;
                if (this.roomService.isHost && this.roomService.gamePrice !== undefined && this.roomService.gameMode !== undefined) {
                    this.updateStatisticsValues(this.players);
                    this.updateWalletValues(this.players, this.roomService.gamePrice);
                    this.updateExperienceValues(this.players);
                    this.updateRankingValues(this.players, this.roomService.gameMode);
                } else {
                    await this.experienceDialog();
                }
                this.setPlayers();
                this.currentService.previousPage = TO_RESULT;
            }
        });
    }

    updateStatisticsValues(players: Player[]): void {
        this.endTime = Timestamp.now().seconds;
        const timePlayed = this.endTime - this.currentService.startTime;
        this.statisticService.updateStatistics(players, this.gameName, timePlayed);
    }

    updateWalletValues(players: Player[], roomPrice: number): void {
        this.walletService.updateRewardsValues(players, roomPrice);
    }

    updateExperienceValues(players: Player[]) {
        this.experienceService.updateExperienceValues(players);
    }

    updateRankingValues(players: Player[], roomMode: string) {
        if (roomMode === 'fa-trophy') {
            this.rankingService.changePlayerRanking(players);
        }
    }

    async experienceDialog(): Promise<void> {
        await this.dialogService.openExperienceDialog(this.players);
    }

    goWatch(player: string) {
        this.observerService.changeObserver(player);
    }

    muteAll(): void {
        let isOneplayerNotMuted = false;
        for (const player of this.players) {
            if (!player.isMute) {
                isOneplayerNotMuted = true;
                player.isMute = true;
                this.socketService.send('mutePlayer', player.name);
            }
        }
        if (!isOneplayerNotMuted) {
            for (const player of this.players) {
                player.isMute = false;
                this.socketService.send('mutePlayer', player.name);
            }
        }
    }

    toggleMute(index: number): void {
        this.players[index].isMute = !this.players[index].isMute;
        this.socketService.send('mutePlayer', this.players[index].name);
    }

    sortNames() {
        if (this.isGameDone) return;
        if (this.activeSort === 'name') this.order = this.order === 'desc' ? 'asc' : 'desc';
        this.players.sort((a, b) => {
            if (this.order === 'asc') return a.name.localeCompare(b.name);
            return b.name.localeCompare(a.name);
        });
        this.activeSort = 'name';
    }

    sortScore() {
        if (this.isGameDone) return;
        if (this.activeSort === 'score') this.order = this.order === 'desc' ? 'asc' : 'desc';
        this.players.sort((a, b) => {
            if (a.score !== b.score) return this.order === 'asc' ? a.score - b.score : b.score - a.score;
            return a.name.localeCompare(b.name);
        });
        this.activeSort = 'score';
    }

    sortBonus() {
        if (this.isGameDone) return;
        if (this.activeSort === 'bonus') this.order = this.order === 'desc' ? 'asc' : 'desc';
        this.players.sort((a, b) => {
            if (a.bonus !== b.bonus) return this.order === 'asc' ? a.bonus - b.bonus : b.bonus - a.bonus;
            return a.name.localeCompare(b.name);
        });
        this.activeSort = 'bonus';
    }

    sortColor() {
        if (this.isGameDone) return;
        if (this.activeSort === 'color') this.order = this.order === 'desc' ? 'asc' : 'desc';
        const colorOrder = ['red', 'yellow', 'green', 'black'];
        this.players.sort((a, b) => {
            const colorIndexA = this.getColorIndex(a);
            const colorIndexB = this.getColorIndex(b);
            const colorComparison = colorOrder.indexOf(colorIndexA) - colorOrder.indexOf(colorIndexB);
            if (colorComparison !== 0) {
                return this.order === 'asc' ? colorComparison : -colorComparison;
            } else {
                if (a.score !== b.score) return b.score - a.score;
                return a.name.localeCompare(b.name);
            }
        });
        this.activeSort = 'color';
    }

    private getColorIndex(player: Player): string {
        if (player.isSurrender) return 'black';
        else if (player.isFinish) return 'green';
        else if (player.isInteract) return 'yellow';
        return 'red';
    }

    private getMaxScore(players: Player[]): number {
        let maxScore = -1;
        for (const each of players) {
            if (each.score > maxScore) maxScore = each.score;
        }
        return maxScore;
    }

    private setPlayers(): void {
        if (this.isGameDone) {
            this.order = 'desc';
            this.setPlayersPosition();
            this.sortScore();
            return;
        }
        this.setPlayersPosition();
        this.order = this.order === 'desc' ? 'asc' : 'desc';
        switch (this.activeSort) {
            case 'name':
                this.sortNames();
                break;
            case 'color':
                this.sortColor();
                break;
            case 'bonus':
                this.sortBonus();
                break;
            default:
                this.sortScore();
                break;
        }
    }

    private setPlayersPosition() {
        // modifier pour que celui qui abandonne soit placé a la fin du classement //
        this.players.sort((a, b) => {
            if (a.isSurrender && !b.isSurrender) return 1;
            if (!a.isSurrender && b.isSurrender) return -1;
            if (a.score !== b.score) return b.score - a.score;
            return a.name.localeCompare(b.name);
        });
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].position = i;
        }
    }
}
