import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateGameComponent } from '@app/components/create-game/create-game.component';
import { DemoGameComponent } from '@app/components/demo-game/demo-game.component';
import { HostGameComponent } from '@app/components/host-game/host-game.component';
import { LoginComponent } from '@app/components/login/login.component';
import { RegisterComponent } from '@app/components/register/register.component';
import {
    TO_ADMIN,
    TO_CHAT,
    TO_CREATE_GAME,
    TO_CREATE_PLAY,
    TO_HOME,
    TO_HOST,
    TO_LOBBIES,
    TO_LOGIN,
    TO_MODIFY_GAME,
    TO_OBSERVER,
    TO_ORGANIZER,
    TO_PLAY_GAME,
    TO_REGISTER,
    TO_RESULT,
    TO_TEST_GAME,
} from '@app/constants';
import { AdministrationComponent } from '@app/pages/administration/administration.component';
import { ChatPageComponent } from '@app/pages/chat-page/chat-page.component';
import { CreatePlayComponent } from '@app/pages/create-play/create-play.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { HomePageComponent } from '@app/pages/home-page/home-page.component';
import { LobbiesPageComponent } from '@app/pages/lobbies-page/lobbies-page.component';
import { ObserverPageComponent } from '@app/pages/observer-page/observer-page.component';
import { OrganizerPageComponent } from '@app/pages/organizer-page/organizer-page.component';
import { ResultatsComponent } from '@app/pages/results/resultats.component';

const routes: Routes = [
    { path: '', redirectTo: '/' + TO_LOGIN, pathMatch: 'full' },
    { path: TO_LOGIN, component: LoginComponent },
    { path: TO_REGISTER, component: RegisterComponent },
    { path: TO_HOME, component: HomePageComponent },
    { path: TO_PLAY_GAME, component: GamePageComponent },
    { path: TO_TEST_GAME, component: DemoGameComponent },
    { path: TO_CREATE_PLAY, component: CreatePlayComponent },
    { path: TO_ORGANIZER, component: OrganizerPageComponent },
    { path: TO_RESULT, component: ResultatsComponent },
    { path: TO_ADMIN, component: AdministrationComponent },
    { path: TO_CREATE_GAME, component: CreateGameComponent },
    { path: TO_HOST, component: HostGameComponent },
    { path: TO_MODIFY_GAME, component: CreateGameComponent },
    { path: TO_CHAT, component: ChatPageComponent },
    { path: TO_LOBBIES, component: LobbiesPageComponent },
    { path: TO_OBSERVER, component: ObserverPageComponent },
    { path: '**', redirectTo: '/' + TO_HOME },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: false })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
