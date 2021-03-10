// Setting up Discord Setup,  Fetch Setup , env variables setup
const Discord = require("discord.js");
const fetch = require("node-fetch");
require("dotenv").config();


//Making a Discord Bot Client
const client = new Discord.Client();


// Firebase Setup
const firebase = require("firebase/app");
require("firebase/database");
var config = {
    apiKey: process.env.apiKey,
    databaseURL: process.env.databaseURL,
    storageBucket: process.env.storageBucket
};
console.log(config)
firebase.initializeApp(config);

//------------------------------------------------------------------------------------


// Setting Up Manual prexisting words !!!!!
var sadWords = ["sad", "depressed", "unhappy", "angry", "upset", "gloomy",
    "hurt", "miserable", "nervous ", "lonely", "frightened"
];


var manual = `Hello My Name is Encourage Bot. As my name suggests I ecourage you in your sad times.
If you write some sad words in your chat i will relpy some encouraging words to you.
My all commands run with $ , so kindly remember it.
My Commands are:
-> [ $inspire ] :- Gives you a random inspirational Quote!
-> [ $responding ] :- Tells If auto Responding Feature is On/Off.
-> [ $responding ['on'/'off'/'true'/'false'] ] :- To turn on / off auto responding to your sad messages.
-> [ $list ] :- To list all encouraging messages I have.
-> [ $new [msg] ] :- To add new encouraging messages..
-> [ $del [index] ] :- To delete encouraging messages at given index in list.
-> [ $offline ] :- If You are over-optimistic, Turn Me off !!!!
`

//------------------------------------------------------------------------------------


// ALL USING VARIABLES for firebase
var respondRef = firebase.database().ref('responseStatus');
var happyRef = firebase.database().ref('happyWords');

happyRef.get().then(function (snapshot) {
    if (snapshot.exists()) {
        starterCheer = snapshot.val();
    }
    else {
        console.log("No data available");
    }
}).catch(function (error) {
    console.error(error);
});

//------------------------------------------------------------------------------


// ALL FUNCTIONS ACTING IN THE BOT
var ans = true;


// Function returning random inspirational quotes
function getQuote() {
    return fetch("https://zenquotes.io/api/random")
        .then(res => {
            return res.json();
        })
        .then(data => {
            return data[0]["q"] + " - " + data[0]["a"];
        })
};


// Function returning status of responding 
function checkResponse() {
    respondRef.on("value", snapshot => {
        return snapshot.val();
    });
}


// Function that lists all the good words
function listAll() {
    var str = "";
    for (i in starterCheer) {
        str += `${i} ` + starterCheer[i] + "\n";
    }
    return str;
}


//Function that add new encouraging words user-defined
function addNew(str) {
    starterCheer.push(str);
    happyRef.set(starterCheer);
    happyRef.get().then(function (snapshot) {
        if (snapshot.exists()) {
            starterCheer = snapshot.val();
        }
        else {
            console.log("No data available");
        }
    }).catch(function (error) {
        console.error(error);
    });
}


//Function deleting encouraging words
function delInd(index) {
    happyRef.child(index).remove();
    happyRef.get().then(function (snapshot) {
        if (snapshot.exists()) {
            starterCheer = snapshot.val();
        }
        else {
            console.log("No data available");
        }
    }).catch(function (error) {
        console.error(error);
    });
}


//-------------------------------------------------------------------------------------


// When Bot sucessfully logged in
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});


// Functions for every message send in Server
client.on("message", msg => {
    if (msg.author.bot) return

    // $man
    if (msg.content === "$man")
        msg.reply(manual);

    // $inspire
    if (msg.content.toLowerCase() === "$inspire")
        getQuote().then(quote => msg.channel.send(quote));

    // $responding 
    if (msg.content.startsWith("$responding")) {
        value = msg.content.split("$responding ")[1];
        if (value === undefined) {
            if (ans)
                msg.channel.send("ON");
            else
                msg.channel.send("OFF");
        }
        else if (value.toLowerCase() === "true" || value.toLowerCase() === "on") {
            respondRef.set(true);
            ans = checkResponse();
            msg.channel.send("Responding is enabled.")
        } else if (value.toLowerCase() === "false" || value.toLowerCase() === "off") {
            respondRef.set(false)
            ans = checkResponse();
            msg.channel.send("Responding is disabled.")
        }
    }

    if (ans) {

        // $new
        if (msg.content.startsWith("$new")) {
            addNew(msg.content.split("$new ")[1]);
            msg.channel.send("Encourage Message added");
        }

        // $del
        if (msg.content.startsWith("$del")) {
            parseInt(delInd(msg.content.split("$del ")[1]));
            msg.channel.send("Encourage Message was deleted");
        }

        // responding function
        if (sadWords.some(word => msg.content.includes(word))) {
            const encouragement = starterCheer[Math.floor(Math.random() * starterCheer.length)]
            msg.reply(encouragement)
        }
    }


    // $list
    if (msg.content.startsWith("$list")) {
        var str = listAll();
        msg.channel.send(str);
    }


    // $offline
    if (msg.content === "$offline")
        process.exit(1);
});


// Login Bot Credtentials saved as env variables
client.login(process.env.TOKEN);