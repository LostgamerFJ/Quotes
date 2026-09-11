import { savePersons, Persons, showImg } from "./app.js";

export function openPersonPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'person-popup-overlay';

    const Salutation = document.getElementById("SalutationDropdown");
    const FirstName = document.getElementById("FirstName");
    const LastName = document.getElementById("LastName");
    const Tag = document.getElementById("TagDropdown");
    const Avatar = document.getElementById("AvatarInput");

    const resetBtn = document.getElementById("resetPerson");
    const cancelBtn = document.getElementById("newPersonCancel");
    const saveBtn = document.getElementById("newPersonSave");

    overlay.innerHTML = `
        <div class="person-popup">
            <h2>Neue Person</h2>

            <div class="field-line field-line-person">
                <div class="avatar-upload">
                    <h1 class="upload-icon">+</h1>
                    <input class="avatar-uploader" type="file" id="AvatarInput" accept="image/*">
                </div>

                <div class="field">
                    <label for="SalutationDropdown">Anrede</label>
                    <select id="SalutationDropdown">
                        <option value="Herr">Herr</option>
                        <option value="Frau">Frau</option>
                        <option value="null">Keine Anrede</option>
                    </select>
                </div>
                <div class="field field-notes">
                    <label for="FirstName">Vorname</label>
                    <textarea lines="1" id="FirstName"></textarea>
                </div>
                <div class="field field-notes">
                    <label for="LastName">Nachname</label>
                    <textarea lines="1" id="LastName"></textarea>
                </div>
                <div class="field">
                    <label for="TagDropdown">Typ</label>
                    <select id="TagDropdown">
                        <option value="Teacher">Lehrer*in</option>
                        <option value="Student">Schüler*in</option>
                    </select>
                </div>
            </div>

            <div class="person-popup-footer">
                <button class="btn-secondary" id="resetPerson">Zurücksetzen</button>

                <button class="btn-secondary" id="newPersonCancel">Abbrechen</button>

                <button class="btn-primary" id="newPersonSave">Speichern</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closePopup = () => {
        overlay.remove();
    };

    overlay.querySelector('#newPersonCancel').addEventListener('click', closePopup);

    overlay.querySelector('#newPersonClose').addEventListener('click', closePopup);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closePopup();
        }
    });

    overlay.querySelector('#newPersonSave').addEventListener('click', () => {
        console.log('Neue Person gespeichert');

        closePopup();
    });

    Avatar.addEventListener('change', () =>{
        showImg();
    })

    resetBtn.addEventListener('click', () => {
        reset();
    })

    cancelBtn.addEventListener('click', () => {
        closePopup();
    })

    saveBtn.addEventListener('click', () => {
        Persons.push(new Person(generateID(), LastName.value, Tag.value, `.assets/${Avatar.value}`, Salutation.value, FirstName.value))
        savePersons();
    })
}

function reset(){
    closePopup();
    openPersonPopup();
}

function generateID(){
    return Persons.length + 1
}