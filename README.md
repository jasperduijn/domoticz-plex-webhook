# domoticz-plex-webhook
Provides an endpoint for Plex Webhooks to send to Domotiz home automation software.  Supports multiple Plex clients

Example usage is to control lights based on a movie being played, paused or stopped.

## Requirements
* Domoticz https://www.domoticz.com/
* Node.js https://nodejs.org/en/ (Tested with v7.10)
* Plex with Plex Pass https://www.plex.tv/features/plex-pass/

## Setup

```
git clone https://github.com/corbinmunce/domoticz-plex-webhook.git
cd domoticz-plex-webhook
npm install
```

Create a 'Dummy' hardware device in Domoticz (if you don't already have one) and then create a 'Text' virtual sensor named Plex.

Edit main.js to match your Domoticz settings:
```
domoticzServers.push({id: 1, domoticzUrl: "pi.domain.com", domoticzPort: 8080, domoticzLogin: "username:password"}); //Server 1

players.push({ name: "mediaplayerid", idx: 41, timer: null, serverid: 1 }); // Jasper-PC
```

Run the script:
```
node main.js
```

And then add a webhook https://support.plex.tv/hc/en-us/articles/115002267687-Webhooks in Plex to point to the server your are running main.js from.  eg http://192.168.5.28/11000

Once you have verified that it is running correctly from the command line, you can setup to run automatically by adding domoticzPlex to /etc/init.d https://www.linux.com/learn/managing-linux-daemons-init-scripts
