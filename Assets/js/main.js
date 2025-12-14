// @js
// Main portfolio script using a simple OOP structure.

class ScrollAnimator {
  constructor(selector, options = {}) {
    this.selector = selector;
    this.threshold = options.threshold ?? 0.2;
    this.rootMargin = options.rootMargin ?? '0px 0px -60px 0px';
    this.observer = null;
  }

  init() {
    const elements = document.querySelectorAll(this.selector);
    if (!('IntersectionObserver' in window) || elements.length === 0) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-visible');
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: this.threshold,
        rootMargin: this.rootMargin,
      }
    );

    elements.forEach((el) => this.observer.observe(el));
  }
}

class NavigationHighlighter {
  constructor(navSelector, sectionSelector) {
    this.navLinks = document.querySelectorAll(navSelector);
    this.sections = document.querySelectorAll(sectionSelector);
  }

  init() {
    if (!this.navLinks.length || !this.sections.length) return;

    window.addEventListener('scroll', () => this.handleScroll());
    this.handleScroll();
  }

  handleScroll() {
    const scrollPosition =
      window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

    let currentId = null;
    this.sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const offsetTop = rect.top + scrollPosition - 120;
      if (scrollPosition >= offsetTop) {
        currentId = section.id;
      }
    });

    this.navLinks.forEach((link) => {
      link.classList.remove('nav-link-active');
      const href = link.getAttribute('href');
      if (currentId && href === `#${currentId}`) {
        link.classList.add('nav-link-active');
      }
    });
  }
}

class CertificateGallery {
  constructor() {
    this.gallery = document.querySelector('[data-cert-gallery]');
    this.toggleButton = this.gallery
      ? this.gallery.querySelector('[data-cert-toggle]')
      : null;
    this.toggleWrapper = this.gallery
      ? this.gallery.querySelector('[data-cert-toggle-wrapper]')
      : null;
    this.cards = this.gallery
      ? Array.from(this.gallery.querySelectorAll('[data-cert-card]'))
      : [];
    this.modal = null;
    this.modalImage = null;
    this.modalCaption = null;
    this.collapsedHeight = 0;
    this.expandedHeight = 0;
    this.isExpanded = false;
    this.onTransitionEnd = this.handleTransitionEnd.bind(this);
  }

  init() {
    if (!this.gallery || !this.cards.length) return;

    // enable animated height for the gallery container
    this.gallery.classList.add('cert-gallery-animate');
    this.collapsedHeight = this.gallery.offsetHeight;
    this.expandedHeight = this.collapsedHeight;
    this.gallery.style.maxHeight = `${this.collapsedHeight}px`;
    this.gallery.addEventListener('transitionend', this.onTransitionEnd);

    this.createModal();
    this.bindToggle();
    this.bindCards();
  }

  bindToggle() {
    if (!this.toggleButton || !this.toggleWrapper) return;

    const handleToggle = () => {
      const extras = this.gallery.querySelectorAll('.cert-extra');
      const isHidden =
        extras.length && extras[0].classList.contains('hidden');

      if (!this.isExpanded) {
        // measure current (collapsed) height before expanding
        this.collapsedHeight = this.gallery.offsetHeight;
      }

      extras.forEach((card) => {
        if (isHidden) {
          card.classList.remove('hidden', 'cert-animate-out');
          // restart animation
          card.classList.remove('cert-animate-in');
          // eslint-disable-next-line no-unused-expressions
          card.offsetWidth;
          card.classList.add('cert-animate-in');
        } else {
          card.classList.remove('cert-animate-in');
          card.classList.add('cert-animate-out');

          const handleEnd = () => {
            card.removeEventListener('animationend', handleEnd);
            card.classList.add('hidden');
            card.classList.remove('cert-animate-out');
          };

          card.addEventListener('animationend', handleEnd);
        }
      });

      if (isHidden) {
        // extras are about to be shown; animate container height to new size
        this.expandedHeight = this.gallery.scrollHeight;
        this.gallery.style.maxHeight = `${this.collapsedHeight}px`;
        // eslint-disable-next-line no-unused-expressions
        this.gallery.offsetHeight;
        this.gallery.style.maxHeight = `${this.expandedHeight}px`;
        this.isExpanded = true;
      } else {
        // collapse back to original height
        this.gallery.style.maxHeight = `${this.expandedHeight}px`;
        // eslint-disable-next-line no-unused-expressions
        this.gallery.offsetHeight;
        this.gallery.style.maxHeight = `${this.collapsedHeight}px`;
        this.isExpanded = false;
      }

      this.toggleButton.textContent = isHidden ? 'Show fewer' : 'View more';

      // small motion animation on the tile itself
      this.toggleWrapper.classList.remove('cert-toggle-animate');
      // eslint-disable-next-line no-unused-expressions
      this.toggleWrapper.offsetWidth;
      this.toggleWrapper.classList.add('cert-toggle-animate');
    };

    this.toggleWrapper.addEventListener('click', handleToggle);
  }

