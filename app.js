import { Quote } from './Quote.js';
import { QuoteLine } from './QuoteLine.js';
import { Person } from './Person.js';
import { createPersonDropdown, getSelectedPersonId } from './Person_Dropdown.js';

const WORKER_URL = 'https://save-quotes.fuerst-felix-7ca.workers.dev';

export let Persons = [];
export let QuoteLines = [];
let Quotes = [];

let Teachers = [];
let Students = [];
let PersonsTemp = [];

let missedPersonIDs = [];
let missedLineIDs = [];
let missedQuoteIDs = [];

let activePersonIDs = [];

export let PersonCounter = null;
let LineCounter = null;
let QuoteCounter = null;

let lineCount = 0;

let Debug = false;

const personDropdowns = new Map();

let overlay = null;
let openBtn = null;
let closeXBtn = null;
let saveBtn = null;
let saveAllBtn = null;
let extraFieldBtn = null;
let resetBtn = null;
let removeLineBtn = null;
let ToggleDebugBtn = null;

await init();

async function loadRoute(route) {
    const response = await fetch(`${WORKER_URL}/${route}`);

    if (!response.ok) {
        throw new Error(`Fehler beim Laden von ${route}: ${response.status}`);
    }

    const text = await response.text();

    return text.trim() ? JSON.parse(text) : [];
}

function formatArray(array) {
    return "[\n" + array.map(obj => JSON.stringify(obj)).join(",\n") + "\n]";
}

