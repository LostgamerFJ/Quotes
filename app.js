import { Quote } from './Quote.js';
import { QuoteLine } from './QuoteLine.js';
import { Person } from './Person.js';
import { createPersonDropdown, getSelectedPersonId } from './Person_Dropdown.js';

const WORKER_URL = 'https://save-quotes.fuerst-felix-7ca.workers.dev';

let Persons = [];
let QuoteLines = [];
let Quotes = [];

const personDropdowns = new Map();

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

async function loadRoute(route) {
    const response = await fetch(`${WORKER_URL}/${route}`);

    if (!response.ok){
        throw new Error(`Fehler beim Laden von ${route}: ${response.status}`);
    }

    return await response.json();
}

async function saveRoute(route, array) {
    const response = await fetch(`${WORKER_URL}/${route}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(array),
    });

    if (!response.ok) {
        throw new Error(`Fehler beim Speichern von ${route}: ${response.status}`);
    }
}

async function getAll() {
    const [personsRaw, quoteLinesRaw, quotesRaw] = await Promise.all([
        loadRoute("Persons"),
        loadRoute("QuoteLines"),
        loadRoute("Quotes"),
    ]);

    Persons = (personsRaw || []).map(p => Person.fromJSON(p));
    QuoteLines = (quoteLinesRaw || []).map(z => QuoteLine.fromJSON(z));
    Quotes = (quotesRaw || []).map(q => Quote.fromJSON(q));
}

async function savePersons(persons) {
    await saveRoute("Persons", persons);
}

async function saveLines(quoteLines) {
    await saveRoute("QuoteLines", quoteLines);
}

async function saveQuotes(quotes) {
    await saveRoute("Quotes", quotes);
}

async function saveAll(persons, quoteLines, quotes) {
    await Promise.all([
        savePersons(persons),
        saveLines(quoteLines),
        saveQuotes(quotes),
    ]);
}

function mountPersonDropdown(idSuffix, slotElement) {
    const dropdown = createPersonDropdown(idSuffix, Persons);
    slotElement.appendChild(dropdown);
    personDropdowns.set(idSuffix, dropdown);
}

const overlay = document.getElementById('overlay');
const openBtn = document.getElementById('openBtn');
const closeXBtn = document.getElementById('closeXBtn');
const saveBtn = document.getElementById('saveBtn');
const extraFieldBtn = document.getElementById('extraFieldBtn');
const saveAllBtn = document.getElementById('saveAllBtn');

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

function collectRows() {
    const rows = [];

    for (const suffix of personDropdowns.keys()) {
        const dropdown = personDropdowns.get(suffix);
        const notesField = document.getElementById(`Notes${suffix}`);
        const quoteField = document.getElementById(`Quote${suffix}`);
        const contextField = document.getElementById(`Context${suffix}`);

        rows.push({
            person: getSelectedPersonId(dropdown),
            notes: notesField.value,
            quote: quoteField.value,
            context: contextField.value,
        });
    }

    return rows;
}

saveBtn.addEventListener('click', () => {
    const rows = collectRows();
    console.log('Gespeichert:', rows);
    overlay.classList.remove('active');
});

let lineCount = 0;

extraFieldBtn.addEventListener('click', () => {
    lineCount++;

    const newRow = document.createElement('div');
    newRow.className = 'field-row';
    newRow.innerHTML = `
        <div class="field">
            <label>Person</label>
            <div class="person-dropdown-slot" id="personSlot${lineCount}"></div>
        </div>
        <div class="field">
            <label for="Notes${lineCount}">Notiz</label>
            <input type="text" id="Notes${lineCount}" placeholder="Optional">
        </div>
        <div class="field field-wide">
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

    const slot = newRow.querySelector(`#personSlot${lineCount}`);
    mountPersonDropdown(lineCount, slot);

    newRow.querySelector(`#Quote${lineCount}`).focus();
});

async function init() {
    await getAll();

    const firstRowSlot = document.getElementById('personSlot');
    mountPersonDropdown('', firstRowSlot);
}

init();