import { Quote } from './Quote.js';
import { QuoteLine } from './QuoteLine.js';
import { Person } from './Person.js';
import { createPersonDropdown, getSelectedPersonId } from './Person_Dropdown.js';
import { createPersonID } from './Person_Popup.js';

const WORKER_URL = 'https://save-quotes.fuerst-felix-7ca.workers.dev';

export let Persons = [];
let QuoteLines = [];
let Quotes = [];

let lineCount = 0;

const personDropdowns = new Map();

let overlay = null;
let openBtn = null;
let closeXBtn = null;
let saveBtn = null;
let extraFieldBtn = null;
let resetBtn = null;
let avatarInput = null;

let DemoBtn = null;

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

export async function savePersons() {
    await saveRoute("Persons", Persons);
}

async function saveLines() {
    await saveRoute("QuoteLines", QuoteLines);
}

async function saveQuotes() {
    await saveRoute("Quotes", Quotes);
}

async function saveAll() {
    await Promise.all([
        savePersons(),
        saveLines(),
        saveQuotes(),
    ]);
}

function mountPersonDropdown(idSuffix, slotElement) {
    const dropdown = createPersonDropdown(idSuffix, Persons);
    slotElement.appendChild(dropdown);
    personDropdowns.set(idSuffix, dropdown);
}

function collectLines() {
    const lines = [];

    for (const suffix of personDropdowns.keys()) {
        const dropdown = personDropdowns.get(suffix);
        const notesField = document.getElementById(`Notes${suffix}`);
        const quoteField = document.getElementById(`Quote${suffix}`);
        const contextField = document.getElementById(`Context${suffix}`);

        lines.push(new QuoteLine(createLineID(), getSelectedPersonId(dropdown), notesField.value, quoteField.value, contextField.value));
    }

    return lines;
}

function reset(){
    lineCount = 0;
    document.getElementById("quote-popup").innerHTML = `
        <h2>Neues Zitat</h2>

        <div class="field-line"></div>

        <div class="left-action">
            <button class="btn-seamless" id="extraFieldBtn">+ Weitere Zeile</button>
            <button class="btn-seamless" id="removeLineBtn">- Letzte Zeile entfernen</button>
        </div>

        <div class="quote-popup-footer">
            <button class="btn-secondary" id="resetBtn">Zurücksetzen</button>
            <button class="btn-secondary" id="closeXBtn" aria-label="Schließen">Abbrechen</button>
            <button class="btn-primary" id="saveBtn">Speichern</button>
        </div>
    `;
    startUp();
}

function addLine(){
    const newLine = document.createElement('div');
    newLine.classList = 'field-line field-line-quote';
    newLine.id = `field-line${lineCount}`
    newLine.innerHTML = `
        <div class="field field-person">
            <label>Person</label>
            <div class="person-dropdown-slot" id="personSlot${lineCount}"></div>
        </div>
        <div class="field field-notes">
            <label for="Notes${lineCount}">Notiz</label>
            <textarea lines="1" id="Notes${lineCount}" placeholder="Optional"></textarea>
        </div>
        <div class="field field-quote">
            <label for="Quote${lineCount}">Zitat</label>
            <textarea lines="1" id="Quote${lineCount}"></textarea>
        </div>
        <div class="field field-context">
            <label for="Context${lineCount}">Kontext</label>
            <textarea lines="1" id="Context${lineCount}" placeholder="Optional"></textarea>
        </div>
    `;

    const leftAction = document.querySelector('.left-action');
    leftAction.parentNode.insertBefore(newLine, leftAction);

    const slot = newLine.querySelector(`#personSlot${lineCount}`);
    mountPersonDropdown(lineCount, slot);

    newLine.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', () => autoResizeTextarea(textarea));
    });
    lineCount++;
}

function removeLastLine(){
    const lines = document.querySelectorAll(".field-line-quote");
    const lastLine = lines[lines.length - 1];
    if (!lastLine) return;
    if (lines.length == 1) return;
    lastLine.remove();
    lineCount--;
}

