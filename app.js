import { Quote } from './Quote.js';
import { QuoteLine } from './QuoteLine.js';
import { Person } from './Person.js';
import { openPersonPopup } from './Person_Popup.js';
import { openQuotePopup } from './Quote_Popup.js';
import { openErrorPopup } from './Error_Popup.js'

const WORKER_URL = 'https://save-quotes.fuerst-felix-7ca.workers.dev';

export let Persons = [];
export let QuoteLines = [];
export let Quotes = [];

let Teachers = [];
let Students = [];
let Rest = [];

let missedPersonIDs = [];
let missedLineIDs = [];
let missedQuoteIDs = [];

let activePersonIDs = [];
let QuotesDone = [];

export let PersonCounter = null;
let LineCounter = null;
let QuoteCounter = null;

let Debug = false;
let Admin = false;

let newQuoteBtn = null;
let saveAllBtn = null;
let ToggleDebugBtn = null;
let DemoBtn = null;
let LoginBtn = null;
let AdminLoginBtn = null;
let PersonEditBtn = null;
let tempBtn = null;

let loginRequired = true;
const TOKEN_KEY = "quotesToken";
let Token = localStorage.getItem(TOKEN_KEY);
let loginSuccessful = Token !== null;
const ADMIN_TOKEN_KEY = "adminTOken";
let adminToken = localStorage.getItem(ADMIN_TOKEN_KEY)
let adminLoginSuccessful = adminToken !== null;

const imageCache = new Map();
const PLACEHOLDER_URL = "./assets/Portrait_Placeholder.png";
const WORKER_PICS_PREFIX = `${WORKER_URL}/Pics/`;

function isWorkerImage(picUrl) {
    return typeof picUrl === "string" && picUrl.startsWith(WORKER_PICS_PREFIX);
}

async function preloadImage(picUrl) {
    if (!isWorkerImage(picUrl) || imageCache.has(picUrl)) return;

    const response = await fetch(picUrl, {
        headers: { "Authorization": `Bearer ${Token}` }
    });

    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        location.reload();
    }

    if (!response.ok) {
        throw new Error(`Fehler beim Laden von ${picUrl}: ${response.status}`);
    }

    const blob = await response.blob();
    imageCache.set(picUrl, URL.createObjectURL(blob));
}

export async function preloadAllImages(persons) {
    const results = await Promise.allSettled(persons.map(p => preloadImage(p.getSrc())));
    results
        .filter(r => r.status === "rejected")
        .forEach(r => console.error(r.reason));
}

export function resolveImageUrl(picUrl) {
    if (!isWorkerImage(picUrl)) return picUrl;
    return imageCache.get(picUrl) ?? PLACEHOLDER_URL;
}

export function cacheUploadedImage(picUrl, file) {
    const old = imageCache.get(picUrl);
    if (old) URL.revokeObjectURL(old);
    imageCache.set(picUrl, URL.createObjectURL(file));
}

