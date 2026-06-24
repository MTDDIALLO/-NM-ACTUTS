// --- CONFIGURATION ---
const apiKey = 'ddfda063c4704e17a13e5e599598dd57';
const baseUrl = 'https://api.football-data.org/v4/competitions/';

const championnats = {
    'FL1': 'Ligue 1 (France)',
    'PL':  'Premier League (Angleterre)',
    'PD':  'La Liga (Espagne)',
    'SA':  'Serie A (Italie)',
    'BL1': 'Bundesliga (Allemagne)',
    'WC':  'Coupe du Monde 2026'
};

let currentLeague = 'FL1';

// --- INITIALISATION AU CHARGEMENT ---
document.addEventListener('DOMContentLoaded', () => {
    creerBoutonsNavigation();

    // On detecte la page pour charger les bonnes donnees
    if (document.getElementById('accueil-dynamique')) {
        chargerAccueil();
    } else if (document.getElementById('table-calendrier')) {
        chargerCalendrier(currentLeague);
    } else if (document.getElementById('table-classement')) {
        chargerClassement(currentLeague);
    } else if (document.getElementById('liste-equipes')) {
        chargerEquipes(currentLeague);
    }

    gererForum();
    gererSondages();
});

// --- NAVIGATION ---
function creerBoutonsNavigation() {
    const container = document.getElementById('ligue-selector');
    if (!container) return;

    let html = '<div class="boutons-ligues">';
    for (const [code, nom] of Object.entries(championnats)) {
        const actif = code === currentLeague ? 'actif' : '';
        html += `<button class="${actif}" onclick="changerLigue('${code}', this)">${nom}</button>`;
    }
    html += '</div>';
    container.innerHTML = html;
}

function changerLigue(code, btnClique) {
    currentLeague = code;

    // Mettre le bouton actif en surbrillance
    document.querySelectorAll('.boutons-ligues button').forEach(b => b.classList.remove('actif'));
    if (btnClique) btnClique.classList.add('actif');

    const titre = document.getElementById('titre-ligue');
    if (titre) titre.innerText = championnats[code];

    if (document.getElementById('table-calendrier'))  chargerCalendrier(code);
    if (document.getElementById('table-classement'))  chargerClassement(code);
    if (document.getElementById('liste-equipes'))     chargerEquipes(code);
}

// --- PAGE ACCUEIL ---
// Les articles sont ecrits ici - facile a modifier avant l'oral
function chargerAccueil() {
    const container = document.getElementById('accueil-dynamique');
    if (!container) return;

    const news = [
        {
            title: "Mercato : Les enjeux de l'ete",
            desc: "Analyse des transferts les plus attendus en Europe cet ete. Quels clubs vont frapper fort sur le marche ?",
            date: "24 avril 2025",
            img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800"
        },
        {
            title: "Tactique : Le 4-3-3 moderne",
            desc: "Pourquoi les grands coachs europeens privilegient ce systeme de jeu cette saison.",
            date: "22 avril 2025",
            img: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=800"
        },
        {
            title: "Ligue des Champions",
            desc: "Focus sur les favoris pour le titre final. Qui soulèvera la coupe cette annee ?",
            date: "20 avril 2025",
            img: "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=800"
        }
    ];

    // On construit chaque card avec un badge, une date et un lien "Lire la suite"
    container.innerHTML = news.map(item => `
        <article class="card-accueil">
            <img src="${item.img}" alt="${item.title}">
            <div class="card-body">
                <span class="badge-une">A la Une</span>
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
                <div class="card-meta">Publie le ${item.date}</div>
                <a href="#" class="lire-suite">Lire la suite</a>
            </div>
        </article>
    `).join('');
}

