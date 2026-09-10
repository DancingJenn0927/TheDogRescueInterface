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
   document.querySelector('.modal__contact').classList.add('message-sent');
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
   const contactBox = document.querySelector('.modal__contact');

   form.reset();
   loading.classList.remove('modal__overlay--visible');
   success.classList.remove('modal__overlay--visible');
   contactBox.classList.remove('message-sent');
}
function toggleModal() {
   isModalOpen = !isModalOpen;
   document.body.classList.toggle("modal--open", isModalOpen);
   if (!isModalOpen) {
      document.querySelector('.modal__overlay--loading').classList.remove('modal__overlay--visible');
      document.querySelector('.modal__overlay--success').classList.remove('modal__overlay--visible');
   }
}