async function loadRoute(route) {
    const response = await fetch(`${WORKER_URL}/${route}`,{
        headers: {
            "Authorization": `Bearer ${Token}`
        }
    });

    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        location.reload();
    }

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
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Token}`
         },
        body: formatArray(array),
    });

    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        location.reload();
    }

    if (!response.ok) {
        throw new Error(`Fehler beim Speichern von ${route}: ${response.status}`);
    }
}

export async function uploadAvatar(file, filename) {
    const response = await fetch(`${WORKER_URL}/Pics/${encodeURIComponent(filename)}`, {
        method: "PUT",
        headers: { 
            "Content-Type": file.type,
            "Authorization": `Bearer ${Token}`
        },
        body: file,
    });

    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        location.reload();
    }

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
    PersonCounter = Persons.reduce((max, p) => Math.max(max, p.getID()), 0) + 1;
    QuoteLines = (quoteLinesRaw || []).map(z => QuoteLine.fromJSON(z));
    LineCounter = QuoteLines.reduce((max, l) => Math.max(max, l.getID()), 0) + 1;
    Quotes = (quotesRaw || []).map(q => Quote.fromJSON(q));
    QuoteCounter = Quotes.reduce((max, q) => Math.max(max, q.getID()), 0) + 1;

    console.log("Daten geladen:", { Persons, QuoteLines, Quotes });
}

async function getLoginEnabled() {
    let response;
    try {
        response = await fetch(`${WORKER_URL}/LoginEnabled`, {
            method: "GET"
        });
    } catch (err) {
        console.error('Fehler: ', err)
        return
    }

    loginRequired = (await response.json()).enabled;
}

export async function savePersons() {
    Persons.sort((a, b) => a.getID() - b.getID());
    await saveRoute("Persons", Persons);
}

export async function saveLines() {
    QuoteLines.sort((a, b) => a.getID() - b.getID());
    await saveRoute("QuoteLines", QuoteLines);
}

export async function saveQuotes() {
    Quotes.sort((a, b) => a.getID() - b.getID());
    await saveRoute("Quotes", Quotes);
}

export async function saveAll() {
    await Promise.all([
        savePersons(),
        saveLines(),
        saveQuotes(),
    ]);
}

function handleOpenClick() {
    openQuotePopup();
}

async function handleSaveAllClick() {
    try{
        await saveAll();
    } catch (err){
        console.error(err);
    }
}

function handeToggleDebugClick(){
    Debug = !Debug;

    renderCollapsibles();
}

async function handleAdminLoginClick(){
    const pwd = document.getElementById("password").value;
    const response = await fetch(`${WORKER_URL}/Admin`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: pwd }),
    });


    if (response.ok) {
        Token = (await response.json()).token;
        localStorage.setItem(ADMIN_TOKEN_KEY, Token);
        adminLoginSuccessful = true;
        await init();
        switchState();
        startUp();
        renderCollapsibles();
    } else {
        if (document.getElementById("AdminLoginErr") != null){
            document.getElementById("AdminLoginErr").remove();
        }
        let Fehlermeldung = document.createElement("p");
        Fehlermeldung.className = "AdminLoginErr";
        Fehlermeldung.id = `AdminLoginErr`
        Fehlermeldung.innerHTML = "Das hat nicht funktioniert. Versuche es entweder nochmal oder wende dich an Felix.";
        document.getElementById("AdminLogin").append(Fehlermeldung);
        throw new Error(`Fehler beim Login: ${response.status}`);
    }
}

/*
function handleDemoClick() {
    Persons = []
    QuoteLines = []
    Quotes = []

    Persons.push(new Person(createPersonID(), "Klumpner", "Teacher", "Default", "Herr"));
    Persons.push(new Person(createPersonID(), "Dollinger", "Teacher", "Default", "Herr"));
    Persons.push(new Person(createPersonID(), "Paula", "Student", "Default", null, "Jakob"));
    Persons.push(new Person(createPersonID(), "Fürst", "Student", "Default", null , "Felix"));

    QuoteLines.push(new QuoteLine(createLineID(), Persons[3].getID(), ` „Aber wenn sie den KAL erst am Ende herausgeben, kann doch keiner aufpassen, weil wir so gespannt sind.“`));
    QuoteLines.push(new QuoteLine(createLineID(), Persons[3].getID(), `"MAAAAAAAN"`, "*rennt genervt aus dem Raum*", "(nach Sanitätsdienst-Durchsage)"));
    

    QuoteLines.push(new QuoteLine(createLineID(), Persons[2].getID(), `"Ich brauch mehr Spucke im Rachen"`));
    QuoteLines.push(new QuoteLine(createLineID(), Persons[2].getID(), `„Warum geh‘ ich überhaupt auf Toilette? Ich hab nicht mal mein Handy dabei!“`));
    
    QuoteLines.push(new QuoteLine(createLineID(), Persons[0].getID(), `„Das Problem ist, alles was illegal ist, ist eben nicht legal.“`));
    QuoteLines.push(new QuoteLine(createLineID(), Persons[0].getID(), `„Manche hatten Schmerzen, haben wahrscheinlich Schläge abbekommen…“`, "(lächelnd)", "(Rowdies beim Public Viewing)"));

    QuoteLines.push(new QuoteLine(createLineID(), Persons[1].getID(), `"Wer hatte den Hurensohn"`, null, "(meinte einen Post, der in einem Referat gezeigt wurde)"));
    QuoteLines.push(new QuoteLine(createLineID(), Persons[1].getID(), `"Ihr passt doch sowieso nicht auf!"`));

    Quotes.push(new Quote(createQuoteID(), [QuoteLines[0].getID(), QuoteLines[7].getID()]));
    Quotes.push(new Quote(createQuoteID(), [QuoteLines[1].getID()]));
    Quotes.push(new Quote(createQuoteID(), [QuoteLines[2].getID()]));
    Quotes.push(new Quote(createQuoteID(), [QuoteLines[3].getID()]));
    Quotes.push(new Quote(createQuoteID(), [QuoteLines[4].getID()]));    
    Quotes.push(new Quote(createQuoteID(), [QuoteLines[5].getID()]));
    Quotes.push(new Quote(createQuoteID(), [QuoteLines[6].getID()]));

    renderCollapsibles();
}
*/

function handleTempClick(){
    openErrorPopup("Test");
}

async function handleLoginClick() {
    const pwd = document.getElementById("password").value;
    const response = await fetch(`${WORKER_URL}/Login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: pwd }),
    });


    if (response.ok) {
        Token = (await response.json()).token;
        localStorage.setItem(TOKEN_KEY, Token);
        LoginSuccessful = true;
        await init();
        switchState();
        startUp();
        renderCollapsibles();
    } else {
        if (document.getElementById("LoginErr") != null){
            document.getElementById("LoginErr").remove();
        }
        let Fehlermeldung = document.createElement("p");
        Fehlermeldung.className = "LoginErr";
        Fehlermeldung.id = `LoginErr`
        Fehlermeldung.innerHTML = "Das hat nicht funktioniert. Versuche es entweder nochmal oder wende dich an Felix.";
        document.getElementById("login").append(Fehlermeldung);
        throw new Error(`Fehler beim Login: ${response.status}`);
    }
}

