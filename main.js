#!/usr/bin/env node

const axios = require('axios');
const chalk = require("chalk");
const Box = require("cli-box");
const args = require("minimist")(process.argv.slice(2));
const hasFlag = require("has-flag")
'use strict';

let presetTravel = require("./preset.json")
const flags = args;

(async () => {
    clearConsole()
    checkArgsError()
    logMsg(chalk.green("Give me a second..."))
    await run()
})();

async function run() {
    let data = await axios.all([removeNordicLetters(presetTravel.from), removeNordicLetters(presetTravel.to)])
        .then(axios.spread(async (...responses) => {
            let from = axios.get(responses[0]).then(async response => {
                for (let i = 0; i < response.data.points.length; i++) {
                    let data = response.data.points[i];
                    if (data.name === presetTravel.from) {
                        return data;
                    }
                }
            })
            let to = axios.get(responses[1]).then(async response => {
                for (let i = 0; i < response.data.points.length; i++) {
                    let data = response.data.points[i];
                    if (data.name === presetTravel.to) {
                        return data;
                    }
                }
            })
            return [await from, await to]
        }))

    let journeys = [];

    axios.get("https://www.skanetrafiken.se/gw-tps/api/v2/Journey?fromPointId=" + await data[0].id2 +
        "&fromPointType=STOP_AREA&toPointId=" + await data[1].id2 + "&toPointType=STOP_AREA&arrival=false&journeysAfter=6")
        .then(response => {
            for (let journey of response.data.journeys) {
                let from = journey.routeLinks[0].from;
                let to = journey.routeLinks[0].to;
                let departure = {
                    "id": journey.id,
                    "routeFrom": {
                        "from": from.name,
                        "time": from.time,
                        "pos": from.pos,
                    },
                    "routeTo": {
                        "from": to.name,
                        "time": to.time,
                        "pos": to.pos
                    },
                    "trainType": journey.routeLinks[0].line.name,
                }
                if (journey.routeLinks[0].deviations !== undefined)
                    departure["deviation"] = journey.routeLinks[0].deviations.text
                else
                    departure["deviation"] = ""
                journeys.push(departure)
            }

            console.log(journeys)
            logAllDeparturesAPI(journeys)
        })
}

function logAllDeparturesAPI(departures) {
    clearConsole()
    for (let journey of departures) {
        let msg;
        let from = journey.routeFrom;
        let to = journey.routeTo;
        let travelTime = ((new Date(journey.routeTo.time).getTime() - new Date(journey.routeFrom.time).getTime()) / 1000) / 60;
        if (journey.deviation !== "") {
            msg = `${chalk.red.bold(journey.trainType)} - ${chalk.red(travelTime)} min
                ${chalk.green(from.from)}   ->   ${chalk.yellow(to.from)}
                ${chalk.green(from.time)}     ->   ${chalk.yellow(to.time)}
                ⚠️ ${chalk.redBright(journey.deviation)}`;
        } else {
            msg = `${chalk.green.bold(journey.trainType)} - ${chalk.green(travelTime)} min
                ${chalk.green(from.from)} -> ${chalk.yellow(to.from)}
                ${chalk.green(from.time)} -> ${chalk.yellow(to.time)}`;
        }
        const myBox = new Box({
            w: 50,
            h: 4,
            stringify: false,
            stretch: true,
            marks: {
                nw: '╭',
                n: '─',
                ne: '╮',
                e: '│',
                se: '╯',
                s: '─',
                sw: '╰',
                w: '│'
            },
            hAlign: 'left',
        }, msg);
        console.log(myBox.stringify());
    }
}

function removeNordicLetters(word) {
    word = word.replace("å", "%C3%A5")
    word = word.replace("ä", "%C3%A4")
    word = word.replace("ö", "%C3%B6")
    return "https://www.skanetrafiken.se/gw-tps/api/v2/Points?name=" + word;
}

function clearConsole() {
    process.stdout.write('\x1Bc');
}

function logMsg(message) {
    clearConsole();
    console.log(message)
}

function checkArgsError() {
    if (hasFlag("-p")) {
        flags.f = presetTravel.from;
        flags.t = presetTravel.to;
        return;
    }
    if (flags.f === undefined || flags.t === undefined) {
        console.log("Please enter " + chalk.red("FROM") + " & " + chalk.yellow("TO"))
        console.log("example: 'node main " + chalk.red("MalmöC ") + chalk.yellow("HässleholmC'"))
        process.exit()
    }
}
