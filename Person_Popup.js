import { savePersons, Persons, createPersonID, showImg, uploadAvatar, renderCollapsibles, resolveImageUrl, cacheUploadedImage } from "./app.js";
import { Person } from "./Person.js";
import { openErrorPopup } from "./Error_Popup.js";

let overlay = null;

export function openPersonPopup(text = "Neue Person", person = null) {
    const PPic = person ? resolveImageUrl(person.picUrl) : "assets/Portrait_Placeholder.png";
    const PSal = person ? person.salutation : null;
    const PFN = person && person.firstName ? person.firstName : "";
    const PLN = person ? person.lastName : "";
    const PTag = person ? person.tag : "";

    overlay = document.createElement('div');
    overlay.className = 'person-popup-overlay';
    overlay.innerHTML = `
        <div class="person-popup">
            <h2>${text}</h2>

            <div class="field-line field-line-person">
                <div class="avatar-upload">
                    <h1 class="upload-icon">+</h1>
                    <input class="avatar-uploader" type="file" id="AvatarInput" accept="image/*">
                </div>

                <div class="field">
                    <label for="SalutationDropdown">Anrede</label>
                    <select id="SalutationDropdown">
                        <option value="Herr" ${PSal === "Herr" ? "selected" : ""}>Herr</option>
                        <option value="Frau" ${PSal === "Frau" ? "selected" : ""}>Frau</option>
                        <option value="" ${!PSal ? "selected" : ""}>Keine Anrede</option>
                    </select>
                </div>
                <div class="field field-notes">
                    <label for="FirstName">Vorname</label>
                    <textarea rows="1" id="FirstName">${PFN}</textarea>
                </div>
                <div class="field field-notes">
                    <label for="LastName">Nachname</label>
                    <textarea rows="1" id="LastName">${PLN}</textarea>
                </div>
                <div class="field">
                    <label for="TagDropdown">Typ</label>
                    <select id="TagDropdown">
                        <option value="Teacher" ${PTag === "Teacher" ? "selected" : ""}>Lehrer*in</option>
                        <option value="Student" ${PTag === "Student" ? "selected" : ""}>Schüler*in</option>
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

    overlay.querySelector('.avatar-upload').style.backgroundImage = `url(${PPic})`;

    Avatar.addEventListener('change', () =>{
        showImg();
    })

    person ? resetBtn.addEventListener('click', () => {
        reset("Person bearbeiten", person);
    }) : resetBtn.addEventListener('click', () => {
        reset();
    });

    cancelBtn.addEventListener('click', () => {
        closePopup();
    })

    person ? saveBtn.addEventListener('click', async () => {
        const editedPerson = Persons.find(p => p.getID() == person.getID());
        const LastNameValue = LastName.value.trim() === "" ? null : LastName.value.trim;

        if (LastNameValue === null){
            openErrorPopup("Bitte gib einen Nachnamen an.");
            return
        }
        if (Salutation.value.trim() === "" && FirstName.value.trim() === "") {
            openErrorPopup("Bitte gib entweder eine Anrede oder einen Vornamen an.");
            return;
        } else if (Salutation.value.trim() !== "" && FirstName.value.trim() !== "") {
            openErrorPopup("Bitte gib entweder eine Anrede oder einen Vornamen an. Nicht beides.");
            return;
        }



        for (let p of Persons){
            if (p.getID() === editedPerson.getID()){
                return
            } else{
                if (p.getName() == editedPerson.getName()){
                    openErrorPopup("Diese Person existiert bereits.");
                    return;
                }
            }
        }

        const file = Avatar.files[0];
        if (file) {
            const extension = file.name.split('.').pop();
            const filename = `${editedPerson.getName()}.${extension}`;
            try {
                const picUrl = await uploadAvatar(file, filename);
                cacheUploadedImage(picUrl, file);
                editedPerson.changePic(picUrl);
            } catch (err) {
                console.error(err);
                openErrorPopup("Bild konnte nicht hochgeladen werden.");
            }
        }

        editedPerson.salutation = Salutation.value || null;
        editedPerson.firstName = FirstName.value || null;
        editedPerson.lastName = LastName.value;
        editedPerson.tag = Tag.value;
        savePersons();
        closePopup();
        renderCollapsibles();
        
    }) : saveBtn.addEventListener('click', async () => {
        const LastNameValue = LastName.value.trim() === "" ? null : LastName.value.trim;
        
        if (LastNameValue === null){
            openErrorPopup("Bitte gib einen Nachnamen an.");
            return
        }
        if (Salutation.value.trim() === "" && FirstName.value.trim() === "") {
            openErrorPopup("Bitte gib entweder eine Anrede oder einen Vornamen an.");
            return;
        } else if (Salutation.value.trim() !== "" && FirstName.value.trim() !== "") {
            openErrorPopup("Bitte gib entweder eine Anrede oder einen Vornamen an. Nicht beides.");
            return;
        }

        const person = (FirstName.value === "")
            ? new Person(createPersonID(), LastName.value, Tag.value, "Default", Salutation.value, null)
            : new Person(createPersonID(), LastName.value, Tag.value, "Default", null, FirstName.value);
        
        for (let p of Persons){
            if (p.getName() == person.getName()){
                openErrorPopup("Diese Person existiert bereits.");
                return;
            }
        }

        const file = Avatar.files[0];
        if (file) {
            const extension = file.name.split('.').pop();
            const filename = `${person.getName()}.${extension}`;
            try {
                const picUrl = await uploadAvatar(file, filename);
                cacheUploadedImage(picUrl, file);
                person.changePic(picUrl);
            } catch (err) {
                console.error(err);
                openErrorPopup("Bild konnte nicht hochgeladen werden.");
            }
        }

        

        Persons.push(person);
        savePersons();
        closePopup();
    })
}

function reset(title = "Neue Person", person = null) {
    overlay.remove();
    openPersonPopup(title, person);
}