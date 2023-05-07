const electron = require('electron')
const ipc = electron.ipcRenderer


window.addEventListener('DOMContentLoaded', () => {
    document.getElementsByTagName("body").item(0).addEventListener("click", function (event) {
        if(event.target.tagName != "A"){return}
        ipc.sendSync('hotspot-event', event.target.href)
    });
})