// --- PAGE EQUIPES ---
async function chargerEquipes(code) {
    const container = document.getElementById('liste-equipes');
    if (!container) return;

    // Message de chargement pendant que l'API repond
    container.innerHTML = '<p class="chargement">Chargement des clubs...</p>';

    try {
        const response = await fetch(`${baseUrl}${code}/teams`, {
            headers: { 'X-Auth-Token': apiKey }
        });
        const data = await response.json();

        container.innerHTML = data.teams.map(team => `
            <div class="card" style="text-align:center; padding:20px;">
                <img src="${team.crest}" height="65" alt="${team.name}" style="margin-bottom:10px;">
                <h3 style="margin:0 0 6px 0; color:#0D2B1A;">${team.shortName || team.name}</h3>
                <p style="margin:0 0 8px 0; font-size:0.88em; color:#6B7280;">
                    ${team.venue ? '&#127967; ' + team.venue : ''}
                </p>
                ${team.website ? `<a href="${team.website}" target="_blank"
                    style="color:#0F6A2F; font-weight:bold; font-size:0.82em; text-decoration:none;">
                    Site officiel
                </a>` : ''}
            </div>
        `).join('');

    } catch (e) {
        container.innerHTML = '<p class="chargement">Impossible de charger les equipes. Verifie ta connexion.</p>';
    }
}

// --- CALENDRIER ---
async function chargerCalendrier(codeLigue) {
    const tbody = document.getElementById('body-calendrier');
    if (!tbody) return;

    // Message de chargement dans le tableau
    tbody.innerHTML = '<tr><td colspan="4" class="chargement">Chargement des matchs...</td></tr>';

    try {
        const response = await fetch(
            `${baseUrl}${codeLigue}/matches`,
            { headers: { 'X-Auth-Token': apiKey } }
        );
        const data = await response.json();

        if (!data.matches || data.matches.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="chargement">Aucun match programme.</td></tr>';
            return;
        }

        const aVenir = data.matches.filter(m =>
    m.status === 'SCHEDULED' || m.status === 'TIMED'
);
            tbody.innerHTML = aVenir.slice(0, 10).map(match => `
            <tr>
                <td>${new Date(match.utcDate).toLocaleDateString('fr-FR')}</td>
                <td class="team-cell">
                    <img src="${match.homeTeam.crest}" width="22" alt="">
                    ${match.homeTeam.shortName}
                </td>
                <td style="text-align:center; font-weight:bold; color:#0F6A2F;">vs</td>
                <td class="team-cell">
                    <img src="${match.awayTeam.crest}" width="22" alt="">
                    ${match.awayTeam.shortName}
                </td>
            </tr>
        `).join('');

    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" class="chargement">Erreur de chargement.</td></tr>';
    }
}

// --- CLASSEMENT ---
async function chargerClassement(codeLigue) {
    const tbody = document.getElementById('body-classement');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" class="chargement">Chargement du classement...</td></tr>';

    try {
        const response = await fetch(
            `${baseUrl}${codeLigue}/standings`,
            { headers: { 'X-Auth-Token': apiKey } }
        );
        const data = await response.json();

        // Pour la Coupe du Monde : plusieurs groupes
// Pour les ligues normales : un seul classement
let html = '';

data.standings.forEach(groupe => {
    // Afficher le nom du groupe comme separateur
    if (data.standings.length > 1) {
        html += `<tr style="background:#0F6A2F; color:white;">
            <td colspan="8"><strong>${groupe.group || groupe.stage}</strong></td>
        </tr>`;
    }

    groupe.table.forEach(rang => {
        html += `<tr>
            <td><strong>${rang.position}</strong></td>
            <td class="team-cell">
                <img src="${rang.team.crest}" width="22" alt="">
                ${rang.team.shortName}
            </td>
            <td>${rang.playedGames}</td>
            <td>${rang.won}</td>
            <td>${rang.draw}</td>
            <td>${rang.lost}</td>
            <td>${rang.goalDifference > 0 ? '+' + rang.goalDifference : rang.goalDifference}</td>
            <td><strong style="color:#0F6A2F;">${rang.points}</strong></td>
        </tr>`;
    });
});

tbody.innerHTML = html;
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="8" class="chargement">Erreur de chargement.</td></tr>';
    }
}

