const execFile = require('child_process').spawn;
execFile('web-ext run --firefox="C:\Program Files\Mozilla Firefox\firefox.exe" -p ffuser2', [], {stdio: 'inherit', shell: true})
/*execFile('web-ext',['run'],(e, stdout, stderr)=> {
    if (e instanceof Error) {
        console.error(e);
        throw e;
    }
    console.log('stdout ', stdout);
    console.log('stderr ', stderr);
});
/*exec('web-ext run --firefox="C:\Program Files\Mozilla Firefox\firefox.exe" -p ffuser2')
exec('web-ext run --firefox="C:\Program Files\Mozilla Firefox\firefox.exe" -p ffuser3')
exec('web-ext run --firefox="C:\Program Files\Mozilla Firefox\firefox.exe" -p ffuser4')
exec('web-ext run --firefox="C:\Program Files\Mozilla Firefox\firefox.exe" -p ffuser5')
exec('web-ext run --firefox="C:\Program Files\Mozilla Firefox\firefox.exe" -p ffuser6')
exec('web-ext run --firefox="C:\Program Files\Mozilla Firefox\firefox.exe" -p ffuser7')
exec('web-ext run --firefox="C:\Program Files\Mozilla Firefox\firefox.exe" -p ffuser8')

*/