  handleTransitionEnd(event) {
    if (
      !this.gallery ||
      event.target !== this.gallery ||
      event.propertyName !== 'max-height'
    ) {
      return;
    }

    // After the expand/collapse animation, let the gallery height
    // auto-fit the content to avoid large empty space.
    this.gallery.style.maxHeight = '';
  }

  bindCards() {
    this.cards.forEach((card) => {
      card.addEventListener('click', () => {
        const src = card.getAttribute('data-src');
        const title = card.getAttribute('data-title') ?? '';
        this.openModal(src, title);
      });
    });
  }

  createModal() {
    const modal = document.createElement('div');
    modal.id = 'cert-modal';
    modal.className =
      'fixed inset-0 z-50 hidden items-center justify-center bg-black/70 p-4';
    modal.innerHTML = `
      <div class="cert-modal-inner relative max-w-3xl w-full rounded-2xl bg-slate-950 border border-slate-700/80 shadow-2xl">
        <button type="button" data-cert-modal-close
          class="absolute right-3 top-3 rounded-full bg-slate-800/80 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700">
          ✕
        </button>
        <div class="p-4 md:p-6">
          <img data-cert-modal-img src="" alt="Certificate preview"
            class="max-h-[70vh] w-full rounded-xl object-contain bg-black/40" />
          <p data-cert-modal-caption class="mt-3 text-[11px] text-slate-300"></p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;
    this.modalImage = modal.querySelector('[data-cert-modal-img]');
    this.modalCaption = modal.querySelector('[data-cert-modal-caption]');

    const closeBtn = modal.querySelector('[data-cert-modal-close]');
    closeBtn.addEventListener('click', () => this.closeModal());
    modal.addEventListener('click', (event) => {
      if (event.target === modal) this.closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeModal();
    });
  }

  openModal(src, title) {
    if (!this.modal || !this.modalImage || !src) return;
    this.modalImage.src = src;
    this.modalImage.alt = title || 'Certificate preview';
    if (this.modalCaption) {
      this.modalCaption.textContent = title;
    }
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');

    const inner = this.modal.querySelector('.cert-modal-inner');
    if (inner) {
      inner.classList.remove('modal-animate-in', 'modal-animate-out');
      // eslint-disable-next-line no-unused-expressions
      inner.offsetWidth;
      inner.classList.add('modal-animate-in');
    }
  }

  closeModal() {
    if (!this.modal) return;

    const inner = this.modal.querySelector('.cert-modal-inner');
    if (inner) {
      inner.classList.remove('modal-animate-in');
      inner.classList.add('modal-animate-out');

      const handleEnd = () => {
        inner.removeEventListener('animationend', handleEnd);
        inner.classList.remove('modal-animate-out');
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
      };

      inner.addEventListener('animationend', handleEnd);
    } else {
      this.modal.classList.add('hidden');
      this.modal.classList.remove('flex');
    }
  }
}

class ProjectDetailsModal {
  constructor() {
    this.triggers = document.querySelectorAll('[data-project-open]');
    this.details = new Map();

    document.querySelectorAll('[data-project-details]').forEach((el) => {
      const key = el.getAttribute('data-project-details');
      if (key) {
        this.details.set(key, el);
      }
    });

    this.modal = null;
    this.modalTitle = null;
    this.modalBody = null;
  }

  init() {
    if (!this.triggers.length || !this.details.size) return;

    this.createModal();
    this.bindTriggers();
  }

  bindTriggers() {
    this.triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const key = trigger.getAttribute('data-project-open');
        this.open(key);
      });
    });
  }

  createModal() {
    const modal = document.createElement('div');
    modal.id = 'project-modal';
    modal.className =
      'fixed inset-0 z-50 hidden items-center justify-center bg-black/70 p-4';
    modal.innerHTML = `
      <div class="project-modal-inner relative max-w-3xl w-full max-h-[80vh] overflow-hidden rounded-2xl bg-slate-950 border border-slate-700/80 shadow-2xl">
        <button type="button" data-project-modal-close
          class="absolute right-3 top-3 rounded-full bg-slate-800/80 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700">
          ✕
        </button>
        <div class="flex flex-col gap-3 p-4 md:p-6 h-full">
          <h3 data-project-modal-title class="text-sm font-semibold text-slate-50"></h3>
          <div data-project-modal-body class="flex-1 overflow-y-auto pr-1 text-[11px] text-slate-200 leading-relaxed"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;
    this.modalTitle = modal.querySelector('[data-project-modal-title]');
    this.modalBody = modal.querySelector('[data-project-modal-body]');

    const closeBtn = modal.querySelector('[data-project-modal-close]');
    closeBtn.addEventListener('click', () => this.close());
    modal.addEventListener('click', (event) => {
      if (event.target === modal) this.close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
    });
  }

