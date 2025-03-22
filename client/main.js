const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let appWindow;
let chatWindow;
let currentUser;
let currentChannel;
let data;

function createWindow() {
    appWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    appWindow.windowType = 'mainWindow';
    appWindow.setMenuBarVisibility(false);
    appWindow.loadFile(path.join(__dirname, 'dist/client/index.html'));

    appWindow.on('closed', function () {
        appWindow = null;
    });
}

function createChatWindow() {
    chatWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    chatWindow.windowType = 'chatWindow';
    chatWindow.setMenuBarVisibility(false);
    chatWindow.loadFile(path.join(__dirname, 'dist/client/index.html'));

    chatWindow.on('closed', function () {
        chatWindow = null;
    });
}

ipcMain.on('open-chat-window', () => {
    createChatWindow();
});

ipcMain.handle('is-chat-window', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win.windowType === 'chatWindow';
});

ipcMain.on('set-current-user', (event, user) => {
    currentUser = user;
});

ipcMain.on('set-data', (event, {
    isResults,
    roomCode,
    isOrganisator,
    inGame,
}) => {
    data = {
        isResults,
        roomCode,
        isOrganisator,
        inGame,
    }
    if (chatWindow) {
        chatWindow.webContents.send('data-changed', data);
    } 
});

ipcMain.handle('get-data', async () => {
    return data;
});

ipcMain.on('change-mute', (isMute) => {
    chatWindow.webContents.send('mute-changed', isMute);
});

ipcMain.on('set-size', (event, {
    isMinimized,
    isMaximized,
}) => {
    if (appWindow) {
        appWindow.webContents.send('size-changed', {isMinimized, isMaximized});
    } 
});

ipcMain.handle('get-current-channel', async () => {
    return currentChannel;
});

ipcMain.on('set-current-channel', (event, channel) => {
    currentChannel = channel;
});

ipcMain.handle('get-current-user', async () => {
    return currentUser;
});

ipcMain.handle('is-window-closed', async (event, windowType) => {
    if (windowType === 'mainWindow') {
        return appWindow === null;
    } else if (windowType === 'chatWindow') {
        return chatWindow === null;
    }
});

ipcMain.on('close-window', (event, windowType) => {
    if (windowType === 'mainWindow' && appWindow) {
        appWindow.close();
    } else if (windowType === 'chatWindow' && chatWindow) {
        chatWindow.close();
    }
});

app.whenReady().then(() => {
    createWindow();
});
