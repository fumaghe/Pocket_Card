// script.js
document.addEventListener('DOMContentLoaded', () => {
    const openPackBtn = document.getElementById('open-pack-btn');
    const goToCollectionBtn = document.getElementById('go-to-collection-btn');
    const pack = document.getElementById('pack');
    const cardsContainer = document.getElementById('cards-container');
    const packsOpenedEl = document.getElementById('packs-opened');
    const commonCountEl = document.getElementById('common-count');
    const rareCountEl = document.getElementById('rare-count');
    const epicCountEl = document.getElementById('epic-count');
    const legendaryCountEl = document.getElementById('legendary-count');
    const recapModal = document.getElementById('recap-modal');
    const recapDetails = document.getElementById('recap-details');
    const closeRecapBtn = recapModal.querySelector('.close-btn');
    const openSidePanelBtn = document.getElementById('open-side-panel');
    const closeSidePanelBtn = document.getElementById('close-side-panel');
    const sidePanel = document.getElementById('side-panel');

    let packsOpened = 0;
    let cardCounts = {
        'Common': 0,
        'Rare': 0,
        'Epic': 0,
        'Legendary': 0
    };

    let cardsData = [];
    let selectedCards = [];
    let currentCardIndex = 0;
    let cardsClicked = 0; // Nuova variabile per tracciare le carte cliccate

    // Suoni (opzionale)
    const flipSound = document.getElementById('flip-sound');
    const openPackSound = document.getElementById('open-pack-sound');

    // Modal elements
    const modal = document.getElementById('card-modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const closeBtn = modal.querySelector('.close-btn');

    // Carica le statistiche dal LocalStorage
    function loadStats() {
        const savedPacks = localStorage.getItem('packsOpened');
        const savedCounts = localStorage.getItem('cardCounts');
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
    }

    // Salva le statistiche nel LocalStorage
    function saveStats() {
        localStorage.setItem('packsOpened', packsOpened);
        localStorage.setItem('cardCounts', JSON.stringify(cardCounts));
    }

    // Carica la collezione dal LocalStorage
    function loadCollection() {
        const collection = JSON.parse(localStorage.getItem('collection')) || {};
        return collection;
    }

    // Salva la collezione nel LocalStorage
    function saveCollection(card) {
        let collection = loadCollection();
        if (collection[card.ID]) {
            collection[card.ID].count += 1;
        } else {
            collection[card.ID] = {
                ...card,
                count: 1
            };
        }
        localStorage.setItem('collection', JSON.stringify(collection));
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
            loadStats();
        })
        .catch(error => {
            console.error('Errore:', error);
            cardsContainer.innerHTML = '<p>Impossibile caricare le carte. Riprova più tardi.</p>';
        });

    // Funzione per selezionare 4 carte casuali con probabilità basate sulla rarità
    function getRandomCards(num) {
        const rarityWeights = {
            'Common': 35,
            'Rare': 30,
            'Epic': 20,
            'Legendary': 15
        };

        // Crea un array ponderato in base alle rarità
        let weightedCards = [];
        cardsData.forEach(card => {
            let weight = rarityWeights[card.rarity] || 1;
            for (let i = 0; i < weight; i++) {
                weightedCards.push(card);
            }
        });

        // Shuffle weightedCards usando Fisher-Yates
        for (let i = weightedCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [weightedCards[i], weightedCards[j]] = [weightedCards[j], weightedCards[i]];
        }

        // Seleziona le carte assicurandosi di non avere duplicati
        const selected = [];
        const usedIDs = new Set();
        for (let card of weightedCards) {
            if (!usedIDs.has(card.ID)) {
                selected.push(card);
                usedIDs.add(card.ID);
            }
            if (selected.length === num) break;
        }

        return selected;
    }

    // Funzione per aggiornare le statistiche delle carte
    function updateCardStats(rarity) {
        if (cardCounts.hasOwnProperty(rarity)) {
            cardCounts[rarity]++;
        } else {
            cardCounts[rarity] = 1;
        }

        commonCountEl.textContent = cardCounts['Common'] || 0;
        rareCountEl.textContent = cardCounts['Rare'] || 0;
        epicCountEl.textContent = cardCounts['Epic'] || 0;
        legendaryCountEl.textContent = cardCounts['Legendary'] || 0;

        saveStats();
    }

    // Funzione per incrementare il contatore dei pacchetti
    function incrementPackCounter() {
        packsOpened++;
        packsOpenedEl.textContent = packsOpened;
        saveStats();
    }

    // Funzione per creare l'HTML delle carte impilate
    function createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', card.rarity);

        // Crea la struttura del flip
        const cardInner = document.createElement('div');
        cardInner.classList.add('card-inner');

        const cardFront = document.createElement('div');
        cardFront.classList.add('card-front');
        const frontImg = document.createElement('img');
        frontImg.src = card.image_url;
        frontImg.alt = card["Nome Carta"];
        cardFront.appendChild(frontImg);

        const cardBack = document.createElement('div');
        cardBack.classList.add('card-back');
        const backImg = document.createElement('img');
        backImg.src = 'img/back.png';
        backImg.alt = 'Retro della Carta';
        cardBack.appendChild(backImg);

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        cardDiv.appendChild(cardInner);

        // Flash di rarità
        const flashDiv = document.createElement('div');
        flashDiv.classList.add('flash', card.rarity);
        cardDiv.appendChild(flashDiv);

        // Glow per la rarità
        const glowDiv = document.createElement('div');
        glowDiv.classList.add('rarity-glow', card.rarity);
        cardDiv.appendChild(glowDiv);

        // Event Listener per il flip
        cardDiv.addEventListener('click', () => {
            if (!cardDiv.classList.contains('flipped')) {
                // Suono flip
                if (flipSound) {
                    flipSound.currentTime = 0;
                    flipSound.play();
                }
                // Aggiungi classe flip
                cardDiv.classList.add('flipped');
                // Aggiungi classe per il flash
                flashDiv.classList.add('active');
                // Aggiorna le statistiche delle carte
                updateCardStats(card.rarity);
                // Salva nella collezione
                saveCollection(card);
                // Incrementa il contatore delle carte cliccate
                cardsClicked++;

                // Mostra il modal dopo che la carta è completamente girata
                setTimeout(() => {
                    showModal(card);
                }, 600); // Durata della transizione di flip

                // Rimuovi la carta corrente e mostra la successiva
                setTimeout(() => {
                    cardDiv.classList.add('slide-out');
                    setTimeout(() => {
                        cardDiv.remove();
                        currentCardIndex++;
                        if (currentCardIndex < selectedCards.length) {
                            showNextCard();
                        } else {
                            // Mostra il recap solo dopo aver cliccato su tutte le carte
                            showRecap();
                        }
                    }, 500);
                }, 600);
            }
        });

        return cardDiv;
    }

    // Funzione per mostrare il pacchetto con animazione
    function showPackAnimation(callback) {
        pack.classList.add('show');
        // Dopo l'animazione, mostra le carte
        pack.addEventListener('transitionend', () => {
            callback();
        }, { once: true });
    }

    // Funzione per mostrare le carte una alla volta
    function showNextCard() {
        if (currentCardIndex < selectedCards.length) {
            const card = selectedCards[currentCardIndex];
            const cardElement = createCardElement(card);
            cardsContainer.appendChild(cardElement);
            // Animazione di apparizione
            setTimeout(() => {
                cardElement.classList.add('show');
            }, 100);
        }
    }

    // Funzione per mostrare il recap
    function showRecap() {
        // Popola il recap con le carte trovate
        recapDetails.innerHTML = '';
        selectedCards.forEach(card => {
            const recapCard = document.createElement('div');
            recapCard.classList.add('recap-card', card.rarity);

            const img = document.createElement('img');
            img.src = card.image_url;
            img.alt = card["Nome Carta"];

            const info = document.createElement('div');
            info.classList.add('card-info');
            ;

            recapCard.appendChild(img);
            recapCard.appendChild(info);
            recapDetails.appendChild(recapCard);
        });

        // Mostra il recap modal con animazione di dissolvenza
        recapModal.style.display = 'flex';
        setTimeout(() => {
            recapModal.classList.add('active');
        }, 100);
    }

    // Modal functions
    function showModal(card) {
        modalImg.src = card.image_url;
        modalImg.alt = card["Nome Carta"];
        modalTitle.textContent = card["Nome Carta"];
        modal.style.display = 'flex'; // Cambiato da 'block' a 'flex' per centratura
    }

    function hideModal() {
        modal.style.display = 'none';
    }

    // Event Listener per chiudere il modal
    closeBtn.addEventListener('click', () => {
        hideModal();
    });

    // Chiudi il modal cliccando fuori dal contenuto
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            hideModal();
        }
    });

    // Event Listener per chiudere il recap modal
    closeRecapBtn.addEventListener('click', () => {
        recapModal.classList.remove('active');
        setTimeout(() => {
            recapModal.style.display = 'none';
        }, 500);
    });

    // Chiudi il recap cliccando fuori dal contenuto
    window.addEventListener('click', (event) => {
        if (event.target == recapModal) {
            recapModal.classList.remove('active');
            setTimeout(() => {
                recapModal.style.display = 'none';
            }, 500);
        }
    });

    // Event listener per il pulsante "Apri Pacchetto"
    openPackBtn.addEventListener('click', () => {
        if (cardsData.length === 0) {
            alert('Le carte non sono ancora state caricate. Riprova tra qualche istante.');
            return;
        }
        if (openPackSound) {
            openPackSound.currentTime = 0;
            openPackSound.play();
        }
        // Incrementa il contatore dei pacchetti
        incrementPackCounter();
        // Avvia l'animazione di apertura del pacchetto
        showPackAnimation(() => {
            // Seleziona le carte
            selectedCards = getRandomCards(4);
            currentCardIndex = 0;
            cardsClicked = 0; // Reset del contatore delle carte cliccate
            showNextCard();
        });
    });

    // Event listener per il pulsante "Vai alla Collezione"
    goToCollectionBtn.addEventListener('click', () => {
        window.location.href = 'collection.html';
    });

    // Event listener per aprire il pannello laterale
    openSidePanelBtn.addEventListener('click', () => {
        sidePanel.style.width = '250px';
    });

    // Event listener per chiudere il pannello laterale
    closeSidePanelBtn.addEventListener('click', () => {
        sidePanel.style.width = '0';
    });
});
