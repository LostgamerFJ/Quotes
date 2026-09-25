import { savePersons, Persons, createPersonID, showImg, uploadAvatar } from "./app.js";
import { Person } from "./Person.js";
import { openErrorPopup } from "./Error_Popup.js";

let overlay = null;

export function openPersonPopup() {
    overlay = document.createElement('div');
    overlay.className = 'person-popup-overlay';
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
                        <option value="">Keine Anrede</option>
                    </select>
                </div>
                <div class="field field-notes">
                    <label for="FirstName">Vorname</label>
                    <textarea rows="1" id="FirstName"></textarea>
                </div>
                <div class="field field-notes">
                    <label for="LastName">Nachname</label>
                    <textarea rows="1" id="LastName"></textarea>
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

    const Salutation = document.getElementById("SalutationDropdown");
    const FirstName = document.getElementById("FirstName");
    const LastName = document.getElementById("LastName");
    const Tag = document.getElementById("TagDropdown");
    const Avatar = document.getElementById("AvatarInput");

    const resetBtn = document.getElementById("resetPerson");
    const cancelBtn = document.getElementById("newPersonCancel");
    const saveBtn = document.getElementById("newPersonSave");

    const closePopup = () => {
        overlay.remove();
    };

    overlay.querySelector('#newPersonCancel').addEventListener('click', closePopup);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closePopup();
        }
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

    saveBtn.addEventListener('click', async () => {
        if (Salutation.value === "" && FirstName.value === "") {
            openErrorPopup("Bitte gib entweder eine Anrede oder einen Vornamen an.");
            return;
        } else if (Salutation.value !== "" && FirstName.value !== "") {
            openErrorPopup("Bitte gib entweder eine Anrede oder einen Vornamen an.");
            return;
        }

        const person = (FirstName.value === "")
            ? new Person(createPersonID(), LastName.value, Tag.value, "Default", Salutation.value, null)
            : new Person(createPersonID(), LastName.value, Tag.value, "Default", null, FirstName.value);

        const file = Avatar.files[0];
        if (file) {
            const extension = file.name.split('.').pop();
            const filename = `${person.getName()}.${extension}`;
            try {
                const picUrl = await uploadAvatar(file, filename);
                person.changePic(picUrl);
            } catch (err) {
                console.error(err);
                openErrorPopup("Bild konnte nicht hochgeladen werden.");
            }
        }

        for (let p of Persons){
            if (p.getName() == person.getName()){
                openErrorPopup("Diese Person existiert bereits.");
            }
        }

        Persons.push(person);
        savePersons();
        closePopup();
    });
}

function reset(){
    overlay.remove();
    openPersonPopup();
}