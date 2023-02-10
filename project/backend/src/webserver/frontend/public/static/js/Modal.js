class Modal {
  constructor(modal, toggle, mobileMediaQuery) {
    this.modalOverlay = modal;
    this.modalToggle = toggle;
    this.mobileMediaQuery = mobileMediaQuery ?? '(min-width: 48rem)';

    this.modal = this.modalOverlay.querySelector('.modal__dialog');
    this.modalCloseBtn = this.modal.querySelector('[data-dismiss="modal"]');
    this.open = false;
    this.trappedFocus = null;

    this.modalToggle.addEventListener('click', this.openModal);
    this.modalOverlay.addEventListener('click', this.closeModal);
    this.modalOverlay.addEventListener('keyup', (evt) => {
      if (evt.key === 'Escape') {
        this.toggleModal(this.modalToggle);
        this.trappedFocus.onClose();
      }
    });

    const mediaQuery = window.matchMedia(this.mobileMediaQuery);
    const handleTabletChange = (evt) => {
      // Check if the media query is true
      if (evt.matches && this.open) {
        // Then log the following message to the console
        this.closeModal();
      }
    };
    // Register event listener
    mediaQuery.addEventListener('change', handleTabletChange);
  }

  toggleModal = (target) => {
    target.classList.toggle('active');
    target.setAttribute('aria-expanded', !(target.ariaExpanded === 'true'));
    document.body.classList.toggle('no-scroll');
    this.modalOverlay.classList.toggle('active');
  };

  closeModal = (evt) => {
    if (!this.modal.contains(evt.target) || evt.target == this.modalCloseBtn) {
      this.open = false;

      // mobile position
      const scrollY = document.body.style.top;
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
      this.toggleModal(this.modalToggle);
      document.body.removeAttribute('aria-hidden');
      this.trappedFocus.onClose();
    }
  };
  openModal = (evt) => {
    this.open = true;
    // mobile position
    document.body.style.top = `-${window.scrollY}px`;
    this.toggleModal(evt.target);
    document.body.setAttribute('aria-hidden', 'true');
    // focus trap
    this.trappedFocus = this.trapFocus(evt.target);
    this.modalCloseBtn.focus(); // optional
  };

  trapFocus = (lastActiveElement) => {
    lastActiveElement = lastActiveElement ?? document.activeElement;
    const focusableElements = Array.from(
      this.modal.querySelectorAll(
        'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])',
      ),
    );

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement =
      focusableElements[focusableElements.length - 1];
    let currentFocus = null;

    firstFocusableElement.focus();
    currentFocus = firstFocusableElement;

    const handleFocus = (evt) => {
      evt.preventDefault();
      // if the focused element "lives" in your modal container then just focus it
      if (focusableElements.includes(evt.target)) {
        currentFocus = evt.target;
      } else {
        // you're out of the container
        // if previously the focused element was the first element then focus the last
        // element - means you were using the shift key
        if (currentFocus === firstFocusableElement) {
          lastFocusableElement.focus();
        } else {
          // you previously were focused on the last element so just focus the first one
          firstFocusableElement.focus();
        }
        // update the current focus var
        currentFocus = document.activeElement;
      }
    };

    document.addEventListener('focus', handleFocus, true);
    return {
      onClose: () => {
        document.removeEventListener('focus', handleFocus, true);
        lastActiveElement.focus();
      },
    };
  };
}

export default Modal;
