import { Quote } from "./Quote.js";
import { createPersonDropdown, getSelectedPersonId } from "./Person_Dropdown.js";
import { openErrorPopup } from "./Error_Popup.js";
import { Quotes, createQuoteID, saveAll, renderCollapsibles, createLineID, QuoteLines, findPersonByID } from "./app.js";
import { QuoteLine } from "./QuoteLine.js";

let overlay = null;
let lineCount = 0;

const personDropdowns = new Map();

export function openQuotePopup(text = "Neues Zitat", quote = null) {
    if (document.querySelectorAll('.overlay').length > 0) {
        return;
    }
    lineCount = 0;
    personDropdowns.clear();

    overlay = document.createElement('div');
    overlay.className = 'overlay active';
    overlay.innerHTML = `
        <div class="quote-popup" id="quote-popup">
            <h2>${text}</h2>

            <div class="preview-container">
                <label for="preview">Vorschau:</label>
                <div class="preview" id="preview"></div>
            </div>

            <div class="left-action">
                <button class="btn-seamless" id="extraFieldBtn">+ Weitere Zeile</button>
                <button class="btn-seamless" id="removeLineBtn">- Letzte Zeile entfernen</button>
            </div>

            <div class="quote-popup-footer">
                <button class="btn-secondary" id="resetBtn">Zurücksetzen</button>
                <button class="btn-secondary" id="closeXBtn" aria-label="Schließen">Abbrechen</button>
                <button class="btn-primary" id="saveBtn">Speichern</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const extraFieldBtn = document.getElementById("extraFieldBtn");
    const removeLineBtn = document.getElementById("removeLineBtn");
    const resetBtn = document.getElementById("resetBtn");
    const cancelBtn = document.getElementById("closeXBtn");
    const saveBtn = document.getElementById("saveBtn");
    const quotePopup = document.getElementById("quote-popup");

    extraFieldBtn.addEventListener('click', () => {
        addLine();
        updatePreview();
    });

    removeLineBtn.addEventListener('click', () => {
        removeLastLine();
        updatePreview();
    });

    resetBtn.addEventListener('click', () => {
        reset();
        updatePreview();
    });

    cancelBtn.addEventListener('click', () => {
        closePopup();
    });

    saveBtn.addEventListener('click', async () => {
        const lines = collectLines();
        let ids = [];
        for (let i of lines){
            ids.push(i.getID());
        }
        Quotes.push(new Quote(createQuoteID(), ids, false));
        try {
            await saveAll();
            closePopup();
        } catch (err){
            console.error(err);
            openErrorPopup("Fehler beim Speichern: " + err)
        }
        renderCollapsibles();
    });

    quotePopup.addEventListener("personchange", (event) => {
        const line = event.target.closest(".field-line-quote");
        if (!line) return;

        const person = event.detail.person;
        line.dataset.type = (person && person.isEinschub()) ? "einschub" : "person";
        line.dataset.type == "einschub" ? (line.querySelector(".Quote-Label").textContent = "Einschub") : line.querySelector(".Quote-Label").textContent = "Zitat"
    })

    quote ? quote.getLines().forEach(line => {
        addLine(line);
    }) : addLine();

    updatePreview();
}

function closePopup() {
    overlay.remove();
}

function reset() {
    overlay.remove();
    openQuotePopup();
}

function mountPersonDropdown(idSuffix, slotElement, person = null) {
    const dropdown = createPersonDropdown(idSuffix);
    slotElement.appendChild(dropdown);
    personDropdowns.set(idSuffix, dropdown);
    person ? dropdown.selectPerson(person) : null ;
}

function collectLines(preview = false) {
    const lines = [];

    for (const suffix of personDropdowns.keys()) {
        const dropdown = personDropdowns.get(suffix);
        const beforeField = document.getElementById(`Before-Field-${suffix}`);
        const beforeSign = document.querySelector(`.toggle[data-location="before"]`).dataset.sign;
        const quoteField = document.getElementById(`Quote-Field-${suffix}`);
        const afterField = document.getElementById(`After-Field-${suffix}`);
        const afterSign = document.querySelector(`.toggle[data-location="after"]`).dataset.sign;

        let before;
        let quote;
        let after

        if (preview == false && getSelectedPersonId(dropdown) == null){
            console.log(preview, getSelectedPersonId(dropdown))
            openErrorPopup("Bitte wähle eine Person aus.");
            throw new Error("No Person selected")
        }
        
        if (getSelectedPersonId(dropdown) == 0){
            before = beforeField.value ? `${beforeSign == "(" ? ("(" + beforeField.value + ")") : ("*" + beforeField.value + "*")}` : null;
            quote = quoteField.value ? `(${quoteField.value})` : null;
            after = afterField.value ? `${afterSign == "(" ? ("(" + afterField.value + ")") : ("*" + afterField.value + "*")}` : null; 
        } else {
            before = beforeField.value ? `${beforeSign == "(" ? ("(" + beforeField.value + ")") : ("*" + beforeField.value + "*")}` : null;
            quote = quoteField.value ? `"${quoteField.value}"` : null;
            after = afterField.value ? `${afterSign == "(" ? ("(" + afterField.value + ")") : ("*" + afterField.value + "*")}` : null;
        }

        if (before == null && quote == null && after == null && preview == false){
            openErrorPopup("Bitte gib ein Zitat, Notizen oder Kontext an.");
            throw new Error("No Quote, Before or After")
        }

        const newLine = new QuoteLine(preview == false ? createLineID() : "0", getSelectedPersonId(dropdown), quote, before, after)
        if (preview == false){QuoteLines.push(newLine)};
        lines.push(newLine);
    }
    return lines;
}

function assembleQuote(){
    let lines = collectLines(true);
    let tempQuotes = "";
     if (lines.length > 1){
        for (let lins of lines){
            tempQuotes += `<p>${lins.getPerson() ? (lins.getPerson().getName() ? lins.getPerson().getName() + ": " : "") : ""}${assembleMultiple(lins).trim() ? assembleMultiple(lins).trim() : ""}</p>`
        }
    } else{
        tempQuotes += `<p>${assemble(lines[0]).trim() ? assemble(lines[0]).trim() : ""}</p>`;
    }
    return tempQuotes.replaceAll("<p>", "").replaceAll("</p>", "") == "" ? "<p>Keine Vorschau verfügbar</p>" : tempQuotes;
}

function assemble(line){
        let QuoteString = "";
        if (line.before != null){
            QuoteString += line.before + " ";
        }
        if (line.quote != null){
            QuoteString += line.quote;
        }
        if (line.after != null){
            QuoteString += " " + line.after;
        }

        return QuoteString;
    }

function assembleMultiple(line){
        let QuoteString = "";
        if (line.before != null && line.quote == null){
            QuoteString += line.before + " ";
        } else{
            QuoteString += " ";
        }
        
        if (line.quote != null){
            QuoteString += line.quote;
        }

        if (line.after != null){
            QuoteString += " " + line.after;
        }

        return QuoteString == "" ? null : QuoteString;
    }

export function updatePreview(){
    const preview = document.getElementById("preview");
    preview.innerHTML = assembleQuote();
}

function addLine(line = null){
    const newLine = document.getElementById("line-template").content.firstElementChild.cloneNode(true);

    newLine.id = `field-line-quote-${lineCount}`;
    newLine.querySelector(`#personSlot-PLACEHOLDER`).id = `personSlot${lineCount}`;
    newLine.querySelector('label[for="Before-PLACEHOLDER"]').htmlFor = `Before-Field-${lineCount}`;
    newLine.querySelector(`#Before-PLACEHOLDER`).id = `Before-Field-${lineCount}`;
    const beforeBtn = newLine.querySelector('.toggle[data-location="before"]');
    newLine.querySelector('label[for="Quote-PLACEHOLDER"]').htmlFor = `Quote-Field-${lineCount}`;
    newLine.querySelector(`#Quote-PLACEHOLDER`).id = `Quote-Field-${lineCount}`;
    newLine.querySelector('label[for="After-PLACEHOLDER"]').htmlFor = `After-Field-${lineCount}`;
    newLine.querySelector(`#After-PLACEHOLDER`).id = `After-Field-${lineCount}`;
    const afterBtn = newLine.querySelector('.toggle[data-location="after"]');

    const preview = overlay.querySelector('.preview-container');
    preview.parentNode.insertBefore(newLine, preview);

    const slot = newLine.querySelector(`#personSlot${lineCount}`);
    mountPersonDropdown(lineCount, slot, line ? line.getPerson() : null);

    const dropdown = newLine.querySelector(".person-dropdown")

    const personLabel = newLine.querySelector(".person-label")
    personLabel.addEventListener('click', () => {
        dropdown.dataset.lastId = getSelectedPersonId(dropdown) == "0" ? "" : getSelectedPersonId(dropdown)
        const lastPerson = findPersonByID(dropdown.dataset.lastId)
        dropdown.selectPerson(findPersonByID("0"));
        if (personLabel.innerHTML == "Person <b>↔</b> Einschub"){
            personLabel.innerHTML = "Einschub <b>↔</b> Person"
        } else {
            personLabel.innerHTML = "Person <b>↔</b> Einschub";
            personLabel.dispatchEvent(new CustomEvent("personchange", {
                bubbles: true,
                detail: { lastPerson }
            }))
            if (dropdown.dataset.lastId != ""){
                dropdown.selectPerson(findPersonByID(dropdown.dataset.lastId))
            } else {
                dropdown.querySelector(".person-dropdown-input").value = '';
                dropdown.dataset.selectedId = '';
                dropdown.querySelector('.person-dropdown-avatar').hidden = true;
                dropdown.updateInputWidth('');
            }
        }
    });

    beforeBtn.addEventListener('click', () => {
        beforeBtn.textContent = beforeBtn.dataset.sign === "(" ? "*" : "( )";
        beforeBtn.dataset.sign = beforeBtn.dataset.sign === "(" ? "*" : "(";
        updatePreview();
    });

    afterBtn.addEventListener('click', () => {
        afterBtn.textContent = afterBtn.dataset.sign === "(" ? "*" : "( )";
        afterBtn.dataset.sign = afterBtn.dataset.sign === "(" ? "*" : "(";
        updatePreview();
    });

    newLine.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', () => {
            autoResizeTextarea(textarea)
            updatePreview();
        })
    });

    if (line != null){
        if (line.getBefore() != null){
            document.getElementById(`Before-Field-${lineCount}`).value = line.getBefore();
            autoResizeTextarea(document.getElementById(`Before-Field-${lineCount}`));
        } else {
            document.getElementById(`Before-Field-${lineCount}`).value = "";
        }

        if (line.getQuote() != null){
            document.getElementById(`Quote-Field-${lineCount}`).value = line.getQuote();
            autoResizeTextarea(document.getElementById(`Quote-Field-${lineCount}`));
        } else {
            document.getElementById(`Quote-Field-${lineCount}`).value = "";
        }

        if (line.getAfter() != null){
            document.getElementById(`After-Field-${lineCount}`).value = line.getAfter();
            autoResizeTextarea(document.getElementById(`After-Field-${lineCount}`));
        } else {
            document.getElementById(`After-Field-${lineCount}`).value = "";
        }
    }
    
    lineCount++;
}

function removeLastLine(){
    const lines = overlay.querySelectorAll(".field-line-quote");
    const lastLine = lines[lines.length - 1];
    if (!lastLine) return;
    if (lines.length == 1) return;
    lastLine.remove();
    const suffix = Array.from(personDropdowns.keys());
    personDropdowns.delete(suffix[suffix.length - 1])
    lineCount--;
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px';
}
