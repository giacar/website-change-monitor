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
const elementsToSearchFor = (process.env.PARAM).split(";");
const checkingFrequency = parseInt(process.env.INTERVAL) * 60000; //first number represent the checkingFrequency in minutes


//Discord Integration
const DISCORD_WEBHOOK_URL = process.env.DISCORD;
const DISCORD_AVATAR_URL = 'https://raw.githubusercontent.com/giacar/website-change-monitor/master/public/mstile-150x150.png';
const HEROKU_URL = process.env.HEROKU_URL;
const {Webhook, MessageBuilder} = require('discord-webhook-node');
const discord = new Webhook(DISCORD_WEBHOOK_URL);
discord.setUsername('Website Monitor');
discord.setAvatar(DISCORD_AVATAR_URL);


const checkingNumberBeforeWorkingOKEmail = 1440 / (checkingFrequency / 60000);   //1 day = 1440 minutes
let requestCounter = 0;

// Discord Starting Message
const startembed = new MessageBuilder()
.setTitle('🟢🟢🟢 Stato 🟢🟢🟢')
.setAuthor('Website Monitor', DISCORD_AVATAR_URL, HEROKU_URL)
.setDescription('🟢🟢🟢 Il servizio di monitoraggio è ONLINE 🟢🟢🟢');
discord.send(startembed)
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
                    const changeembed = new MessageBuilder()
                    .setTitle('❗️❗️❗️ Stato ❗️❗️❗️')
                    .setAuthor('Website Monitor', DISCORD_AVATAR_URL, HEROKU_URL)
                    .setDescription('❗️❗️❗️ Cambiamento rilevato su ${urlToCheck} ❗️❗️❗️');
                    discord.send(changeembed)
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
        const changeembed = new MessageBuilder()
        .setTitle('✅✅✅ Stato ✅✅✅')
        .setAuthor('Website Monitor', DISCORD_AVATAR_URL, HEROKU_URL)
        .setDescription('✅✅✅ Il servizio di monitoraggio è ONLINE ✅✅✅');
        discord.send(changeembed)
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
    const closeembed = new MessageBuilder()
    .setTitle('♻️♻️♻️ Stato ♻️♻️♻')
    .setAuthor('Website Monitor', DISCORD_AVATAR_URL, HEROKU_URL)
    .setDescription('🔴🔴🔴 Il servizio di monitoraggio è OFFLINE 🔴🔴🔴');
    discord.send(closeembed)
    .then(() => console.log('Message received in Discord!'))
    .catch(err => console.log(`Discord API error: ${err.message}`));

    server.close(function () {
        console.log('Server closed')
    });

    setTimeout(function () {
        process.exit()
    }, 1000);
})
