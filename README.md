# domoticz-plex-webhook
Provides an endpoint for Plex Webhooks to send to Domotiz home automation software.  Supports multiple Plex clients and Domoticz Servers.

Example usage is to control lights based on a movie being played, paused or stopped.

## Requirements
* Domoticz https://www.domoticz.com/
* Node.js https://nodejs.org/en/ (Tested with v8.9.0)
* Plex with Plex Pass https://www.plex.tv/features/plex-pass/

## Setup
Installation instructions for Raspberry Pi

```
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt install nodejs
git clone https://github.com/jasperduijn/domoticz-plex-webhook.git
cd domoticz-plex-webhook
npm install
```

Create a 'Dummy' hardware device in Domoticz (if you don't already have one) and then create a 'Text' virtual sensor named Plex. Go to devices and take note of the idx number.

Find your Plex Media player ID by following these steps:
* Start Playing an item from the device you want to register
* Go to your Plex Server session page http://plexserverip:32400/status/sessions?X-Plex-Token=yourtokenhere (To find X-Plex-Token https://support.plex.tv/hc/en-us/articles/204059436-Finding-an-authentication-token-X-Plex-Token)
* Find the "machineIdentifier" value for the player

Edit main.js to match your Domoticz settings:
```
domoticzServers.push({id: 1, domoticzUrl: "pi.domain.com", domoticzPort: 8080, domoticzLogin: "username:password"}); //Server 1

players.push({ name: "mediaplayerid", idx: 41, timer: null, serverid: 1 }); // Jasper-PC
```

Run the script:
```
node main.js
```

And then add a webhook https://support.plex.tv/hc/en-us/articles/115002267687-Webhooks in Plex to point to the server your are running main.js from.  eg http://192.168.0.11/11000

Once you have verified that it is running correctly from the command line, you can setup to run automatically by editing the domoticzPlex.service file to match your directories and running the commands below
```
sudo cp domoticzPlex.service /etc/systemd/system/domoticzPlex.service
sudo systemctl enable domoticzPlex
sudo systemctl start domoticzPlex
```