function switchState(){
    document.getElementById("loggedIn").classList.toggle("active");
    if (Admin){
        document.getElementById("AdminLogin").classList.toggle("active");
    } else {
        document.getElementById("login").classList.toggle("active");
    }
}

function startUp(){
    newQuoteBtn = document.getElementById('newQuoteBtn');
    saveAllBtn = document.getElementById('saveAllBtn');
    ToggleDebugBtn = document.getElementById("ToggleDebug");
    //DemoBtn = document.getElementById("DemoBtn");
    if (!Admin){
        tempBtn = document.getElementById("tempBtn");
        tempBtn.removeEventListener('click', handleTempClick)
        tempBtn.addEventListener('click', handleTempClick)
    }

    if (Admin){
        const ToggleAdminBtn = document.getElementById("ToggleAdmin");
        ToggleAdminBtn.removeEventListener('click', () => {Admin = !Admin});
        ToggleAdminBtn.addEventListener('click', () => {Admin = !Admin});
    }

    newQuoteBtn.removeEventListener('click', handleOpenClick);
    newQuoteBtn.addEventListener('click', handleOpenClick);

    saveAllBtn.removeEventListener('click', handleSaveAllClick);
    saveAllBtn.addEventListener('click', handleSaveAllClick);

    ToggleDebugBtn.removeEventListener('click', handeToggleDebugClick);
    ToggleDebugBtn.addEventListener('click', handeToggleDebugClick);

    //DemoBtn.removeEventListener('click', handleDemoClick);
    //DemoBtn.addEventListener('click', handleDemoClick);

}

