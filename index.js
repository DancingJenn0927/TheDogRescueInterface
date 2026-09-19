let isModalOpen = false;

function openMenu() {
    document.body.classList += "menu--open";
}
function closeMenu() {
  document.body.classList.remove('menu--open')
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

async function fetchDogRescueData(query) {
    const response = await fetch(`/api/dogs?search=${encodeURIComponent(query)}`);

    if (!response.ok) {
        throw new Error(`Search failed (${response.status})`);
    }

    const data = await response.json();
    return data.data || data;
}

function renderDogResults(dogs) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';

    if (!dogs.length) {
        resultsContainer.textContent = 'No dogs found.';
        return;
    }

    dogs.forEach((dog) => {
        const attributes = dog.attributes || dog;
        const dogCard = document.createElement('div');
        dogCard.classList.add('dog-card');

        const name = document.createElement('h3');
        name.textContent = attributes.name || 'Unnamed dog';
        dogCard.appendChild(name);

        const details = document.createElement('p');
        details.textContent = [
            attributes.breedPrimary || attributes.breed,
            attributes.ageString || attributes.age,
            attributes.city || attributes.state
        ].filter(Boolean).join(' | ') || 'Details unavailable';
        dogCard.appendChild(details);
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
        const dogs = await fetchDogRescueData(query);
        renderDogResults(dogs);
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

    searchButton.addEventListener('click', searchDogs);
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            searchDogs();
        }
    });
});

