import { Quote } from './Quote.js';
import { QuoteLine } from './QuoteLine.js';
import { Person } from './Person.js';

const WORKER_URL = 'save-quotes.fuerst-felix-7ca.workers.dev';

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.maxHeight){
        content.style.maxHeight = null;
        } else {
        content.style.maxHeight = content.scrollHeight + "px";
        }
    });
}

getAll();

async function loadRoute(Route) {
    const response = await fetch(`${WORKER_URL}/${Route}`);

    if (!response.ok){
        throw new Error (`Fehler beim Laden von ${Route}: ${response.status}`)
    }

    return await response.json();
}

async function saveRoute(Route, array) {
    const response = await fetch(`${WORKER_URL}/${Route}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(array),
    });
 
    if (!response.ok) {
        throw new Error(`Fehler beim Speichern von ${Route}: ${response.status}`);
    }
}


async function getAll() {
    const [PersonsRaw, QuoteLinesRaw, QuotesRaw] = await Promise.all([
        loadRoute("Persons"),
        loadRoute("QuoteLines"),
        loadRoute("Quotes"),
    ]);
 
    const Persons = (PersonsRaw || []).map(p => Person.fromJSON(p));
    const QuoteLines = (QuoteLinesRaw || []).map(z => Zeile.fromJSON(z));
    const Quotes = (QuotesRaw || []).map(q => Quote.fromJSON(q));
 
    return { Persons, QuoteLines, Quotes }; //so als Array aufrufbar

}

async function savePersons(persons) {
    await saveRoute("Persons", persons);
}
 
async function saveLines(QuoteLines) {
    await saveRoute("QuoteLines", QuoteLines);
}
 
async function saveQuotes(Quotes) {
    await saveRoute("Quotes", Quotes);
}
 
async function saveAll(persons, QuoteLines, Quotes) {
    await Promise.all([
        savePersons(persons),
        saveLines(QuoteLines),
        saveQuotes(Quotes),
    ]);
}