async function init() {
    try {
        await getAll();
    } catch (err) {
        console.error('Konnte Daten nicht laden:', err);
    }

}

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

    const p = Persons.length;
    const l = QuoteLines.length;
    const q = Quotes.length;

    for (let i = 1; i <= p; i++) {
        let found = false;
        for (let j = 0; j < p; j++) {
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
        for (let j = 0; j < l; j++) {
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
        for (let j = 0; j < q; j++) {
            if (Quotes[j].getID() == i) {
                found = true;
                break;
            }
        }

        if (!found)
            missedQuoteIDs.push(i);
    }
    console.log("Missed Person IDs:", missedPersonIDs);
    console.log("Missed Line IDs:", missedLineIDs);
    console.log("Missed Quote IDs:", missedQuoteIDs);
}

export function createLineID(){
    findMissedIDs();
    if (missedLineIDs.length > 0){
        return missedLineIDs.shift();
    } else {
        LineCounter ++;
        return LineCounter;
    }
}

export function createQuoteID(){
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
    document.getElementById("categoryThingy").innerHTML = `
        <div class="category">
            <p class="category-label">Lehrende</p>
            <div id="TeacherCollapsibles"></div>
        </div>

        <div class="category">
            <p class="category-label">Schüler*innen</p>
            <div id="StudentCollapsibles"></div>
        </div>
    `;
}

function handlePersonEditClick(event){
    event.stopPropagation();
    openPersonPopup("Person bearbeiten", Persons.find(p => event.currentTarget.closest('.collapsible').dataset.pid == PersonEditBtn.id.replace("personEditBtn", "")));
}

function handleMouseEnter(element) {
    element.style.backgroundColor = '#ccc';
    if (Debug){
        element.innerHTML = `
            <img src="${element.dataset.PPic}" height="50">
            <p class="name">ID: ${element.dataset.pid} ${element.dataset.name}</p>
            <img class="btn-seamless" id="personEditBtn${element.dataset.pid}" src="https://cdn-icons-png.flaticon.com/512/1250/1250925.png" height="10" style="margin-left: 10px" alt="Bearbeiten">
            <p class="quoteCount">${element.dataset.qcount}</p>
            <img src="https://cdn-icons-png.flaticon.com/512/54/54817.png" height="10" style="margin-left: 10px; transform: rotate(${element.classList.contains("active") ? "0deg" : "180deg"})" id="arrow${element.dataset.pid}">
        `;
    } else {
        element.innerHTML = `
            <img src="${element.dataset.PPic}" height="50">
            <p class="name">${element.dataset.name}</p>
            <img class="btn-seamless" id="personEditBtn${element.dataset.pid}" src="https://cdn-icons-png.flaticon.com/512/1250/1250925.png" height="10" style="margin-left: 10px" alt="Bearbeiten">
            <p class="quoteCount">${element.dataset.qcount}</p>
            <img src="https://cdn-icons-png.flaticon.com/512/54/54817.png" height="10" style="margin-left: 10px; transform: rotate(${element.classList.contains("active") ? "0deg" : "180deg"})" id="arrow${element.dataset.pid}">
        `;
    }

    PersonEditBtn = document.getElementById(`personEditBtn${element.dataset.pid}`);
    PersonEditBtn.addEventListener("click", handlePersonEditClick);

}

function handleMouseLeave(element) {
    element.style.backgroundColor = '#eee';
    if (PersonEditBtn != null){
        PersonEditBtn.removeEventListener("click", handlePersonEditClick);
    }
    PersonEditBtn = null;
    if (Debug){
        element.innerHTML = `
            <img src="${element.dataset.PPic}" height="50">
            <p class="name">ID: ${element.dataset.pid} ${element.dataset.name}</p>
            <p class="quoteCount">${element.dataset.qcount}</p>
            <img src="https://cdn-icons-png.flaticon.com/512/54/54817.png" height="10" style="margin-left: 10px; transform: rotate(${element.classList.contains("active") ? "0deg" : "180deg"})" id="arrow${element.dataset.pid}">
        `;
    } else {
        element.innerHTML = `
            <img src="${element.dataset.PPic}" height="50">
            <p class="name">${element.dataset.name}</p>
            <p class="quoteCount">${element.dataset.qcount}</p>
            <img src="https://cdn-icons-png.flaticon.com/512/54/54817.png" height="10" style="margin-left: 10px; transform: rotate(${element.classList.contains("active") ? "0deg" : "180deg"})" id="arrow${element.dataset.pid}">
        `;
    }

}

export function renderCollapsibles(){
    Teachers = Persons.filter(p => p.getTag() === "Teacher");
    Students = Persons.filter(p => p.getTag() === "Student");
    Rest = Persons.filter(p => p.getTag() !== "Teacher" && p.getTag() !== "Student");

    Teachers = Teachers.sort((a, b) => a.getLastName().localeCompare(b.getLastName()));
    Students = Students.sort((a, b) => a.getLastName().localeCompare(b.getLastName()));

    Persons = []
    Persons = Persons.concat(Teachers, Students, Rest);
    
    let colls;
    clearCollapsibles();
    QuotesDone = [];
    for (let h of Persons){
        if (h.getTag() == "Teacher"){
            colls = document.getElementById("TeacherCollapsibles");
        } else if (h.getTag() == "Student"){
            colls = document.getElementById("StudentCollapsibles");
        } else {
            if (!h.isEinschub()){
                console.log("Person hat kein Tag: ", h);
            }
            continue;
        }
        
        const PID = h.getID();
        const PPic = resolveImageUrl(h.getSrc());
        const PName = h.getName();
        let hiddenCount = 0;
            for (let quts of collectQuotes(PID)){
                if (quts.isHidden()){
                    hiddenCount++;
                }
            }
        const QCOunt = collectQuotes(PID).length - hiddenCount;
        if (QCOunt <= 0) continue;
        const newColl = document.createElement("div");
        newColl.id = `FullCollapsible${PID}`;
        newColl.className = "CollDiv"
        if (Debug){
            if (Admin){
                newColl.innerHTML = `
                    <div class="collapsible" id="collapsible${PID}">
                        <img src="${PPic}" height="50">
                        <p class="name">ID: ${PID} ${PName}</p>
                        <p class="quoteCount">${QCOunt}</p>
                        <img src="https://cdn-icons-png.flaticon.com/512/54/54817.png" height="10" style="margin-left: 10px; transform: rotate(180deg)" id="arrow${PID}">
                    </div>
                    <div class="content" id="quotes${PID}"></div>
                `;
            } else {
                newColl.innerHTML = `
                    <div class="collapsible" id="collapsible${PID}">
                        <img src="${PPic}" height="50">
                        <p class="name">${PName}</p>
                        <p class="quoteCount">${QCOunt}</p>
                        <img src="https://cdn-icons-png.flaticon.com/512/54/54817.png" height="10" style="margin-left: 10px; transform: rotate(180deg)" id="arrow${PID}">
                    </div>
                    <div class="content" id="quotes${PID}"></div>
                `;
            }
        } else {
            newColl.innerHTML = `
                <div class="collapsible" id="collapsible${PID}">
                    <img src="${PPic}" height="50">
                    <p class="name">${PName}</p>
                    <p class="quoteCount">${QCOunt}</p>
                    <img src="https://cdn-icons-png.flaticon.com/512/54/54817.png" height="10" style="margin-left: 10px; transform: rotate(180deg)" id="arrow${PID}">
                </div>
                <div class="content" id="quotes${PID}"></div>
            `;
        }

        colls.append(newColl);

        const CollDiv = document.getElementById(`collapsible${PID}`);
        CollDiv.dataset.PPic = PPic;
        CollDiv.dataset.pid = PID;
        CollDiv.dataset.name = PName;
        CollDiv.dataset.qcount = QCOunt;

        document.getElementById(`collapsible${PID}`).addEventListener("mouseenter", () => handleMouseEnter(document.getElementById(`collapsible${PID}`)));
        document.getElementById(`collapsible${PID}`).addEventListener("mouseleave", () => handleMouseLeave(document.getElementById(`collapsible${PID}`)));

        const content = document.getElementById(`quotes${PID}`)
        let quotesDone = 0;
        let HiddenQuotes = [];
        for (let quotes of collectQuotes(PID)){
            if (quotes.isHidden()){
                HiddenQuotes.push(quotes);
                continue;
            }
            quotesDone ++;
            const newQuote = document.createElement("div");
            newQuote.id = `Quote${quotes.getID()}`
            const lines = quotes.getLines();
            let tempQuotes = "";
            if (Debug){
                if (Admin){
                    if (lines.length > 1){
                        tempQuotes += `<p>QuoteID: ${quotes.getID()}</p>`
                        for (let lins of lines){
                            if (lins.getPerson().isEinschub()){
                                tempQuotes += `<p>LineID: ${lins.getID()} Typ: Einschub Text: ${lins.assembleMultiple()}</p>`
                            } else {
                                tempQuotes += `<p>LineID: ${lins.getID()} Person: ${lins.getPerson().getName()} Text: ${lins.assembleMultiple()}</p>`
                            }
                        }
                        newQuote.innerHTML = tempQuotes;
                    } else{
                        newQuote.innerHTML = `
                            <p>QuoteID: ${quotes.getID()}</p>
                            <p>LineID: ${lines[0].getID()} Person: ${lines[0].getPerson().getName()} Text: ${lines[0].assemble()}</p>
                        `;
                    }    
                } else{ 
                    if (lines.length > 1){
                        tempQuotes += `<p>QuoteID: ${quotes.getID()}</p>`
                        for (let lins of lines){
                            if (lins.getPerson().isEinschub()){
                                tempQuotes += `<p>${lins.assembleMultiple()}</p>`
                            } else {
                                tempQuotes += `<p>${lins.getPerson().getName()}${lins.assembleMultiple()}</p>`
                            }
                        }
                        newQuote.innerHTML = tempQuotes;
                    } else{
                        newQuote.innerHTML = `
                            <p>QuoteID: ${quotes.getID()}</p>
                            <p>${lines[0].assemble()}</p>
                        `;
                    }
                }         
                
                if (quotesDone != collectQuotes(PID).length - hiddenCount){
                    newQuote.innerHTML += `<hr>`
                }

                if (!QuotesDone.includes(quotes)){
                    QuotesDone.push(quotes);
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

                if (!QuotesDone.includes(quotes)){
                    QuotesDone.push(quotes);
                }

                if (quotesDone != collectQuotes(PID).length){
                    newQuote.innerHTML += `<hr>`
                }
            }

            //newQuote.addEventListener('click', handleQuoteEditClick); Quote Popup to edit goes here

            content.appendChild(newQuote);
        }

        if (HiddenQuotes.length > 0 && Debug){
            const hiddenQuotesDiv = document.createElement("div");
            hiddenQuotesDiv.append(document.createElement("br"))
            const newP = document.createElement("p")
            newP.innerHTML = "<b>Hidden: </b>"
            hiddenQuotesDiv.append(newP)
            let hiddenQuotesDone = 0;
            for (let HQ of HiddenQuotes){
                let tempHidden = "";
                hiddenQuotesDone ++;
                const newHiddenQuote = document.createElement("div");
                newHiddenQuote.id = `Quote${HQ.getID()}`
                const lines = HQ.getLines();
                if (lines.length > 1){
                    tempHidden += `<p>QuoteID: ${HQ.getID()}</p>`
                    for (let lins of lines){
                        if (lins.getPerson().isEinschub()){
                            tempHidden += `<p>LineID: ${lins.getID()} Typ: Einschub Text: ${lins.assembleMultiple()}</p>`
                        } else {
                            tempHidden += `<p>LineID: ${lins.getID()} Person: ${lins.getPerson().getName()} Text: ${lins.assembleMultiple()}</p>`
                        }
                    }
                    newHiddenQuote.innerHTML = tempHidden;
                } else{
                    newHiddenQuote.innerHTML = `
                        <p>QuoteID: ${HQ.getID()}</p>
                        <p>LineID: ${lines[0].getID()} Person: ${lines[0].getPerson().getName()} Text: ${lines[0].assemble()}</p>
                    `;
                }                
                
                if (hiddenQuotesDone != HiddenQuotes.length){
                    newHiddenQuote.innerHTML += `<hr>`
                }

                if (!QuotesDone.includes(HQ)){
                    QuotesDone.push(HQ);
                }
                hiddenQuotesDiv.appendChild(newHiddenQuote);
            }

            content.appendChild(hiddenQuotesDiv)
        }

        if (HiddenQuotes.length > 0 && !Debug){
            for (let HQ of HiddenQuotes){
                QuotesDone.push(HQ);
            }
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

    if (QuotesDone.length != Quotes.length){
        const Unassigned = document.createElement("div");
        Unassigned.id = "Unassigned";
        Unassigned.className = "category"
        Unassigned.innerHTML += `
                <p class="category-label">Nicht zugeordnet:</p>
        `;
        document.getElementById("categoryThingy").appendChild(Unassigned);
        for (let missed of Quotes){
            if (!QuotesDone.includes(missed)){
                const newQuote = document.createElement("div");
                const lines = missed.getLines();
                let tempQuotes = "";
                if (missed.isHidden()){
                    continue;
                }
                if (Debug){
                    if (lines.length > 1){
                        tempQuotes += `<p>QuoteID: ${missed.getID()}</p>`
                        for (let lins of lines){
                            tempQuotes += `<p>LineID: ${lins.getID()} Person: ${lins.getPerson().getName()} Text: ${lins.assembleMultiple()}</p>`
                        }
                        newQuote.innerHTML = tempQuotes;
                    } else{
                        newQuote.innerHTML = `
                            <p>QuoteID: ${missed.getID()}</p>
                            <p>LineID: ${lines[0].getID()} Person: Unassigned Text: ${lines[0].assemble()}</p>
                        `;
                    }                
                    
                    newQuote.innerHTML += `<hr>`
                    

                } else {
                    if (lines.length > 1){
                        for (let lins of lines){
                            tempQuotes += `<p>Unassigned${lins.assembleMultiple()}</p>`
                        }
                        newQuote.innerHTML = tempQuotes;
                    } else{
                        newQuote.innerHTML = `
                            <p>${lines[0].assemble()}</p>
                        `;
                    }
                    
                    newQuote.innerHTML += `<hr>`;
                }
                Unassigned.appendChild(newQuote);
            }
        }
    }


    var coll = document.getElementsByClassName("collapsible");

    for (let i of coll) {
        i.addEventListener("click", function() {
            const arrow = document.getElementById(`arrow${this.closest(".collapsible").dataset.pid}`);
            if (!this.classList.contains("active")){
                activePersonIDs.push(this.closest(".collapsible").dataset.pid);
                arrow.style.transform = "rotate(0deg)";
            } else {
                const index = activePersonIDs.indexOf(this.closest(".collapsible").dataset.pid)
                if (index > -1){
                    activePersonIDs.splice(index, 1)
                }
                arrow.style.transform = "rotate(180deg)";
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

if (document.body.dataset.role == "Admin"){
    Admin = true;
} else {
    Admin = false;
}


if (Admin){
    AdminLoginBtn = document.getElementById("adminLoginBtn");
    AdminLoginBtn.addEventListener('click', handleAdminLoginClick);
} else{
    await getLoginEnabled()

    console.log("Login required:", loginRequired);
    console.log("Login successful:", loginSuccessful);

    if (loginRequired){
        LoginBtn = document.getElementById("loginBtn");
        LoginBtn.addEventListener('click', handleLoginClick);
    }
}
if (adminLoginSuccessful || loginSuccessful || !loginRequired){
    await init();
    renderCollapsibles();
    switchState();
    startUp();
    await preloadAllImages(Persons);
    renderCollapsibles();
}