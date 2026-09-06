
function personLabel(person) {
    const firstPart = person.firstName ? person.firstName : person.salutation;
    return firstPart ? `${firstPart} ${person.lastName}` : person.lastName;
}

/**
 * @param {string|number} idSuffix - "" for the first field, lineCount for dynamically added rows
 * @param {Array} persons - array of Person objects/instances (id, salutation, firstName, lastName, picUrl)
 * @returns {HTMLElement} the finished .person-dropdown element to insert into the DOM
 */
export function createPersonDropdown(idSuffix, persons) {
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
        </div>
    `;

    const toggleAvatar = wrapper.querySelector('.person-dropdown-avatar');
    const searchInput = wrapper.querySelector('.person-dropdown-input');
    const panel = wrapper.querySelector('.person-dropdown-panel');
    const list = wrapper.querySelector('.person-dropdown-list');

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

            const img = document.createElement('img');
            img.src = person.picUrl || '';
            img.alt = '';

            const span = document.createElement('span');
            span.textContent = personLabel(person);

            item.appendChild(img);
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
        toggleAvatar.src = person.picUrl || '';
        toggleAvatar.hidden = false;
        searchInput.value = personLabel(person);
    }

    function resetToLastValidSelection() {
        if (lastSelectedPerson) {
            searchInput.value = personLabel(lastSelectedPerson);
            wrapper.dataset.selectedId = lastSelectedPerson.id;
            toggleAvatar.src = lastSelectedPerson.picUrl || '';
            toggleAvatar.hidden = false;
        } else {
            searchInput.value = '';
            wrapper.dataset.selectedId = '';
            toggleAvatar.hidden = true;
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
        const filtered = persons.filter(person =>
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

    return wrapper;
}

export function getSelectedPersonId(wrapper) {
    return wrapper.dataset.selectedId || null;
}