function startUp(){
    overlay = document.getElementById('overlay');
    openBtn = document.getElementById('openBtn');
    closeXBtn = document.getElementById('closeXBtn');
    saveBtn = document.getElementById('saveBtn');
    saveAllBtn = document.getElementById('saveAllBtn');
    extraFieldBtn = document.getElementById('extraFieldBtn');
    resetBtn = document.getElementById("resetBtn");
    avatarInput = document.getElementById("AvatarInput")
    DemoBtn = document.getElementById("DemoBtn");

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
        const lines = collectLines();
        let ids = [];
        for (let i of lines){
            QuoteLines.add(i);
            ids.add(i.getID());
        }
        saveLines();
        Quotes.add(new Quote(createQuoteID(), ids));
        saveQuotes();
    });

    saveAllBtn.addEventListener('click', () =>{
        saveAll();
    })

    resetBtn.addEventListener('click', () => {
        reset();
    })

    extraFieldBtn.addEventListener('click', () => {
        addLine();
    });

    removeLineBtn.addEventListener('click', () => {
        removeLastLine();
    })

    DemoBtn.addEventListener('click', () => {
        Persons.push(new Person(createPersonID(), "Klumpner", "Lehrer", "Default", "Herr"));
        Persons.push(new Person(createPersonID(), "Dollinger", "Lehrer", "Default", "Herr"));
        Persons.push(new Person(createPersonID(), "Paula", "Schüler", "Default", null, "Jakob"));
        Persons.push(new Person(createPersonID(), "Fürst", "Schüler", "Default", null , "Felix"));

        QuoteLines.push(new QuoteLine(createLineID(), Persons[1].getID(), `„Das Problem ist, alles was illegal ist, ist eben nicht legal.“`));
        QuoteLines.push(new QuoteLine(createLineID(), Persons[1].getID(), `„Manche hatten Schmerzen, haben wahrscheinlich Schläge abbekommen…“`, "(lächelnd)", "(Rowdies beim Public Viewing)"));
        Quotes.push(new Quote(createQuoteID(), [QuoteLines[1].getID()]));
        Quotes.push(new Quote(createQuoteID(), [QuoteLines[2].getID()]));

        QuoteLines.push(new QuoteLine(createLineID(), Persons[2].getID(), `"Wer hatte den Hurensohn"`, null, "(meinte einen Post, der in einem Referat gezeigt wurde)"));
        QuoteLines.push(new QuoteLine(createLineID(), Persons[2].getID(), `"Ihr passt doch sowieso nicht auf!"`));
        Quotes.push(new Quote(createQuoteID(), [QuoteLines[3].getID()]));

        QuoteLines.push(new QuoteLine(createLineID(), Persons[4].getID(), ` „Aber wenn sie den KAL erst am Ende herausgeben, kann doch keiner aufpassen, weil wir so gespannt sind.“`));
        QuoteLines.push(new QuoteLine(createLineID(), Persons[4], `"MAAAAAAAN`, "*rennt genervt aus dem Raum*", "(nach Sanitätsdienst-Durchsage)"));
        Quotes.push(new Quote(createQuoteID(), [QuoteLines[6].getID()]));
        Quotes.push(new Quote(createQuoteID(), [QuoteLines[4].getID(), QuoteLines[5].getID()]));

        QuoteLines.push(new QuoteLine(createLineID(), Persons[3], `"Ich brauch mehr Spucke im Rachen"`));
        QuoteLines.push(new QuoteLine(createLineID(), Persons[3], `„Warum geh‘ ich überhaupt auf Toilette? Ich hab nicht mal mein Handy dabei!“`));
        Quotes.push(new Quote(createQuoteID(), [QuoteLines[7]]));
        Quotes.push(new Quote(createQuoteID(), [QuoteLines[8]]));
    })

    renderCollapsibles();
}

async function init() {
    try {
        await getAll();
    } catch (err) {
        console.error('Konnte Daten nicht laden:', err);
    }

}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

document.querySelectorAll('.field textarea').forEach(textarea => {
    textarea.addEventListener('input', () => autoResizeTextarea(textarea));
});

export function showImg(){
    const fileUploadInput = document.querySelector('.avatar-uploader');
    if (!fileUploadInput.value) {
        return;
    }
    const image = fileUploadInput.files[0];
    if (!image.type.includes('image')) {
        return alert('Nur Bild Dateien Erlaubt');
    }
    const fileReader = new FileReader();
    fileReader.readAsDataURL(image);
    fileReader.onload = (fileReaderEvent) => {
        const profilePicture = document.querySelector('.avatar-upload');
        profilePicture.style.backgroundImage = `url(${fileReaderEvent.target.result})`;
    }
}

function createLineID(){
    return QuoteLines.length() + 1;
}

function createQuoteID(){
    return Quotes.length() + 1;
}

function renderCollapsibles(){
    for (let h of Persons.length){
        const colls = document.getElementById("Collapsibles");
        const newColl = document.createElement("div");
        const PID = h.getID();
        const PPic = h.getSrc();
        const PName = h.getName();
        const QCOunt = collectQuotes(PID).length;
        newColl.id(`Collapsible${PID}`);
        newColl.innerHTML(`
            <button type="button" class="collapsible">
                <img src="${PPic}" height="50">
                <p class="name">${PName}</p>
                <p class="quoteCount">${QCOunt}</p>
            </button>
            <div class="content" id="quotes${PName}></div>
        `)
        
        const content = document.getElementById(`quotes${PName}`)
        for (let quotes of collectQuotes(PID)){
            const newQuote = document.createElement("div");
            const lines = quotes.getLines();
            const tempQuotes = "";
            if (lines.length > 1){
                for (let lins of lines){
                    tempQuotes += `<p>${Persons[PID].getName()} ${lins.assembleMultiple()}</p> <br>`
                }
                newQuote.innerHTML(tempQuotes);
            } else {
                newQuote.innerHTML(`
                    <p>${lines[1].assemble()}</p> <br>
                `);
            }
            
        }

        colls.insertBefore(newColl, document.getElementById("bottom"))
    }
}

function collectQuotes(personID){
    const TempQuotes = []
    for (let quote of Quotes) {
        const lines = quote.getLines();
        for (let LINES of lines){
            if (LINES.getPID() == personID && !TempQuotes.includes(quote)){
                TempQuotes.push(quote);
            }
        }
    }
    return TempQuotes;
}

init();
addLine();
startUp();