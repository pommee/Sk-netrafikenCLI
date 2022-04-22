const puppeteer = require("puppeteer");
const chalk = require("chalk");
const Box = require("cli-box");
const args = require('minimist')(process.argv.slice(2));
const hasFlag = require('has-flag')
'use strict';

const flags = args;
let page;

(async () => {
    clearConsole()
    checkArgsError()
    console.log(chalk.green("Launching webpage"))
    const browser = await puppeteer.launch({headless: !hasFlag("-hf")});
    page = await browser.newPage();
    await page.goto('https://www.skanetrafiken.se/');
    clearConsole()
    await inputTravelInformation();
    console.log(chalk.green("Searching for departures..."))
    const sokResa = await page.$x('//*[@id="searchButton"]')
    await sokResa[0].click()
    await page.waitForSelector('.st-search-travel-result', {visible: true});

    let data = await gatherData();
    const alternatives = compressInfo(data[0], data[1], data[2], data[3]);
    logAllDepartures(alternatives);
    await browser.close();
})();

async function inputTravelInformation() {
    console.log(chalk.green("Inputting destinations " + chalk.blue(flags.f + " -> " + chalk.yellow(flags.t))))
    await page.type('input[id=fromDestinationAutocompleteCombobox]', flags.f)
    await page.waitForSelector('#fromDestinationOption-0', {visible: true})
    let destinationBox = await page.$x('//*[@id="fromDestinationOption-0"]')
    await destinationBox[0].click()
    await page.type('input[id=toDestinationAutocompleteCombobox]', flags.t)
    await page.waitForSelector('#toDestinationOption-0', {visible: true})
    destinationBox = await page.$x('//*[@id="toDestinationOption-0"]/div')
    await destinationBox[0].click()
    clearConsole()
}

async function gatherData() {
    clearConsole()
    console.log(chalk.green("Gathering data..."))
    const fromAndToTime = await page.evaluate(
        () => [...document.querySelectorAll('.st-time-stamp__planned')].map(elem => elem.innerText)
    );
    const fromAndToJourney = await page.evaluate(
        () => [...document.querySelectorAll('.st-journey-overview__route__row__destinations')].map(elem => elem.innerText)
    );
    const journeyTime = await page.evaluate(
        () => [...document.querySelectorAll('.st-journey-overview__route__container__info')].map(elem => elem.innerText)
    );
    const trainType = await page.evaluate(
        () => [...document.querySelectorAll('.st-travel-rectangle__text')].map(elem => elem.innerText)
    );

    return [fromAndToTime, fromAndToJourney, journeyTime, trainType]
}

function compressInfo(fromAndToTime, fromAndToJourney, journeyTime, trainType) {
    let alternatives = []
    let fromAndToTimeCounter = 0;
    for (let i = 0; i < 4; i++) {
        alternatives.push({
            "fromTime": fromAndToTime[fromAndToTimeCounter],
            "toTime": fromAndToTime[fromAndToTimeCounter + 1],
            "fromStation": fromAndToJourney[i].split("\n")[0],
            "toStation": fromAndToJourney[i].split("\n")[1],
            "journeyTime": cleanTime(journeyTime[i]),
            "trainType": trainType[i]
        })
        fromAndToTimeCounter += 2;
    }
    return alternatives;
}

function cleanTime(time) {
    time = time.toString().replace("Restid: ", "").replace(" min", "")
    return time;
}

function logAllDepartures(departures) {
    clearConsole()
    for (let i = 0; i < departures.length; i++) {
        let departure = departures[i];
        const myBox = new Box({
            w: 50,
            h: 4,
            stringify: false,
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
        }, `${chalk.red.bold(departure.trainType)}
                ${chalk.green(departure.fromStation)}   ->   ${chalk.yellow(departure.toStation)}
                ${chalk.green(departure.fromTime)}     ->   ${chalk.yellow(departure.toTime)}
                Journey: ${chalk.red(departure.journeyTime)} minutes`);
        console.log(myBox.stringify());
    }
}

function checkArgsError() {
    if (flags.f === undefined || flags.t === undefined) {
        console.log("Please enter " + chalk.red("FROM") + " & " + chalk.yellow("TO"))
        console.log("example: 'node main " + chalk.red("MalmöC ") + chalk.yellow("HässleholmC'"))
        process.exit()
    }
}

function clearConsole() {
    process.stdout.write('\x1Bc');
}
