// deck-builder.js
document.addEventListener('DOMContentLoaded', () => {
    const cardPoolContainer = document.getElementById('collection-grid');
    const deckSlots = document.querySelectorAll('.deck-builder .slot');
    const selectedCards = [];

    // Variabili per le statistiche
    const packsOpenedEl = document.getElementById('packs-opened');
    const commonCountEl = document.getElementById('common-count');
    const rareCountEl = document.getElementById('rare-count');
    const epicCountEl = document.getElementById('epic-count');
    const legendaryCountEl = document.getElementById('legendary-count');
    const uniqueCardsEl = document.getElementById('unique-cards');
    const totalCardsEl = document.getElementById('total-cards');
    const averageManaEl = document.getElementById('average-mana');
    const averageStrengthEl = document.getElementById('average-strength');

    // Filtri e Ricerca
    const rarityFilter = document.getElementById('rarity-filter');
    const typeFilter = document.getElementById('type-filter');
    const sortFilter = document.getElementById('sort-filter'); // Nuovo filtro di ordinamento
    const searchInput = document.getElementById('search-input');

    // Titolo del Mazzo e Pulsante PDF
    const deckTitleInput = document.getElementById('deck-title-input');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');

    let packsOpened = 0;
    let cardCounts = {
        'Common': 0,
        'Rare': 0,
        'Epic': 0,
        'Legendary': 0
    };

    let cardsData = [];
    let collection = {};

    // Carica le statistiche dal LocalStorage
    function loadStats() {
        const savedPacks = localStorage.getItem('packsOpened');
        const savedCounts = localStorage.getItem('cardCounts');
        const savedCollection = localStorage.getItem('collection');

        if (savedPacks) {
            packsOpened = parseInt(savedPacks, 10);
            packsOpenedEl.textContent = packsOpened;
        }
        if (savedCounts) {
            cardCounts = JSON.parse(savedCounts);
            commonCountEl.textContent = cardCounts['Common'] || 0;
            rareCountEl.textContent = cardCounts['Rare'] || 0;
            epicCountEl.textContent = cardCounts['Epic'] || 0;
            legendaryCountEl.textContent = cardCounts['Legendary'] || 0;
        }
        if (savedCollection) {
            collection = JSON.parse(savedCollection);
        }

        // Calcola il numero di carte singole possedute
        const uniqueCards = Object.keys(collection).length;
        uniqueCardsEl.textContent = uniqueCards;
    }

    // Salva le statistiche nel LocalStorage
    function saveStats() {
        localStorage.setItem('packsOpened', packsOpened);
        localStorage.setItem('cardCounts', JSON.stringify(cardCounts));
        localStorage.setItem('collection', JSON.stringify(collection));
        localStorage.setItem('selectedCards', JSON.stringify(selectedCards));
        localStorage.setItem('deckTitle', deckTitle);
    }

    // Crea l'elemento per una carta
    function createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card collection-card'; // Aggiunta classe 'collection-card' per rarità
        cardDiv.dataset.id = card.ID;
        cardDiv.dataset.rarity = card.rarity; // Aggiunta data-rarity per filtraggio
        cardDiv.dataset.type = card.Tipo; // Aggiunta data-type per filtraggio

        cardDiv.innerHTML = `
            <img src="${card.image_url}" alt="${card['Nome Carta']}">
        `;

        // Aggiungi il badge del conteggio se la carta è nella collezione
        if (collection[card.ID]) {
            const badge = document.createElement('div');
            badge.classList.add('count-badge');
            badge.textContent = `x${collection[card.ID].count}`;
            cardDiv.appendChild(badge);
        }

        // Aggiungi la classe 'selected' se la carta è già nel mazzo
        if (selectedCards.find(selected => selected.ID === card.ID)) {
            cardDiv.classList.add('selected');
        }

        cardDiv.addEventListener('click', () => toggleCardSelection(card, cardDiv));
        return cardDiv;
    }

    // Gestisci selezione/deselezione delle carte
    function toggleCardSelection(card, cardElement) {
        const cardIndex = selectedCards.findIndex(selected => selected.ID === card.ID);

        if (cardIndex === -1 && selectedCards.length < 12) {
            // Aggiungi la carta al mazzo
            selectedCards.push(card);
            updateDeckSlots();
            cardElement.classList.add('selected');

            // Aggiorna la collezione
            if (collection[card.ID]) {
                collection[card.ID].count += 1;
            } else {
                collection[card.ID] = { ...card, count: 1 };
                cardCounts[card.rarity] += 1;
                uniqueCardsEl.textContent = Object.keys(collection).length;
            }
            saveStats();
            updateStats();
            updateCardBadge(card.ID, cardElement);
            checkDeckCompletion();
        } else if (cardIndex !== -1) {
            // Rimuovi la carta dal mazzo
            selectedCards.splice(cardIndex, 1);
            updateDeckSlots();
            cardElement.classList.remove('selected');

            // Aggiorna la collezione
            if (collection[card.ID].count > 1) {
                collection[card.ID].count -= 1;
                updateCardBadge(card.ID, cardElement);
            } else {
                delete collection[card.ID];
                cardCounts[card.rarity] -= 1;
                uniqueCardsEl.textContent = Object.keys(collection).length;
                removeCardBadge(cardElement);
            }
            saveStats();
            updateStats();
            checkDeckCompletion();
        }
    }

    // Aggiorna gli slot del mazzo
    function updateDeckSlots() {
        deckSlots.forEach((slot, index) => {
            if (selectedCards[index]) {
                const card = selectedCards[index];
                slot.innerHTML = `<img src="${card.image_url}" alt="${card['Nome Carta']}">`;
                // Aggiungi un attributo per identificare la carta
                slot.dataset.cardId = card.ID;
            } else {
                slot.innerHTML = '';
                delete slot.dataset.cardId;
            }
        });
        calculateAverages();
    }

    // Calcola e mostra il Mana Medio e la Forza Media
    function calculateAverages() {
        if (selectedCards.length === 0) {
            averageManaEl.textContent = '0';
            averageStrengthEl.textContent = '0';
            return;
        }

        const totalMana = selectedCards.reduce((sum, card) => sum + card.Mana, 0);
        const totalStrength = selectedCards.reduce((sum, card) => sum + card.Forza, 0);

        const averageMana = (totalMana / selectedCards.length).toFixed(2);
        const averageStrength = (totalStrength / selectedCards.length).toFixed(2);

        averageManaEl.textContent = averageMana;
        averageStrengthEl.textContent = averageStrength;
    }

    // Aggiorna le statistiche nella barra
    function updateStats() {
        packsOpenedEl.textContent = packsOpened;
        commonCountEl.textContent = cardCounts['Common'] || 0;
        rareCountEl.textContent = cardCounts['Rare'] || 0;
        epicCountEl.textContent = cardCounts['Epic'] || 0;
        legendaryCountEl.textContent = cardCounts['Legendary'] || 0;

        // Calcola il totale delle carte
        const totalUniqueCards = Object.keys(collection).length;
        uniqueCardsEl.textContent = totalUniqueCards;
    }

    // Aggiorna il badge del conteggio sulla carta
    function updateCardBadge(cardID, cardElement) {
        let badge = cardElement.querySelector('.count-badge');
        if (badge) {
            badge.textContent = `x${collection[cardID].count}`;
        } else {
            badge = document.createElement('div');
            badge.classList.add('count-badge');
            badge.textContent = `x${collection[cardID].count}`;
            cardElement.appendChild(badge);
        }
    }

    // Rimuovi il badge del conteggio dalla carta
    function removeCardBadge(cardElement) {
        const badge = cardElement.querySelector('.count-badge');
        if (badge) {
            badge.remove();
        }
    }

    // Funzione per visualizzare la collezione con filtri e ricerca
    function displayCollection(cards) {
        // Pulisce la griglia
        cardPoolContainer.innerHTML = '';

        // Filtra le carte in base ai filtri e alla ricerca
        let filteredCards = filterAndSearchCards(cards);

        // Ordina le carte in base al selettore di ordinamento
        filteredCards = sortCards(filteredCards);

        // Crea gli elementi delle carte
        filteredCards.forEach(card => {
            const cardDiv = createCardElement(card);
            cardPoolContainer.appendChild(cardDiv);
        });
    }

    // Filtra le carte in base ai filtri e alla ricerca
    function filterAndSearchCards(cards) {
        const rarity = rarityFilter.value;
        const type = typeFilter.value;
        const searchQuery = searchInput.value.toLowerCase();

        return cards.filter(card => {
            // Filtra per rarità
            const rarityMatch = rarity === 'All' || card.rarity === rarity;

            // Filtra per tipo
            const typeMatch = type === 'All' || card.Tipo === type;

            // Filtra per ricerca (nome o effetto)
            const nameMatch = card['Nome Carta'].toLowerCase().includes(searchQuery);
            const effect1Match = card['Effetto 1'].toLowerCase().includes(searchQuery);
            const effect2Match = card['Effetto 2'] && card['Effetto 2'].toLowerCase().includes(searchQuery);
            const searchMatch = nameMatch || effect1Match || effect2Match;

            return rarityMatch && typeMatch && searchMatch;
        });
    }

    // Ordina le carte in base al selettore di ordinamento
    function sortCards(cards) {
        const sortValue = sortFilter.value;

        switch(sortValue) {
            case 'ManaAsc':
                return cards.sort((a, b) => a.Mana - b.Mana);
            case 'ManaDesc':
                return cards.sort((a, b) => b.Mana - a.Mana);
            case 'StrengthAsc':
                return cards.sort((a, b) => a.Forza - b.Forza);
            case 'StrengthDesc':
                return cards.sort((a, b) => b.Forza - a.Forza);
            default:
                return cards; // Nessun ordinamento
        }
    }

    // Event listeners per filtri e ricerca
    rarityFilter.addEventListener('change', () => {
        displayCollection(cardsData);
    });

    typeFilter.addEventListener('change', () => {
        displayCollection(cardsData);
    });

    sortFilter.addEventListener('change', () => {
        displayCollection(cardsData);
    });

    searchInput.addEventListener('input', () => {
        displayCollection(cardsData);
    });

    // Gestisci il titolo del mazzo
    let deckTitle = '';

    deckTitleInput.addEventListener('input', (e) => {
        deckTitle = e.target.value.trim();
        checkDeckCompletion();
    });

    // Verifica se il mazzo è completo per abilitare il pulsante PDF
    function checkDeckCompletion() {
        if (selectedCards.length === 12 && deckTitle !== '') {
            downloadPdfBtn.disabled = false;
        } else {
            downloadPdfBtn.disabled = true;
        }
    }

    // Funzione per generare il PDF
    downloadPdfBtn.addEventListener('click', async () => {
        if (selectedCards.length !== 12) {
            alert('Il mazzo deve contenere esattamente 12 carte.');
            return;
        }

        if (deckTitle === '') {
            alert('Per favore, inserisci un titolo per il mazzo.');
            return;
        }

        // Crea un elemento temporaneo per il PDF
        const pdfContent = document.createElement('div');
        pdfContent.style.width = '595px'; // Larghezza A4 in px (210mm * 72 DPI / 25.4)
        pdfContent.style.padding = '20px';
        pdfContent.style.fontFamily = 'Arial, sans-serif';
        pdfContent.style.backgroundColor = '#ffffff';
        pdfContent.style.color = '#000000';
        pdfContent.style.boxSizing = 'border-box';

        // Titolo del Mazzo
        const titleElement = document.createElement('h1');
        titleElement.textContent = deckTitle;
        titleElement.style.textAlign = 'center';
        titleElement.style.color = '#f1c40f';
        titleElement.style.marginBottom = '20px';
        pdfContent.appendChild(titleElement);

        // Deck Cards
        const deckCardsContainer = document.createElement('div');
        deckCardsContainer.style.display = 'flex';
        deckCardsContainer.style.flexWrap = 'wrap';
        deckCardsContainer.style.justifyContent = 'center';
        deckCardsContainer.style.gap = '10px';
        deckCardsContainer.id = 'deck-cards-container';

        selectedCards.forEach(card => {
            const cardImg = document.createElement('img');
            cardImg.src = card.image_url;
            cardImg.alt = card['Nome Carta'];
            cardImg.style.width = '80px';
            cardImg.style.height = '112px'; // Proporzione 5:7 per le carte
            cardImg.style.objectFit = 'cover';
            cardImg.style.borderRadius = '5px';
            deckCardsContainer.appendChild(cardImg);
        });

        pdfContent.appendChild(deckCardsContainer);

        // Statistiche
        const statsContainer = document.createElement('div');
        statsContainer.style.marginTop = '20px';
        statsContainer.style.textAlign = 'center';

        const manaPara = document.createElement('p');
        manaPara.innerHTML = `<strong>Mana Medio:</strong> ${averageManaEl.textContent}`;
        manaPara.style.fontSize = '1.2em';
        statsContainer.appendChild(manaPara);

        const strengthPara = document.createElement('p');
        strengthPara.innerHTML = `<strong>Forza Media:</strong> ${averageStrengthEl.textContent}`;
        strengthPara.style.fontSize = '1.2em';
        statsContainer.appendChild(strengthPara);

        pdfContent.appendChild(statsContainer);

        // Aggiungi il contenuto temporaneo al body per poterlo catturare
        document.body.appendChild(pdfContent);

        // Usa html2canvas per catturare il contenuto
        const canvas = await html2canvas(pdfContent, { scale: 2 });

        // Calcola le dimensioni A4 in px
        const a4Width = 595; // 210mm
        const a4Height = 842; // 297mm

        const imgData = canvas.toDataURL('image/png');

        // Crea il PDF con dimensioni A4
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [a4Width, a4Height]
        });

        // Calcola lo scaling per adattare l'immagine all'A4
        const imgWidth = a4Width - 40; // Padding
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
        pdf.save(`${deckTitle}.pdf`);

        // Rimuovi l'elemento temporaneo
        document.body.removeChild(pdfContent);
    });

    // Carica il JSON delle carte
    fetch('cards.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Errore nel caricamento del file JSON');
            }
            return response.json();
        })
        .then(data => {
            cardsData = data;
            // Imposta il totale delle carte
            totalCardsEl.textContent = cardsData.length;
            loadStats();
            displayCollection(cardsData);
            loadDeckFromStorage();
            calculateAverages();
            checkDeckCompletion();
            addDeckSlotListeners(); // Aggiungi i listener agli slot dopo aver caricato le carte
        })
        .catch(error => {
            console.error('Errore nel caricamento delle carte:', error);
            cardPoolContainer.innerHTML = '<p>Impossibile caricare le carte. Riprova più tardi.</p>';
        });

    // Funzione per caricare il mazzo dal LocalStorage
    function loadDeckFromStorage() {
        const savedDeck = localStorage.getItem('selectedCards');
        if (savedDeck) {
            const parsedDeck = JSON.parse(savedDeck);
            parsedDeck.forEach(card => {
                selectedCards.push(card);
            });
            updateDeckSlots();
            // Aggiungi la classe 'selected' alle carte corrispondenti
            parsedDeck.forEach(card => {
                const cardElement = document.querySelector(`.card[data-id="${card.ID}"]`);
                if (cardElement) {
                    cardElement.classList.add('selected');
                }
            });
        }

        // Carica il titolo del mazzo se salvato
        const savedTitle = localStorage.getItem('deckTitle');
        if (savedTitle) {
            deckTitleInput.value = savedTitle;
            deckTitle = savedTitle;
        }

        // Verifica il completamento del mazzo dopo il caricamento
        checkDeckCompletion();
    }

    // Salva il titolo del mazzo nel LocalStorage
    deckTitleInput.addEventListener('input', () => {
        localStorage.setItem('deckTitle', deckTitle);
    });

    // Event listener per il pannello laterale
    const openSidePanelBtn = document.getElementById('open-side-panel');
    const closeSidePanelBtn = document.getElementById('close-side-panel');
    const sidePanel = document.getElementById('side-panel');

    openSidePanelBtn.addEventListener('click', () => {
        sidePanel.style.width = '250px';
    });

    closeSidePanelBtn.addEventListener('click', () => {
        sidePanel.style.width = '0';
    });

    // Funzione per aggiungere listener agli slot del mazzo per rimuovere carte
    function addDeckSlotListeners() {
        deckSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                const cardId = slot.dataset.cardId;
                if (cardId) {
                    removeCardFromDeck(cardId, slot);
                }
            });
        });
    }

    // Funzione per rimuovere una carta dal mazzo cliccando sullo slot
    function removeCardFromDeck(cardId, slotElement) {
        const cardIndex = selectedCards.findIndex(card => card.ID.toString() === cardId);
        if (cardIndex !== -1) {
            const card = selectedCards[cardIndex];
            selectedCards.splice(cardIndex, 1);
            updateDeckSlots();

            // Aggiorna la collezione
            if (collection[card.ID].count > 1) {
                collection[card.ID].count -= 1;
                const cardElement = document.querySelector(`.card[data-id="${card.ID}"]`);
                if (cardElement) {
                    updateCardBadge(card.ID, cardElement);
                }
            } else {
                delete collection[card.ID];
                cardCounts[card.rarity] -= 1;
                const cardElement = document.querySelector(`.card[data-id="${card.ID}"]`);
                if (cardElement) {
                    removeCardBadge(cardElement);
                    cardElement.classList.remove('selected');
                }
                uniqueCardsEl.textContent = Object.keys(collection).length;
            }

            saveStats();
            updateStats();
            checkDeckCompletion();
        }
    }

    // Salva lo stato quando l'utente lascia la pagina
    window.addEventListener('beforeunload', () => {
        saveStats();
    });
});
