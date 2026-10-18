import { openPersonPopup } from "./Person_Popup.js";
import { resolveImageUrl, Persons } from "./app.js";

function personLabel(person) {
    const firstPart = person.firstName ? person.firstName : person.salutation;
    return firstPart ? `${firstPart} ${person.lastName}` : person.lastName;
}

export function createPersonDropdown(idSuffix) {
    const wrapper = document.createElement('div');
    wrapper.className = 'person-dropdown';
    wrapper.id = `personDropdown${idSuffix}`;
    wrapper.dataset.selectedId = '';
    wrapper.innerHTML = `
        <div class="person-dropdown-toggle">
            <img class="person-dropdown-avatar" src="" alt="" hidden>
            <input type="text" class="person-dropdown-input" placeholder="Bitte wählen" autocomplete="off">
        </div>
        <div class="person-dropdown-panel" hidden>
            <ul class="person-dropdown-list" role="listbox"></ul>
            <button type="button" class="person-dropdown-add">+ Neue Person hinzufügen</button>
        </div>
    `;

    const toggleAvatar = wrapper.querySelector('.person-dropdown-avatar');
    const searchInput = wrapper.querySelector('.person-dropdown-input');
    const panel = wrapper.querySelector('.person-dropdown-panel');
    const list = wrapper.querySelector('.person-dropdown-list');
    const addPersonButton = wrapper.querySelector('.person-dropdown-add');

    const MIN_INPUT_SIZE = 12;
    function updateInputWidth(text) {
        searchInput.size = Math.max(MIN_INPUT_SIZE, text.length + 2);
    }

    addPersonButton.addEventListener('mousedown', (event) => {
        event.preventDefault();
    });

    addPersonButton.addEventListener('click', () => {
        openPersonPopup();
    });

    let lastSelectedPerson = null;

    function renderList(filteredPersons) {
        list.innerHTML = '';

        if (filteredPersons.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'person-dropdown-empty';
            emptyItem.textContent = 'Keine Treffer';
            list.appendChild(emptyItem);
            return;
        }

        filteredPersons.forEach(person => {
            const item = document.createElement('li');
            item.className = 'person-dropdown-item';
            item.setAttribute('role', 'option');
            item.dataset.id = person.id;

            if (!person.isEinschub()) {
                const img = document.createElement('img');
                img.src = resolveImageUrl(person.picUrl) || '';
                img.alt = '';
                item.appendChild(img);
            }

            const span = document.createElement('span');
            span.textContent = personLabel(person);

            
            item.appendChild(span);

            item.addEventListener('click', () => {
                selectPerson(person);
                closePanel();
            });

            list.appendChild(item);
        });
    }

    function selectPerson(person) {
        lastSelectedPerson = person;
        wrapper.dataset.selectedId = person.id;
        if (!person.isEinschub()){
            toggleAvatar.src = resolveImageUrl(person.picUrl) || '';
            toggleAvatar.hidden = false;
        } else if(person.isEinschub()){
            toggleAvatar.hidden = true;
        }
        searchInput.value = personLabel(person);
        updateInputWidth(personLabel(person));
    }

    function resetToLastValidSelection() {
        if (lastSelectedPerson) {
            searchInput.value = personLabel(lastSelectedPerson);
            wrapper.dataset.selectedId = lastSelectedPerson.id;
            if (!lastSelectedPerson.isEinschub()){
                toggleAvatar.src = resolveImageUrl(lastSelectedPerson.picUrl) || '';
                toggleAvatar.hidden = false;
            } else if(lastSelectedPerson.isEinschub()){
                toggleAvatar.hidden = true;
            }
            updateInputWidth(personLabel(lastSelectedPerson));
        } else {
            searchInput.value = '';
            wrapper.dataset.selectedId = '';
            toggleAvatar.hidden = true;
            updateInputWidth('');
        }
    }

    function openPanel() {
        panel.hidden = false;
        filterAndRender(searchInput.value);
    }

    function closePanel() {
        panel.hidden = true;
    }

    function filterAndRender(searchTerm) {
        const filtered = Persons.filter(person =>
            personLabel(person).toLowerCase().includes(searchTerm.toLowerCase())
        );
        renderList(filtered);
    }

    searchInput.addEventListener('focus', () => {
        openPanel();
    });

    searchInput.addEventListener('input', () => {
        wrapper.dataset.selectedId = '';
    });

    document.addEventListener('click', (event) => {
        if (!wrapper.contains(event.target)) {
            closePanel();
        }
    });

    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closePanel();
            searchInput.blur();
        }
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (!wrapper.dataset.selectedId) {
                resetToLastValidSelection();
            }
            closePanel();
        }, 150);
    });

    updateInputWidth('');
    
    return wrapper;
}

export function getSelectedPersonId(wrapper) {
    const id = wrapper.dataset.selectedId;
    return id ? Number(id) : null;
}