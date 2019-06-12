__dirname = __dirname.replace("app.asar","")
const electron = require("electron"),
    url = require("url"),
    path = require("path"),
    YTPGenerator = require("ytpplus-node")
    transitions = __dirname+"/sources",
    sources = [],
    sfx = __dirname+"/sounds",
    music = __dirname+"/music",
    settings = {
        "transitions":false,
        "debug":true,
        "outro":__dirname+"/resources/outro.mp4",
        "max":20,
        "effectRange":[0,11],
        "stream":[0.2,0.4],
        "resolution":[640,480],
        "output":__dirname+"/rendered.mp4"
    },
    effects = {
        "E1":false,
        "E2":false,
        "E3":true,
        "E4":true,
        "E5":true,
        "E6":true,
        "E7":true,
        "E8":true,
        "E9":true,
        "E10":false,
        "E11":true
    },
    {app, autoUpdater, BrowserWindow, Menu, ipcMain, dialog, shell} = electron,
    server = 'https://update.electronjs.org'
    feed = `${server}/OWNER/REPO/${process.platform}-${process.arch}/${app.getVersion()}`
    mainMenuTemplate = [
        {
            label:"File",
            submenu:[
                /*{
                    label:"Add Materials",
                    click() {
                        dialog.showOpenDialog({
                            title:"Select Material",
                            defaultPath:__dirname,
                            filters:[
                                { name: 'MPEG-4 Videos', extensions: ['mp4'] }
                            ],
                            properties: ['openFile', 'multiSelections'] 
                        },function(filePaths) {
                            if(filePaths) {
                                sources.concat(filePaths);
                                for(var i=0;i < filePaths.length;i++) {
                                    mainwindow.webContents.send("item:add",filePaths[i]);
                                }
                            }
                        })
                    }
                },
                {
                    label: "Clear Materials",
                    click() {
                        mainwindow.webContents.send("item:clear")
                        sources = [];
                    }
                },*/
                {
                    label: "Quit YTP++",
                    accelerator: process.platform == "darwin" ? "Command+Q" : "Ctrl+Q",

                    click() {
                        app.quit();
                    }
                }
            ]
        },
        {
            label:"Help",
            submenu:[
                {
                    label:"README.md for ytpplus-node",
                    accelerator: "F1",

                    click() {
                        createSubWindow("https://github.com/TeamPopplio/ytpplus-node/blob/master/README.md")
                    }
                },
                {
                    label: "arctic.zone Discord",
                    accelerator: "F2",

                    click() {
                        createSubWindow("https://discord.gg/6NZArYA")
                    }
                },
            ]
        }
    ];
process.env.NODE_ENV = "production"

let mainwindow,
    subWindow;

ipcMain.on('transitions:set', function(e, item){
    transitions = item
})

ipcMain.on('sources:add', function(e, item){
    sources.push(item)
})

ipcMain.on('sources:clear', function(){
    sources = []
})

ipcMain.on('outro:set', function(e, item){
    settings.outro = item
})

ipcMain.on('sfx:set', function(e, item){
    sfx = item
})

ipcMain.on('music:set', function(e, item){
    music = item
})

ipcMain.on('effect:toggle', function(e, item){
    effects[item] = !effects[item]
})

ipcMain.on('settings:toggle', function(e, item){
    settings[item] = !settings[item]
})

ipcMain.on('settings:reset', function(e, item){
    transitions = __dirname+"/sources",
    sources = [],
    sfx = __dirname+"/sounds",
    music = __dirname+"/music",
    settings = {
        "transitions":false,
        "debug":true,
        "outro":__dirname+"/resources/outro.mp4",
        "max":20,
        "effectRange":[0,11],
        "stream":[0.2,0.4],
        "resolution":[640,480],
        "output":__dirname+"/rendered.mp4"
    }
})

ipcMain.on('settings:set', function(e, item){
    settings.max = parseInt(item[0])
    settings.effectRange = [parseFloat(item[1][0]),parseFloat(item[1][1])]
    settings.stream = [parseFloat(item[2][0]),parseFloat(item[2][1])]
    settings.resolution = [parseInt(item[3][0]),parseInt(item[3][1])]
    settings.output = item[4]
})

ipcMain.on('render', function(){
    console.log(settings.output)
    new YTPGenerator().configurateAndGo({
        
        debug: settings.debug,
        sourceList: sources,
        outro: settings.outro,
        OUTPUT_FILE: settings.output,
        MAX_CLIPS: settings.max,
        MAX_STREAM_DURATION:settings.stream[0],
        MIN_STREAM_DURATION:settings.stream[1],
        effectRange: settings.effectRange,
        ffmpeg: (process.platform === 'win32' ? __dirname+"/ffmpeg.exe" : "ffmpeg"),
        ffprobe: (process.platform === 'win32' ? __dirname+"/ffprobe.exe" : "ffprobe"),
        temp: __dirname+"/temp",
        transitions: settings.transitions,
        music: music,
        sounds: sfx,
        sources: transitions,
        effects: {  
            effect_RandomSound: effects.E1,
            effect_RandomSoundMute: effects.E2,
            effect_Reverse: effects.E3,
            effect_Chorus: effects.E4,
            effect_Vibrato: effects.E5,
            effect_HighPitch: effects.E6,
            effect_LowPitch: effects.E7,
            effect_SpeedUp: effects.E8,
            effect_SlowDown: effects.E9,
            effect_Dance: effects.E10,
            effect_Squidward: effects.E11
        },
        resolution:settings.resolution
    }).then(()=>{
        mainwindow.webContents.send("render:done",__dirname+"/rendered.mp4");
    }).catch(()=>{
        mainwindow.webContents.send("render:error");
    })
})

app.on("ready",function() {
    if(process.env.NODE_ENV == "production") {
        autoUpdater.setFeedURL(feed)
        autoUpdater.checkForUpdates()
    }
    mainwindow = new BrowserWindow({
        height: 610,
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainwindow.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        //hash:"#introduction",
        protocol: "file:",
        slashes: true
    }));

    mainwindow.on("closed",function() {
        app.quit()
    });

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    Menu.setApplicationMenu(mainMenu)
    if(process.env.NODE_ENV == "production") setInterval(() => {autoUpdater.checkForUpdates()}, 600000);
})

function createSubWindow(link) {
    subwindow = new BrowserWindow({
        width: 700,
        height: 610,
        webPreferences: {
            nodeIntegration: false
        }
    });
    subwindow.loadURL(link);
}

if(process.platform == "darwin") {
    mainMenuTemplate.unshift({});
}

if(process.env.NODE_ENV != "production") {
    mainMenuTemplate.push({
        label:"Develop",
        submenu:[
            {
                label:"Toggle DevTools",
                accelerator: process.platform == "darwin" ? "Command+I" : "Ctrl+I",
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: "reload"
            }
        ]
    });
} else {
    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
        const dialogOpts = {
          type: 'info',
          buttons: ['Restart', 'Later'],
          title: 'Application Update',
          message: process.platform === 'win32' ? releaseNotes : releaseName,
          detail: 'A new version has been downloaded. Restart YTP++ to apply the updates.'
        }
      
        dialog.showMessageBox(dialogOpts, (response) => {
          if (response === 0) autoUpdater.quitAndInstall()
        })
    })
    autoUpdater.on('error', message => {
        console.error('There was a problem updating the application')
        console.error(message)
    })
}