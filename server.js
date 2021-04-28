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

//Slack Integration
/*
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';
const slack = require('slack-notify')(SLACK_WEBHOOK_URL);
*/

//Discord Integration
const DISCORD_WEBHOOK_URL = process.env.DISCORD;
const {Webhook} = require('discord-webhook-node');
const discord = new Webhook(DISCORD_WEBHOOK_URL);

//SendGrid Email Integration
/*
const SENDGRID_APY_KEY = process.env.SENDGRID;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_APY_KEY);
const emailFrom = 'aaa@aaa.com';
const emailsToAlert = ['emailOneToSend@theAlert.com', 'emailTwoToSend@theAlert.com'];
*/

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

                    // Slack Alert Notification
                    /*
                    slack.alert(`🔥🔥🔥  <${urlToCheck}/|Change detected in ${urlToCheck}>  🔥🔥🔥 `, function (err) {
                        if (err) {
                            console.log('Slack API error:', err);
                        } else {
                            console.log('Message received in slack!');
                        }
                    });
                    */

                    // Discord Information Message
                    discord.info(`**ATTENZIONE**`, `Cambiamento!`, `❗️❗️❗️ Cambiamento rilevato su ${urlToCheck} ❗️❗️❗️ `)
                    .then(() => console.log('Message received in Discord!'))
                    .catch(err => console.log(`Discord API error: ${err.message}`));

                    // Email Alert Notification
                    /*
                    const msg = {
                        to: emailsToAlert,
                        from: emailFrom,
                        subject: `🔥🔥🔥 Change detected in ${urlToCheck} 🔥🔥🔥`,
                        html: `Change detected in <a href="${urlToCheck}"> ${urlToCheck} </a>  `,
                    };
                    sgMail.send(msg)
                        .then(()=>{console.log("Alert Email Sent!");})
                        .catch((emailError)=>{console.log(emailError);});
                    */
                }

            }
        }
    });

    requestCounter++;


    // "Working OK" email notification logic
    if (requestCounter > checkingNumberBeforeWorkingOKEmail) {

        requestCounter = 0;
        
        /*
        const msg = {
            to: emailsToAlert,
            from: emailFrom,
            subject: '👀👀👀 Website Change Monitor is working OK 👀👀👀',
            html: `Website Change Monitor is working OK - <b>${new Date().toLocaleString("en-US", {timeZone: "America/New_York"})}</b>`,
        };
        sgMail.send(msg)
            .then(()=>{console.log("Working OK Email Sent!");})
            .catch((emailError)=>{console.log(emailError);});
        */

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
const server = app.listen(PORT, function () {
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
    })
})
