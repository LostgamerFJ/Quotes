let overlay = null;

export function openErrorPopup(errMsg) {
    overlay = document.createElement('div');
    overlay.className = 'person-popup-overlay';
    overlay.innerHTML = `
        <div class="person-popup">
            <h2>Fehler</h2>

            <p id="errorMessage">${errMsg}</p>

            <div class="person-popup-footer">
                <button class="btn-secondary" id="Okay">Okay</button>
            </div>
        </div>
    `;

    const okayBtn = document.getElementById("Okay");

    document.body.appendChild(overlay);

    overlay.querySelector('#newPersonCancel').addEventListener('click', closePopup);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closePopup();
        }
    });

    okayBtn.addEventListener('click', () => {
        closePopup();
    })

}
