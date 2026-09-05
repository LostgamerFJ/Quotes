import { Quote } from './Quote.js';
import { QuoteLine } from './QuoteLine.js';
import { Person } from './Person.js';

const WORKER_URL = 'https://save-quotes.fuerst-felix-7ca.workers.dev';

let Persons = [];
let QuoteLines = [];
let Quotes = [];

let personSelector = Persons;

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
    const QuoteLines = (QuoteLinesRaw || []).map(z => QuoteLines.fromJSON(z));
    const Quotes = (QuotesRaw || []).map(q => Quote.fromJSON(q));
 
    return { Persons, QuoteLines, Quotes }; //callable Arrays
}

getAll();

async function savePersons(persons) {
    await saveRoute("Persons", persons);
}
 
async function saveLines(QuoteLines) {
    await saveRoute("QuoteLines", QuoteLines);
}
 
async function saveQuotes(Quotes) {
    await saveRoute("Quotes", Quotes);
}
 
const saveAllBtn = document.getElementById('saveAllBtn');

saveAllBtn.addEventListener('click', () => {
    saveAll(Persons, QuoteLines, Quotes);
});

async function saveAll(persons, QuoteLines, Quotes) {
    await Promise.all([
        savePersons(persons),
        saveLines(QuoteLines),
        saveQuotes(Quotes),
    ]);
}

const PersonSelect = document.getElementById('Person');
personSelector.forEach(optionText => {
    const option = document.createElement('option');
    option.value = optionText;
    option.textContent = optionText;
    PersonSelect.appendChild(option);
});

const overlay = document.getElementById('overlay');
const openBtn = document.getElementById('openBtn');
const closeXBtn = document.getElementById('closeXBtn');
const saveBtn = document.getElementById('saveBtn');
const extraFieldBtn = document.getElementById('extraFieldBtn');

openBtn.addEventListener('click', () => {
    overlay.classList.add('active');
});

closeXBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
});

overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
        overlay.classList.remove('active');
    }
});

saveBtn.addEventListener('click', () => {
    console.log('Gespeichert:', {
        Person: document.getElementById('Person').value,
        Notes: document.getElementById('Notes').value,
        Quote: document.getElementById('Quote').value,
        Context: document.getElementById('Context').value,
    });
    overlay.classList.remove('active');
});
let lineCount = 0;

extraFieldBtn.addEventListener('click', () => {
    lineCount++;

    const newRow = document.createElement('div');
    newRow.className = 'field-row';
    newRow.innerHTML = `
        <div class="field">
            <label for="Person${lineCount}">Person</label>
            <select id="Person${lineCount}"></select>
        </div>
        <div class="field">
            <label for="Notes${lineCount}">Notiz</label>
            <input type="text" id="Notes${lineCount}" placeholder="Optional">
        </div>
        <div class="field">
            <label for="Quote${lineCount}">Zitat</label>
            <input type="text" id="Quote${lineCount}">
        </div>
        <div class="field">
            <label for="Context${lineCount}">Kontext</label>
            <input type="text" id="Context${lineCount}" placeholder="optional">
        </div>
    `;

    const leftAction = document.querySelector('.left-action');
    leftAction.parentNode.insertBefore(newRow, leftAction);

    const personSelect = newRow.querySelector(`#Person${lineCount}`);
    personSelector.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        personSelect.appendChild(option);
    });

    newRow.querySelector(`#Quote${lineCount}`).focus();
});