// --- FORUM ---
function gererForum() {
    const form = document.getElementById('forum-form');
    const list = document.getElementById('liste-messages');
    const compteur = document.getElementById('forum-compteur');
    if (!form || !list) return;

    // Affiche tous les messages stockes dans localStorage
    const afficher = () => {
        const msgs = JSON.parse(localStorage.getItem('forum_db')) || [];

        // Mettre a jour le compteur de messages
        if (compteur) {
            compteur.textContent = msgs.length + ' message' + (msgs.length > 1 ? 's' : '');
        }

        if (msgs.length === 0) {
            list.innerHTML = '<li style="color:#9CA3AF; font-style:italic;">Aucun message pour le moment. Soyez le premier !</li>';
            return;
        }

        // On affiche du plus recent au plus ancien (reverse)
        list.innerHTML = [...msgs].reverse().map((m, i) => `
            <li class="msg-item">
                <strong>${m.pseudo}</strong> : ${m.texte}
                <small>${m.date}</small>
                <button class="msg-supprimer" onclick="supprimerMessage(${msgs.length - 1 - i})"
                    title="Supprimer">x</button>
            </li>
        `).join('');
    };

    // Soumission du formulaire - ajouter un message
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const pseudo = form.querySelector('[name="pseudo"]').value.trim();
        const texte  = form.querySelector('[name="message"]').value.trim();

        if (pseudo && texte) {
            const msgs = JSON.parse(localStorage.getItem('forum_db')) || [];
            msgs.push({ pseudo, texte, date: new Date().toLocaleString('fr-FR') });
            localStorage.setItem('forum_db', JSON.stringify(msgs));
            form.reset();
            afficher();
        }
    });

    afficher();
}

// Supprimer un message du forum par son index
function supprimerMessage(index) {
    const msgs = JSON.parse(localStorage.getItem('forum_db')) || [];
    msgs.splice(index, 1);
    localStorage.setItem('forum_db', JSON.stringify(msgs));
    gererForum();
}

// --- SONDAGES ---
// Les votes sont sauvegardes dans localStorage et affiches en barres de progression
function gererSondages() {
    const sections = document.querySelectorAll('main section.sondage-section');

    sections.forEach(section => {
        const form  = section.querySelector('form');
        const cle   = section.dataset.cle;   // identifiant unique du sondage
        const affichage = section.querySelector('.sondage-resultat');
        if (!form || !cle) return;

        // Afficher les resultats actuels au chargement
        afficherResultats(cle, affichage);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const choix = form.querySelector('input[type="radio"]:checked');
            if (!choix) {
                alert('Choisis une option avant de voter !');
                return;
            }

            // Sauvegarder le vote dans localStorage
            const votes = JSON.parse(localStorage.getItem('sondage_' + cle)) || {};
            votes[choix.value] = (votes[choix.value] || 0) + 1;
            localStorage.setItem('sondage_' + cle, JSON.stringify(votes));

            // Desactiver le formulaire apres le vote (evite les doubles votes)
            form.querySelectorAll('input[type="radio"]').forEach(r => r.disabled = true);
            form.querySelector('button').disabled = true;
            form.querySelector('button').textContent = 'Vote enregistre !';

            // Afficher les resultats en barres
            afficherResultats(cle, affichage);
        });
    });
}

// Calcule et affiche les barres de progression pour un sondage
function afficherResultats(cle, container) {
    if (!container) return;
    const votes = JSON.parse(localStorage.getItem('sondage_' + cle)) || {};
    const total = Object.values(votes).reduce((a, b) => a + b, 0);

    if (total === 0) {
        container.innerHTML = '<p style="color:#9CA3AF; font-size:0.88em;">Aucun vote pour le moment.</p>';
        return;
    }

    // Construire une barre pour chaque choix qui a recu au moins un vote
    let html = `<h4>Resultats (${total} vote${total > 1 ? 's' : ''}) :</h4>`;
    for (const [valeur, nb] of Object.entries(votes)) {
        const pct = Math.round((nb / total) * 100);
        html += `
            <div class="barre-container">
                <div class="barre-label">
                    <span>${valeur}</span>
                    <span>${pct}% (${nb} vote${nb > 1 ? 's' : ''})</span>
                </div>
                <div class="barre-fond">
                    <div class="barre-remplie" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}
