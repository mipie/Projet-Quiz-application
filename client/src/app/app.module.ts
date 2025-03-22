import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { HomePageComponent } from '@app/pages/home-page/home-page.component';
import { environment } from 'src/environments/environment';
import { ChatComponent } from './components/chat/chat.component';
import { CreateGameComponent } from './components/create-game/create-game.component';
import { DemoGameComponent } from './components/demo-game/demo-game.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { FriendComponent } from './components/friend/friend.component';
import { GameOptionsComponent } from './components/game-options/game-options.component';
import { HeaderComponent } from './components/header/header.component';
import { HistogramComponent } from './components/histogram/histogram.component';
import { HostGameComponent } from './components/host-game/host-game.component';
import { LoginComponent } from './components/login/login.component';
import { MessageComponent } from './components/message/message.component';
import { PlayerListComponent } from './components/player-list/player-list.component';
import { ProfileComponent } from './components/profile/profile.component';
import { QuestionFormComponent } from './components/question-form/question-form.component';
import { RegisterComponent } from './components/register/register.component';
import { SettingComponent } from './components/setting/setting.component';
import { StatisticComponent } from './components/statistic/statistic.component';
import { AdministrationComponent } from './pages/administration/administration.component';
import { ChatPageComponent } from './pages/chat-page/chat-page.component';
import { CreatePlayComponent } from './pages/create-play/create-play.component';
import { LobbiesPageComponent } from './pages/lobbies-page/lobbies-page.component';
import { OrganizerPageComponent } from './pages/organizer-page/organizer-page.component';
import { ResultatsComponent } from './pages/results/resultats.component';
import { ShopComponent } from './components/shop/shop.component';
import { ExperienceBarComponent } from './components/experience-bar/experience-bar.component';
import { EvaluationComponent } from './components/evaluation/evaluation.component';
import { MinigameComponent } from './components/minigame/minigame.component';
import { ObserverPageComponent } from './pages/observer-page/observer-page.component';
import { ObserverOrgComponent } from './components/observer-org/observer-org.component';
import { ObserverPlayerComponent } from './components/observer-player/observer-player.component';

@NgModule({
    declarations: [
        AppComponent,
        GamePageComponent,
        HomePageComponent,
        PlayAreaComponent,
        CreatePlayComponent,
        AdministrationComponent,
        LoginComponent,
        CreateGameComponent,
        HeaderComponent,
        HostGameComponent,
        DialogComponent,
        HistogramComponent,
        OrganizerPageComponent,
        PlayerListComponent,
        QuestionFormComponent,
        MessageComponent,
        ResultatsComponent,
        DemoGameComponent,
        RegisterComponent,
        ChatComponent,
        FriendComponent,
        ProfileComponent,
        ChatPageComponent,
        LobbiesPageComponent,
        GameOptionsComponent,
        SettingComponent,
        StatisticComponent,
        ShopComponent,
        ExperienceBarComponent,
        EvaluationComponent,
        MinigameComponent,
        ObserverPageComponent,
        ObserverOrgComponent,
        ObserverPlayerComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        ReactiveFormsModule,
        DragDropModule,
        AngularFireModule.initializeApp(environment.firebase),
        provideStorage(() => getStorage()),
        AngularFirestoreModule,
        AngularFireStorageModule,
        AngularFireDatabaseModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
