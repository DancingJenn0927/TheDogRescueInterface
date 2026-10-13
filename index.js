let isModalOpen = false;

function openMenu() {
        document.body.classList.add('menu--open');
}
function closeMenu() {
    document.body.classList.remove('menu--open');
}

function contact(event) {
    event.preventDefault();
const loading = document.querySelector('.modal__overlay--loading');
const success = document.querySelector('.modal__overlay--success');
loading.classList.add('modal__overlay--visible');
     emailjs
     .sendForm (
     'service_fy9oub3',
     'template_fuj8h98',
        event.target,
       'm26TBAK38im1uZMbF'
    ).then(() => {
    loading.classList.remove("modal__overlay--visible");
   success.classList.add('modal__overlay--visible');
   }).catch(() => {
    loading.classList.remove("modal__overlay--visible");
    alert("The email service is temporarily unavailable. Please contact me directly on jennleah333@gmail.com."
);
   })
}
function closeContactMessage() {
   const form = document.querySelector('#contact__form');
   const loading = document.querySelector('.modal__overlay--loading');
   const success = document.querySelector('.modal__overlay--success');

   form.reset();
   loading.classList.remove('modal__overlay--visible');
   success.classList.remove('modal__overlay--visible');
}
function toggleModal() {
   isModalOpen = !isModalOpen;
   document.body.classList.toggle("modal--open", isModalOpen);
   if (!isModalOpen) {
      document.querySelector('.modal__overlay--loading').classList.remove('modal__overlay--visible');
      document.querySelector('.modal__overlay--success').classList.remove('modal__overlay--visible');
   }
}

async function fetchRescueData(query, endpoint = '/api/search', parameter = 'search') {
    const params = new URLSearchParams({ [parameter]: query });
    const response = await fetch(`${endpoint}?${params}`);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Search failed (${response.status})`);
    }

    const payload = await response.json();
    return {
        items: Array.isArray(payload.data) ? payload.data : [],
        included: Array.isArray(payload.included) ? payload.included : []
    };
}

function getLocation(attributes) {
    const location = attributes.animalLocation || attributes.location;
    if (typeof location === 'string' && location.trim()) {
        return location.trim();
    }

    const city = attributes.city || attributes.orgCity || attributes.animalCity;
    const state = attributes.state || attributes.orgState || attributes.animalState;
    const postalCode = attributes.postalcode || attributes.postalCode || attributes.zip;
    const locality = [city, state].filter(Boolean).join(', ');
    return [locality, postalCode].filter(Boolean).join(' ');
}

function getExternalLink(attributes) {
    const value = attributes.animalUrl
        || attributes.orgUrl
        || attributes.website
        || attributes.webSite
        || attributes.url;

    if (typeof value !== 'string') {
        return '';
    }

    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

function renderResults({ items, included }, containerId = 'search-results') {
    const resultsContainer = document.getElementById(containerId);
    resultsContainer.innerHTML = '';

    if (!items.length) {
        resultsContainer.textContent = 'No results found.';
        return;
    }

    const organizations = new Map(
        included
            .filter((item) => item.type === 'orgs')
            .map((item) => [String(item.id), item.attributes || {}])
    );

    items.forEach((item) => {
        const attributes = item.attributes || item;
        const isOrganization = item.searchKind === 'organization' || item.type === 'orgs';
        const organizationRelationships = item.relationships?.orgs?.data;
        const organizationRelationship = Array.isArray(organizationRelationships)
            ? organizationRelationships[0]
            : organizationRelationships;
        const relatedOrganization = organizationRelationship
            ? organizations.get(String(organizationRelationship.id))
            : undefined;
        const dogCard = document.createElement('article');
        dogCard.classList.add('dog-card');

        const name = document.createElement('h3');
        name.textContent = attributes.name || attributes.orgName || 'Unnamed result';
        dogCard.appendChild(name);

        const details = document.createElement('p');
        const location = getLocation(attributes)
            || (relatedOrganization ? getLocation(relatedOrganization) : '');
        const detailParts = isOrganization
            ? [
                attributes.type,
                location,
                attributes.distance ? `${attributes.distance} miles away` : '',
                attributes.email,
                attributes.phone
            ]
            : [
                attributes.breedString || attributes.breedPrimary || attributes.breed,
                attributes.ageString || attributes.age,
                location
            ];
        details.textContent = detailParts.filter(Boolean).join(' | ') || 'Location/details unavailable';
        dogCard.appendChild(details);

        const relatedOrganizationName = relatedOrganization?.name || relatedOrganization?.orgName;
        if (!isOrganization && relatedOrganizationName) {
            const organizationName = document.createElement('p');
            organizationName.textContent = `Rescue/Shelter: ${relatedOrganizationName}`;
            dogCard.appendChild(organizationName);
        }

        const itemLink = getExternalLink(attributes);
        const organizationLink = relatedOrganization ? getExternalLink(relatedOrganization) : '';
        const link = itemLink || organizationLink;
        if (link) {
            const linkElement = document.createElement('a');
            linkElement.href = link;
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            linkElement.textContent = isOrganization
                ? 'Visit website'
                : itemLink ? 'View dog profile' : 'Visit rescue/shelter website';
            dogCard.appendChild(linkElement);
        }

        resultsContainer.appendChild(dogCard);
    });
}

async function searchDogs() {
    const resultsContainer = document.getElementById('search-results');
    const query = document.getElementById('dog-search').value.trim();
    const searchButton = document.getElementById('dog-search-button');

    searchButton.disabled = true;
    resultsContainer.textContent = 'Searching...';

    try {
        const results = await fetchRescueData(query);
        renderResults(results);
    } catch (error) {
        resultsContainer.textContent = error.message;
        console.error(error);
    } finally {
        searchButton.disabled = false;
    }
}

async function searchSheltersByZip() {
    const resultsContainer = document.getElementById('zip-search-results');
    const query = document.getElementById('zip-search').value.trim();
    const searchButton = document.getElementById('zip-search-button');

    if (!/^\d{5}$/.test(query)) {
        resultsContainer.textContent = 'Enter a valid 5-digit US ZIP code.';
        return;
    }

    searchButton.disabled = true;
    resultsContainer.textContent = 'Searching for shelters within 25 miles...';

    try {
        const results = await fetchRescueData(query, '/api/shelters/nearby', 'zip');
        renderResults(results, 'zip-search-results');
    } catch (error) {
        resultsContainer.textContent = error.message;
        console.error(error);
    } finally {
        searchButton.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('dog-search-button');
    const searchInput = document.getElementById('dog-search');
    const zipSearchButton = document.getElementById('zip-search-button');
    const zipSearchInput = document.getElementById('zip-search');

    searchButton.addEventListener('click', searchDogs);
    zipSearchButton.addEventListener('click', searchSheltersByZip);
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            searchDogs();
        }
    });
    zipSearchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            searchSheltersByZip();
        }
    });
});