async function saveRoute(route, array) {
    const response = await fetch(`${WORKER_URL}/${route}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: formatArray(array),
    });

    if (!response.ok) {
        throw new Error(`Fehler beim Speichern von ${route}: ${response.status}`);
    }
}

export async function uploadAvatar(file, filename) {
    const response = await fetch(`${WORKER_URL}/Pics/${encodeURIComponent(filename)}`, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
    });

    if (!response.ok) {
        throw new Error(`Fehler beim Hochladen von ${filename}: ${response.status}`);
    }

    return `${WORKER_URL}/Pics/${encodeURIComponent(filename)}`;
}

async function getAll() {
    const [personsRaw, quoteLinesRaw, quotesRaw] = await Promise.all([
        loadRoute("Persons"),
        loadRoute("QuoteLines"),
        loadRoute("Quotes"),
    ]);

    Persons = (personsRaw || []).map(p => Person.fromJSON(p));
    PersonCounter = Persons.length;
    QuoteLines = (quoteLinesRaw || []).map(z => QuoteLine.fromJSON(z));
    LineCounter = QuoteLines.length;
    Quotes = (quotesRaw || []).map(q => Quote.fromJSON(q));
    QuoteCounter = Quotes.length;
}

export async function savePersons() {
    Persons.sort((a, b) => a.getID() - b.getID());
    await saveRoute("Persons", Persons);
}

async function saveLines() {
    QuoteLines.sort((a, b) => a.getID() - b.getID());
    await saveRoute("QuoteLines", QuoteLines);
}

async function saveQuotes() {
    Quotes.sort((a, b) => a.getID() - b.getID());
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

        if (!notesField.value && contextField.value) {
            lines.push(new QuoteLine(createLineID(), getSelectedPersonId(dropdown), `"${quoteField.value}"`, notesField.value, `(${contextField.value})`));
        } else if (!contextField.value && notesField.value){
            lines.push(new QuoteLine(createLineID(), getSelectedPersonId(dropdown), `"${quoteField.value}"`, `(${notesField.value})`, contextField.value));
        } else if (!notesField.value && !contextField.value){
            lines.push(new QuoteLine(createLineID(), getSelectedPersonId(dropdown), `"${quoteField.value}"`));
        } else {
            lines.push(new QuoteLine(createLineID(), getSelectedPersonId(dropdown), `"${quoteField.value}"`, `(${notesField.value})`, `(${contextField.value})`));
        }

        
    }

    return lines;
}

function resetPopup(){
    lineCount = 0;
    document.getElementById("quote-popup").innerHTML = `
        <h2>Neues Zitat</h2>

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
    personDropdowns.clear();
    startUp();
    addLine();
}

function fullReset(){
    document.getElementById("Collapsibles").innerHTML = ``;
    resetPopup();
    startUp();
    renderCollapsibles();
}

function addLine(){
    const newLine = document.createElement('div');
    newLine.className = 'field-line field-line-quote';
    newLine.id = `field-line${lineCount}`
    newLine.innerHTML = `
        <div class="field field-person">
            <label>Person</label>
            <div class="person-dropdown-slot" id="personSlot${lineCount}"></div>
        </div>
        <div class="field field-notes">
            <label for="Notes${lineCount}">Notiz</label>
            <textarea rows="1" id="Notes${lineCount}" placeholder="Optional"></textarea>
        </div>
        <div class="field field-quote">
            <label for="Quote${lineCount}">Zitat</label>
            <textarea rows="1" id="Quote${lineCount}"></textarea>
        </div>
        <div class="field field-context">
            <label for="Context${lineCount}">Kontext</label>
            <textarea rows="1" id="Context${lineCount}" placeholder="Optional"></textarea>
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
    const suffix = Array.from(personDropdowns.keys());
    personDropdowns.delete(suffix[suffix.length - 1])
    lineCount--;
}

function handleOpenClick() {
    overlay.classList.add('active');
}

function handleCloseClick() {
    overlay.classList.remove('active');
}

function handleOverlayClick(event) {
    if (event.target === overlay) {
        overlay.classList.remove('active');
    }
}

function handleSaveClick() {
    const lines = collectLines();
    let ids = [];
    for (let i of lines){
        QuoteLines.push(i);
        ids.push(i.getID());
    }
    saveLines();
    Quotes.push(new Quote(createQuoteID(), ids));
    saveQuotes();
    overlay.classList.remove('active');
    saveAll();
    fullReset();
}

function handleSaveAllClick() {
    saveAll();
}

function handleResetClick() {
    resetPopup();
}

function handleExtraFieldClick() {
    addLine();
}

function handleRemoveLineClick() {
    removeLastLine();
}

function handeToggleDebugClick(){
    Debug = !Debug;

    renderCollapsibles();
}

function startUp(){
    overlay = document.getElementById('overlay');
    openBtn = document.getElementById('openBtn');
    closeXBtn = document.getElementById('closeXBtn');
    saveBtn = document.getElementById('saveBtn');
    saveAllBtn = document.getElementById('saveAllBtn');
    extraFieldBtn = document.getElementById('extraFieldBtn');
    resetBtn = document.getElementById("resetBtn");
    removeLineBtn = document.getElementById("removeLineBtn");
    ToggleDebugBtn = document.getElementById("ToggleDebug");

    openBtn.removeEventListener('click', handleOpenClick);
    openBtn.addEventListener('click', handleOpenClick);

    closeXBtn.removeEventListener('click', handleCloseClick);
    closeXBtn.addEventListener('click', handleCloseClick);

    overlay.removeEventListener('click', handleOverlayClick);
    overlay.addEventListener('click', handleOverlayClick);

    saveBtn.removeEventListener('click', handleSaveClick);
    saveBtn.addEventListener('click', handleSaveClick);

    saveAllBtn.removeEventListener('click', handleSaveAllClick);
    saveAllBtn.addEventListener('click', handleSaveAllClick);

    resetBtn.removeEventListener('click', handleResetClick);
    resetBtn.addEventListener('click', handleResetClick);

    extraFieldBtn.removeEventListener('click', handleExtraFieldClick);
    extraFieldBtn.addEventListener('click', handleExtraFieldClick);

    removeLineBtn.removeEventListener('click', handleRemoveLineClick);
    removeLineBtn.addEventListener('click', handleRemoveLineClick);

    ToggleDebugBtn.removeEventListener('click', handeToggleDebugClick);
    ToggleDebugBtn.addEventListener('click', handeToggleDebugClick);

    replaceDuplicateIDs();
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

function findMissedIDs(){
    missedPersonIDs = [];
    missedLineIDs = [];
    missedQuoteIDs = [];

    const p = Persons.length + 1;
    const l = QuoteLines.length + 1;
    const q = Quotes.length + 1;

    for (let i = 1; i <= p; i++) {
        let found = false;
        for (let j = 0; j < p - 1; j++) {
            if (Persons[j].getID() == i) {
                found = true;
                break;
            }
        }

        if (!found)
            missedPersonIDs.push(i);
    }

    for (let i = 1; i <= l; i++) {
        let found = false;
        for (let j = 0; j < l - 1; j++) {
            if (QuoteLines[j].getID() == i) {
                found = true;
                break;
            }
        }

        if (!found)
            missedLineIDs.push(i);
    }

    for (let i = 1; i <= q; i++) {
        let found = false;
        for (let j = 0; j < q - 1; j++) {
            if (Quotes[j].getID() == i) {
                found = true;
                break;
            }
        }

        if (!found)
            missedQuoteIDs.push(i);
    }

}

function replaceDuplicateIDs(){
    let pm = [];
    let lm = [];
    let qm = [];

    const p = Persons.length + 1;
    const l = QuoteLines.length + 1;
    const q = Quotes.length + 1;

    for (let i = 1; i <= p; i++) {
        for (let j = 0; j < p - 1; j++) {
            if (Persons[j].getID() == i) {
                pm.push(i);
            }
        }

        if (pm.length > 1){
            for (let pr of Persons){
                if (pr.getID() == pm[pm.length - 1]){
                    pr.changeID(createPersonID());
                    for (let lns of QuoteLines){
                        if (lns.getPID() == pm[pm.length - 1]){
                            lns.changePID(pr.getID());
                        }
                    }
                }
            }
        }
    }

    for (let i = 1; i <= l; i++) {
        for (let j = 0; j < l - 1; j++) {
            if (QuoteLines[j].getID() == i) {
                lm.push(i);
            }
        }

        if (lm.length > 1){
            for (let ln of QuoteLines){
                if (ln.getID() == lm[lm.length - 1]){
                    ln.changeID(createLineID());
                    for (let qts of Quotes){
                        if (qts.getLineIDs().includes(lm[lm.length - 1])){
                            const newLineIDs = qts.getLineIDs().map(id => id === lm[lm.length - 1] ? ln.getID() : id);
                            qts.changeLineIDs(newLineIDs);
                        }
                    }
                }
            }
        }
    }

    for (let i = 1; i <= q; i++) {
        for (let j = 0; j < q - 1; j++) {
            if (Quotes[j].getID() == i) {
                qm.push(i);
            }
        }

        if (qm.length > 1){
            for (let qt of Quotes){
                if (qt.getID() == qm[qm.length - 1]){
                    qt.changeID(createQuoteID());
                }
            }
        }
    }

    saveAll();
}

function createLineID(){
    findMissedIDs();
    if (missedLineIDs.length > 0){
        return missedLineIDs.shift();
    } else {
        LineCounter ++;
        return LineCounter;
    }
}

function createQuoteID(){
    findMissedIDs();
    if (missedQuoteIDs.length > 0){
        return missedQuoteIDs.shift();
    } else {
        QuoteCounter ++;
        return QuoteCounter;
    }
}

export function createPersonID(){
    findMissedIDs();
    if (missedPersonIDs.length > 0){
        return missedPersonIDs.shift();
    } else {
        PersonCounter ++;
        return PersonCounter;
    }
}

function clearCollapsibles(){
    document.getElementById("TeacherCollapsibles").innerHTML = ''
    document.getElementById("StudentCollapsibles").innerHTML = ''
}

function renderCollapsibles(){
    Teachers = Persons.filter(p => p.getTag() === "Teacher");
    Students = Persons.filter(p => p.getTag() === "Student");

    Teachers = Teachers.sort((a, b) => a.getName().localeCompare(b.getLastName()));
    Students = Students.sort((a, b) => a.getName().localeCompare(b.getLastName()));

    Persons = []
    Persons.concat(Teachers, Students);
    
    let colls;
    clearCollapsibles();
    for (let h of Persons){
        if (h.getTag() == "Teacher"){
            colls = document.getElementById("TeacherCollapsibles");
        } else if (h.getTag() == "Student"){
            colls = document.getElementById("StudentCollapsibles");
        }
        const newColl = document.createElement("div");
        const PID = h.getID();
        const PPic = h.getSrc();
        const PName = h.getName();
        const QCOunt = collectQuotes(PID).length;
        newColl.id = `Collapsible${PID}`;
        newColl.className = "CollDiv"
        newColl.dataset.pid = PID;
        if (Debug){
            newColl.innerHTML = `
                <button type="button" class="collapsible">
                    <img src="${PPic}" height="50">
                    <p class="name">ID: ${PID} ${PName}</p>
                    <p class="quoteCount">${QCOunt}</p>
                </button>
                <div class="content" id="quotes${PID}"></div>
            `;
        } else {
            newColl.innerHTML = `
                <button type="button" class="collapsible">
                    <img src="${PPic}" height="50">
                    <p class="name">${PName}</p>
                    <p class="quoteCount">${QCOunt}</p>
                </button>
                <div class="content" id="quotes${PID}"></div>
            `;
        }

        colls.append(newColl);
        
        const content = document.getElementById(`quotes${PID}`)
        let quotesDone = 0;
        for (let quotes of collectQuotes(PID)){
            quotesDone ++;
            const newQuote = document.createElement("div");
            const lines = quotes.getLines();
            let tempQuotes = "";
            if (Debug){
                if (lines.length > 1){
                    tempQuotes += `<p>QuoteID: ${quotes.getID()}</p>`
                    for (let lins of lines){
                        tempQuotes += `<p>LineID: ${lins.getID()} Person: ${lins.getPerson().getName()} Text: ${lins.assembleMultiple()}</p>`
                    }
                    newQuote.innerHTML = tempQuotes;
                } else{
                    newQuote.innerHTML = `
                        <p>QuoteID: ${quotes.getID()}</p>
                        <p>LineID: ${lines[0].getID()} Person: ${lines[0].getPerson().getName()} Text: ${lines[0].assemble()}</p>
                    `;
                }                
                
                if (quotesDone != collectQuotes(PID).length){
                    newQuote.innerHTML += `<hr>`
                }
            } else {
                if (lines.length > 1){
                    for (let lins of lines){
                        tempQuotes += `<p>${lins.getPerson().getName()} ${lins.assembleMultiple()}</p>`
                    }
                    newQuote.innerHTML = tempQuotes;
                } else{
                    newQuote.innerHTML = `
                        <p>${lines[0].assemble()}</p>
                    `;
                }                
                
                if (quotesDone != collectQuotes(PID).length){
                    newQuote.innerHTML += `<hr>`
                }
            }
            content.appendChild(newQuote);
        }

        if (activePersonIDs.includes(String(PID))){
            newColl.querySelector(".collapsible").classList.add("active");
            content.classList.add("no-transition");
            content.style.maxHeight = content.scrollHeight + "px";
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    content.classList.remove("no-transition");
                });
            });
        }
    }

    var coll = document.getElementsByClassName("collapsible");

    for (let i of coll) {
        i.addEventListener("click", function() {
            if (!this.classList.contains("active")){
                activePersonIDs.push(this.closest(".CollDiv").dataset.pid);
            } else {
                const index = activePersonIDs.indexOf(this.closest(".CollDiv").dataset.pid)
                if (index > -1){
                    activePersonIDs.splice(index, 1)
                }
            }
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight){
            content.style.maxHeight = null;
            } else {
            content.style.maxHeight = content.scrollHeight + "px";
            }
        });
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

addLine();
startUp();
renderCollapsibles();