const { contextBridge, ipcRenderer } = require('electron');

const electron = {
    openChatWindow: () => ipcRenderer.send('open-chat-window'),
    isChatWindow: async () => ipcRenderer.invoke('is-chat-window'),
    setCurrentUser: (currentUser) => ipcRenderer.send('set-current-user', currentUser),
    getCurrentUser: async () => ipcRenderer.invoke('get-current-user'),
    isWindowClosed: async (windowType) => ipcRenderer.invoke('is-window-closed', windowType),
    close: (windowType) => ipcRenderer.send('close-window', windowType),
    setCurrentChannel: (currentUser) => ipcRenderer.send('set-current-channel', currentUser),
    getCurrentChannel: async () => ipcRenderer.invoke('get-current-channel'),
    setData: ({
        isResults,
        roomCode,
        isOrganisator,
        inGame,
    }) => ipcRenderer.send('set-data', {
        isResults,
        roomCode,
        isOrganisator,
        inGame,
    }),
    getData: async () => ipcRenderer.invoke('get-data'),
    watchData: (callback) => ipcRenderer.on('data-changed', (event, data) => {
        callback(data);
    }),
    watcMute: (callback) => ipcRenderer.on('mute-changed', (event, data) => {
        callback(data);
    }),
    muteChanged: (isMute) => ipcRenderer.send('change-mute', {isMute}),
    setSize: ({
        isMinimized,
        isMaximized,
    }) => ipcRenderer.send('set-size', {
        isMinimized,
        isMaximized,
    }),
    watchSize: (callback) => ipcRenderer.on('size-changed', (event, data) => {
        callback(data);
    }),
};

process.once('loaded', () => {
    contextBridge.exposeInMainWorld('electron', electron);
});