  open(key) {
    if (!this.modal || !this.modalBody || !key) return;

    const template = this.details.get(key);
    if (!template) return;

    const title =
      template.getAttribute('data-project-title') || 'Project details';
    if (this.modalTitle) {
      this.modalTitle.textContent = title;
    }

    this.modalBody.innerHTML = template.innerHTML;
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');

    const inner = this.modal.querySelector('.project-modal-inner');
    if (inner) {
      inner.classList.remove('modal-animate-in', 'modal-animate-out');
      // eslint-disable-next-line no-unused-expressions
      inner.offsetWidth;
      inner.classList.add('modal-animate-in');
    }
  }

  close() {
    if (!this.modal) return;

    const inner = this.modal.querySelector('.project-modal-inner');
    if (inner) {
      inner.classList.remove('modal-animate-in');
      inner.classList.add('modal-animate-out');

      const handleEnd = () => {
        inner.removeEventListener('animationend', handleEnd);
        inner.classList.remove('modal-animate-out');
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
      };

      inner.addEventListener('animationend', handleEnd);
    } else {
      this.modal.classList.add('hidden');
      this.modal.classList.remove('flex');
    }
  }
}

class ProjectFilter {
  constructor() {
    this.buttons = document.querySelectorAll('[data-project-filter]');
    this.cards = document.querySelectorAll('[data-project-tags]');
  }

  init() {
    if (!this.buttons.length || !this.cards.length) return;

    this.buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-project-filter') ?? 'all';
        this.applyFilter(filter);
        this.updateActiveButton(btn);
      });
    });
  }

  updateActiveButton(activeBtn) {
    this.buttons.forEach((btn) => {
      btn.classList.remove('project-filter-pill-active');
    });
    activeBtn.classList.add('project-filter-pill-active');
  }

  applyFilter(filter) {
    const normalized = filter.toLowerCase();

    this.cards.forEach((card) => {
      const tags = (card.getAttribute('data-project-tags') || '').toLowerCase();
      const isMatch =
        normalized === 'all' ||
        tags.split(/\s+/).some((tag) => tag && tag === normalized);

      if (isMatch) {
        card.classList.remove('hidden');
        card.classList.add('cert-animate-in');
      } else {
        card.classList.add('hidden');
      }
    });
  }
}

class PortfolioApp {
  constructor() {
    this.scrollAnimator = new ScrollAnimator('.section-observe');
    this.navHighlighter = new NavigationHighlighter(
      'header nav a',
      'main section[id]'
    );
    this.certificateGallery = new CertificateGallery();
    this.projectDetailsModal = new ProjectDetailsModal();
    this.projectFilter = new ProjectFilter();
  }

  init() {
    this.scrollAnimator.init();
    this.navHighlighter.init();
    this.certificateGallery.init();
    this.projectDetailsModal.init();
    this.projectFilter.init();
    this.setCurrentYear();
  }

  setCurrentYear() {
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear().toString();
    }
  }
}

// Initialize the portfolio when DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
  const app = new PortfolioApp();
  app.init();
});

/**
 * @api
 * External libraries & configuration:
 * - Tailwind CSS loaded via CDN in index.html
 *   <script src="https://cdn.tailwindcss.com"></script>
 * - Tailwind theme extended with custom `portfolio` color palette
 *   in the inline tailwind.config script within index.html.
 *
 * This file focuses only on interaction logic and scroll animations.
 */


