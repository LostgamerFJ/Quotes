import { Quote } from "./Quote.js";
import { createPersonDropdown, getSelectedPersonId } from "./Person_Dropdown.js";
import { openErrorPopup } from "./Error_Popup.js";
import { Quotes, createQuoteID, saveLines, saveQuotes, saveAll, renderCollapsibles, createLineID, QuoteLines } from "./app.js";
import { QuoteLine } from "./QuoteLine.js";

let overlay = null;
let lineCount = 0;

const personDropdowns = new Map();

export function openQuotePopup(text = "Neues Zitat") {
    lineCount = 0;
    personDropdowns.clear();

    overlay = document.createElement('div');
    overlay.className = 'overlay active';
    overlay.innerHTML = `
        <div class="quote-popup" id="quote-popup">
            <h2>${text}</h2>

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

    extraFieldBtn.addEventListener('click', () => {
        addLine();
    });

    removeLineBtn.addEventListener('click', () => {
        removeLastLine();
    });

    resetBtn.addEventListener('click', () => {
        reset();
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

    addLine();
}

function closePopup() {
    overlay.remove();
}

function reset() {
    overlay.remove();
    openQuotePopup();
}

function mountPersonDropdown(idSuffix, slotElement) {
    const dropdown = createPersonDropdown(idSuffix);
    slotElement.appendChild(dropdown);
    personDropdowns.set(idSuffix, dropdown);
}

function collectLines() {
    const lines = [];

    for (const suffix of personDropdowns.keys()) {
        const dropdown = personDropdowns.get(suffix);
        const beforeField = document.getElementById(`Notes${suffix}`);
        const quoteField = document.getElementById(`Quote${suffix}`);
        const afterField = document.getElementById(`Context${suffix}`);

        let before;
        let quote;
        let after

        if (getSelectedPersonId(dropdown) == null){
            openErrorPopup("Bitte wähle eine Person aus.");
            throw new Error("No Person selected")
        }
        
        if (getSelectedPersonId(dropdown) == 0){
            before = beforeField.value ? `(${beforeField.value})` : null;
            quote = quoteField.value ? `(${quoteField.value})` : null;
            after = afterField.value ? `(${afterField.value})` : null; 
        } else {
            before = beforeField.value ? `(${beforeField.value})` : null;
            quote = quoteField.value ? `"${quoteField.value}"` : null;
            after = afterField.value ? `(${afterField.value})` : null;
        }

        if (before == null && quote == null && after == null){
            openErrorPopup("Bitte gib ein Zitat, Notizen oder Kontext an.");
            throw new Error("No Quote, Notes and Context")
        }

        const newLine = new QuoteLine(createLineID(), getSelectedPersonId(dropdown), quote, before, after)
        QuoteLines.push(newLine);
        lines.push(newLine);
    }
    return lines;
}

function addLine(){
    const newLine = document.createElement('div');
    newLine.className = 'field-line field-line-quote';
    newLine.id = `field-line${lineCount}`
    newLine.innerHTML = `
        <div class="field field-person active">
            <label>Person</label>
            <div class="person-dropdown-slot" id="personSlot${lineCount}"></div>
        </div>
        <div class="field-container">
            <div class="field field-before active">
                <label for="Notes${lineCount}">Notiz</label>
                <textarea rows="1" id="Notes${lineCount}" placeholder="Optional"></textarea>
            </div>
            <div class="field field-quote active">
                <label for="Quote${lineCount}">Zitat</label>
                <textarea rows="1" id="Quote${lineCount}"></textarea>
            </div>
            <div class="field field-after active">
                <label for="Context${lineCount}">Kontext</label>
                <textarea rows="1" id="Context${lineCount}" placeholder="Optional"></textarea>
            </div>
        </div>
    `;

    const leftAction = overlay.querySelector('.left-action');
    leftAction.parentNode.insertBefore(newLine, leftAction);

    const slot = newLine.querySelector(`#personSlot${lineCount}`);
    mountPersonDropdown(lineCount, slot);

    newLine.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', () => autoResizeTextarea(textarea));
    });
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
