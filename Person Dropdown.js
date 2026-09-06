export class PersonDropdown {
    const beispielPersonen = [
        { id: "p1", salutation: "Frau", firstName: "Anna", lastName: "Meier", picUrl: "" },
        { id: "p2", salutation: "Herr", firstName: null, lastName: "Klumpner", picUrl: "" },
        { id: "p3", salutation: null, firstName: "Tom", lastName: "Huber", picUrl: "" },
    ];

    function personLabel(person) {
        const vornameOderAnrede = person.firstName ? person.firstName : person.salutation;
        return vornameOderAnrede ? `${vornameOderAnrede} ${person.lastName}` : person.lastName;
    }
    
    /**
     * @param {string} idSuffix
     * @param {Array} personen
     * @returns {HTMLElement}
     */
    function createPersonDropdown(idSuffix, personen) {
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
    
        function renderList(gefilterte) {
            list.innerHTML = '';
    
            if (gefilterte.length === 0) {
                const empty = document.createElement('li');
                empty.className = 'person-dropdown-empty';
                empty.textContent = 'Keine Treffer';
                list.appendChild(empty);
                return;
            }
    
            gefilterte.forEach(person => {
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
    
        let lastSelectedPerson = null;
    
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
    
        function filterAndRender(suchbegriff) {
            const gefiltert = personen.filter(person =>
                personLabel(person).toLowerCase().includes(suchbegriff.toLowerCase())
            );
            renderList(gefiltert);
        }
    
        searchInput.addEventListener('focus', () => {
            openPanel();
        });
    
        searchInput.addEventListener('input', () => {
            wrapper.dataset.selectedId = '';
            openPanel();
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

    function getSelectedPersonId(wrapper) {
        return wrapper.dataset.selectedId || null;
    }
    
    
    const demoDropdown = createPersonDropdown('', beispielPersonen);
    document.getElementById('demoContainer').appendChild(demoDropdown);
}