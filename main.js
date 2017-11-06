const express = require('express');
const multer = require('multer');
const request = require('request');
const sha1 = require('sha1');
const upload = multer({ storage: multer.memoryStorage() });

const logging = false;



var domoticzServers = [];
domoticzServers.push({id: 1, domoticzUrl: "pi.domain.com", domoticzPort: 8080, domoticzLogin: "username:password"}); //Server 1
domoticzServers.push({id: 2, domoticzUrl: "domoticz.example.com", domoticzPort: 1337, domoticzLogin: "Plex:P@ssw0rd!"}); //Server 2

var players = [];
players.push({ name: "mediaplayerid", idx: 41, timer: null, serverid: 1 }); // Jasper-PC
players.push({ name: "mediaplayerid", idx: 61, timer: null, serverid: 2 }); //Ricardo Chrome

const app = express();
const port = 10000;

const audioTimeoutMinutes = 10; // 10 - use a short timeout for audio
const videoTimeoutMinutes = 180; // if no response received for 3 hours, set the device to stop

//var timeout = null;

app.listen(port, () => {
    console.log("Express app running at http://localhost:"+port);
});

// routes
app.post('/', upload.single('thumb'), function (req, res, next) {
    const payload = JSON.parse(req.body.payload);

    var idx;
    var serverID
    var domoLogin
    var domoUrl
    var domoPort
    try {
        idx = players.find(x => x.name === payload.Player.uuid).idx;
	serverID = players.find(x => x.name === payload.Player.uuid).serverid;
	domoLogin = domoticzServers.find(x => x.id === serverID).domoticzLogin
	domoUrl = domoticzServers.find(x => x.id === serverID).domoticzUrl
	domoPort = domoticzServers.find(x => x.id === serverID).domoticzPort
	//if (logging == true) {
        //console.log("Player found: " + payload.Account.title );
	console.log("Player found for: "+ payload.Account.title +" / Domoticzserver: " +domoLogin + "@" + domoUrl + ":" + domoPort);
	//console.log(""+playload);
	//}
    } catch (Exception) {
        if (logging == true) {
	    console.log("error: player not found");
	}
    }

    if (idx != undefined) {

        const isVideo = (payload.Metadata.librarySectionType === 'movie' || payload.Metadata.librarySectionType === 'show');
        const isAudio = (payload.Metadata.librarySectionType === 'artist');
        const key = sha1(payload.Server.uuid + payload.Metadata.ratingKey);    

        // missing required properties
        if (!payload.Metadata || !(isAudio || isVideo)) {
            return res.sendStatus(400);
        }

        if (payload.event === 'media.play' || payload.event === 'media.rate') {
            // there is an image attached
            // uncomment the following line to save the image
            // writeImage(key + '.jpg', req.file.buffer);
        }

        var svalue = payload.event.replace("media.", "") + ": " + formatTitle(payload.Metadata) + " - " + formatSubtitle(payload.Metadata);
        request.get("http://" + domoLogin + "@" + domoUrl + ":" + domoPort + "/json.htm?type=command&param=udevice&idx=" + idx + "&nvalue=0&svalue=" + svalue)
        .on('error', function (err) {
            console.log('error sending to Domoticz');
        });

        // use a timeout to set status to stopped if there is no update for n minutes
        // keep separate timeouts for each player
        clearTimeout(players.find(x => x.name === payload.Player.title).timer);
        var timeoutMinutes = audioTimeoutMinutes;
        if (isVideo) {
            timeoutMinutes = videoTimeoutMinutes
        }
        players.find(x => x.name === payload.Player.title).timer = setTimeout(setDomoticzStopped, timeoutMinutes * 60000, idx, serverID);

    }

    res.sendStatus(200);

});


function setDomoticzStopped(idx, serverID) {
    console.log('stopping ' + idx);
    domoLogin = domoticzServers.find(x => x.id === serverID).domoticzLogin
    domoUrl = domoticzServers.find(x => x.id === serverID).domoticzUrl
    domoPort = domoticzServers.find(x => x.id === serverID).domoticzPort
    request.get("http://" + domoLogin + "@" + domoUrl + ":" + domoPort + "/json.htm?type=comand&param=udevice&idx=" + idx + "&nvalue=0&svalue=stop")
    .on('error', function (err) {
        console.log('error sending to Domoticz');
    });
}


app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send(err.message);
});

function writeImage(fileName, buffer) {
    var fs = require('fs');
    fs.access(fileName, (err) => {
        if (!err) {
            console.error('myfile already exists');
            return;
        }

        fs.open(fileName, 'wx', (err, fd) => {
            if (err) throw err;            
            fs.writeFile(fileName, buffer);
        });
    });
}

function formatTitle(metadata) {
    if (metadata.grandparentTitle) {
        return metadata.grandparentTitle;
    } else {
        let ret = metadata.title;
        if (metadata.year) {
            ret += ` (${metadata.year})`;
        }
        return ret;
    }
}

function formatSubtitle(metadata) {
    let ret = '';

    if (metadata.grandparentTitle) {
        if (metadata.type === 'track') {
            ret = metadata.parentTitle;
        } else if (metadata.index && metadata.parentIndex) {
            ret = `S${metadata.parentIndex} E${metadata.index}`;
        } else if (metadata.originallyAvailableAt) {
            ret = metadata.originallyAvailableAt;
        }

        if (metadata.title) {
            ret += ' - ' + metadata.title;
        }
    } else if (metadata.type === 'movie') {
        ret = metadata.tagline;
    }

    return ret;
}
