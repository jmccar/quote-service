const rp = require('request-promise');
const $ = require('cheerio');
const fs = require('fs');
const path = require('path');
const quotesFilePath = path.join(process.cwd(), 'public', 'quotes.json');
const url = 'http://wisdomquotes.com/stoic-quotes/';

// Quote Event Req
let quoteEventReq = [];
let quoteEventRes = [];
exports.scrapQuote = () => {
    rp(url).then((html) => {
        let quotes = $('blockquote > p', html);
        console.log('quote', quotes[0].children[0].data);
        let allQuotes = [];
        quotes.map((_, el) => {
            // console.log('index', index);
            const text = el.children[0].data;
            allQuotes.push(text);
        });
        fs.writeFile(quotesFilePath, JSON.stringify(allQuotes), (err) => {
            console.log('err', err);
        });
    }).catch((err) => {
        console.log('err', err);
    });
};

exports.scrapQuoteOfTheDay = () => {
    let qotdUrl = 'http://wisdomquotes.com/?time=' + (Date.now());
    rp(qotdUrl).then((html) => {
        let quote = $('.quotescollection-quote', html).text();
        sendEventToBrowser(quoteEventRes, { event: 'newQuote', data: { quote }});
        return quote;
    }).catch((err) => {
        console.log('err', err);
    });
}

exports.setQuoteEvent = (req, res) => {
    // SSE Header Setup
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        // Without allowing this, you will get Connection Refused
        'Access-Control-Allow-Origin': '*' 
    });
    req.on('close', () => {
        res.end();
    });
    // Save all the Response Obj to array
    // So we can inform client when there is new quote
    quoteEventRes.push(res);
    console.log('Quote Event Setup Successfully');
}

const sendEventToBrowser = (resArray, info) => {
    if (resArray)  {
        // Remove all closed connection from the array by checking res.finished
        resArray = resArray.filter((res) => {
            if(!res.finished) {
                console.log('update new quote');
                res.write(`event: ${info.event}\n`);
                res.write(`data: ${JSON.stringify(info.data)}`);
                res.write("\n\n");
                
            }
            return (!res.finished);
        }); 
    } else {
        console.log('Quote Event Res Undefiend');
    }
    
}
