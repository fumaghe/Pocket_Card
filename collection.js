// collection.js
document.addEventListener('DOMContentLoaded', () => {
    const collectionGrid = document.getElementById('collection-grid');
    const rarityFilter = document.getElementById('rarity-filter');
    const typeFilter = document.getElementById('type-filter');
    const effectFilter = document.getElementById('effect-filter'); // Nuovo filtro per Effetto
    const sortFilter = document.getElementById('sort-filter');
    const foundFilter = document.getElementById('found-filter');
    const packsOpenedEl = document.getElementById('packs-opened');
    const commonCountEl = document.getElementById('common-count');
    const rareCountEl = document.getElementById('rare-count');
    const epicCountEl = document.getElementById('epic-count');
    const legendaryCountEl = document.getElementById('legendary-count');
    const uniqueCardsEl = document.getElementById('unique-cards');
    const totalCardsEl = document.getElementById('total-cards');
    const backToHomeBtn = document.getElementById('back-to-home-btn');

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

        // Assicurati di avere il totale delle carte dopo aver caricato cardsData
    }

    // Funzione per popolare dinamicamente le opzioni del filtro Effetto
    function populateEffectFilter() {
        const effects = new Set();
        cardsData.forEach(card => {
            if (card["Effetto 1"]) {
                effects.add(card["Effetto 1"]);
            }
            if (card["Effetto 2"]) {
                effects.add(card["Effetto 2"]);
            }
        });

        // Ordina gli effetti alfabeticamente
        const sortedEffects = Array.from(effects).sort();

        // Aggiungi le opzioni al select
        sortedEffects.forEach(effect => {
            const option = document.createElement('option');
            option.value = effect;
            option.textContent = effect;
            effectFilter.appendChild(option);
        });
    }

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
            populateEffectFilter(); // Popola il filtro Effetto
            displayCollection();
        })
        .catch(error => {
            console.error('Errore:', error);
            collectionGrid.innerHTML = '<p>Impossibile caricare le carte. Riprova più tardi.</p>';
        });

    // Funzione per visualizzare la collezione con filtri e ordinamenti
    function displayCollection() {
        let filteredCards = [...cardsData]; // Crea una copia per evitare mutazioni

        // Applica filtro Rarità
        if (rarityFilter.value !== 'All') {
            filteredCards = filteredCards.filter(card => card.rarity === rarityFilter.value);
        }

        // Applica filtro Tipo
        if (typeFilter.value !== 'All') {
            filteredCards = filteredCards.filter(card => card.Tipo === typeFilter.value);
        }

        // Applica filtro Effetto
        if (effectFilter.value !== 'All') {
            filteredCards = filteredCards.filter(card => 
                (card["Effetto 1"] && card["Effetto 1"].includes(effectFilter.value)) ||
                (card["Effetto 2"] && card["Effetto 2"].includes(effectFilter.value))
            );
        }

        // Applica filtro Mostra Solo Trovate
        if (foundFilter.checked) {
            filteredCards = filteredCards.filter(card => collection[card.ID]);
        }

        // Applica Ordinamento
        switch (sortFilter.value) {
            case 'mana-asc':
                filteredCards.sort((a, b) => a.Mana - b.Mana);
                break;
            case 'mana-desc':
                filteredCards.sort((a, b) => b.Mana - a.Mana);
                break;
            case 'strength-asc':
                filteredCards.sort((a, b) => a.Forza - b.Forza);
                break;
            case 'strength-desc':
                filteredCards.sort((a, b) => b.Forza - a.Forza);
                break;
            default:
                // Ordine originale o altri criteri
                break;
        }

        // Pulisce la griglia
        collectionGrid.innerHTML = '';

        // Crea gli elementi delle carte
        filteredCards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('collection-card', card.rarity);

            const img = document.createElement('img');
            img.src = card.image_url;
            img.alt = card["Nome Carta"];
            cardDiv.appendChild(img);

            if (collection[card.ID]) {
                // Carta trovata, mostra il conteggio
                const badge = document.createElement('div');
                badge.classList.add('count-badge');
                badge.textContent = `x${collection[card.ID].count}`;
                cardDiv.appendChild(badge);
            } else {
                // Carta non trovata, applica l'effetto blur
                cardDiv.classList.add('blur');
            }

            // Aggiungi l'effetto hover con ombra luminosa
            cardDiv.addEventListener('mouseenter', () => {
                if (!cardDiv.classList.contains('blur')) {
                    cardDiv.classList.add('hovered');
                }
            });

            cardDiv.addEventListener('mouseleave', () => {
                cardDiv.classList.remove('hovered');
            });

            // Aggiungi la carta al grid con animazione
            collectionGrid.appendChild(cardDiv);
            setTimeout(() => {
                cardDiv.classList.add('animate');
            }, 100);
        });
    }

    // Event listeners per i filtri e ordinamenti
    rarityFilter.addEventListener('change', () => {
        displayCollection();
    });

    typeFilter.addEventListener('change', () => {
        displayCollection();
    });

    effectFilter.addEventListener('change', () => { // Listener per il nuovo filtro Effetto
        displayCollection();
    });

    sortFilter.addEventListener('change', () => {
        displayCollection();
    });

    foundFilter.addEventListener('change', () => {
        displayCollection();
    });

    // Event listener per il pulsante "Torna Indietro"
    backToHomeBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});
