const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

//Express configuration
const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
const PORT = process.env.PORT;


//Main configuration variables
const urlToCheck = process.env.URL;
const elementsToSearchFor = ['Giugno', 'Luglio', 'Settembre', 'GIUGNO', 'LUGLIO', 'SETTEMBRE'];
const checkingFrequency = 5 * 60000; //first number represent the checkingFrequency in minutes


//Discord Integration
const DISCORD_WEBHOOK_URL = process.env.DISCORD;
const DISCORD_AVATAR_URL = 'https://raw.githubusercontent.com/giacar/website-change-monitor/master/public/mstile-150x150.png';
const {Webhook} = require('discord-webhook-node');
const discord = new Webhook(DISCORD_WEBHOOK_URL);
discord.setUsername('Calendario Esami');
discord.setAvatar(DISCORD_AVATAR_URL);


const checkingNumberBeforeWorkingOKEmail = 1440 / (checkingFrequency / 60000);   //1 day = 1440 minutes
let requestCounter = 0;

// Discord Starting Message
discord.info(`**Stato**`, `Stato`, `🟢🟢🟢 Il servizio di monitoraggio è ONLINE 🟢🟢🟢`)
.then(() => console.log('Message received in Discord!'))
.catch(err => console.log(`Discord API error: ${err.message}`));

//Main function
const intervalId = setInterval(function () {

    request(urlToCheck, function (err, response, body) {
        //if the request fail
        if (err) {
            console.log(`Request Error - ${err}`);
        }
        else {
            //if the target-page content is empty
            if (!body) {
                console.log(`Request Body Error - ${err}`);
            }
            //if the request is successful
            else {

                //if any elementsToSearchFor exist
                if (elementsToSearchFor.some((el) => body.includes(el))) {

                    // Discord Information Message
                    discord.info(`**ATTENZIONE**`, `Cambiamento!`, `❗️❗️❗️ Cambiamento rilevato su ${urlToCheck} ❗️❗️❗️ `)
                    .then(() => console.log('Message received in Discord!'))
                    .catch(err => console.log(`Discord API error: ${err.message}`));

                }

            }
        }
    });

    requestCounter++;


    // "Working OK" notification logic
    if (requestCounter > checkingNumberBeforeWorkingOKEmail) {

        requestCounter = 0;

        // Discord Information Message
        discord.info(`**Stato**`, `Stato`, `✅✅✅ Il servizio di monitoraggio è ONLINE ✅✅✅`)
        .then(() => console.log('Message received in Discord!'))
        .catch(err => console.log(`Discord API error: ${err.message}`));
    }

}, checkingFrequency);


//Index page render
app.get('/', function (req, res) {
    res.render('index', null);
});


//Server start
const server = app.listen(PORT || 3000, function () {
    console.log(`Example app listening on port ${PORT}!`)
});

//SIGTERM signal handling for Heroku
process.on('SIGTERM', function () {
    // Discord Closing Message
    discord.info(`**Stato**`, `Stato`, `🔴🔴🔴 Il servizio di monitoraggio è OFFLINE 🔴🔴🔴`)
    .then(() => console.log('Message received in Discord!'))
    .catch(err => console.log(`Discord API error: ${err.message}`));

    server.close(function () {
        console.log('Server closed')
    });

    setTimeout(function () {
        process.exit()
    }, 1000);
})
