type CarouselScope = HTMLElement & { __brokawCarouselTimer?: number };

function setSlideState(slides: HTMLElement[], dots: HTMLElement[], index: number): void {
  slides.forEach((slide, slideIndex) => {
    const active = slideIndex === index;
    slide.classList.toggle('hidden', !active);
    slide.classList.toggle('opacity-0', !active);
    slide.classList.toggle('opacity-100', active);
    slide.classList.toggle('active', active);
  });

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle('active', dotIndex === index);
  });
}

export function initCarousels(root: ParentNode = document): void {
  const scopes = root.querySelectorAll<CarouselScope>('[data-carousel]');

  scopes.forEach((scope) => {
    if (scope.dataset.carouselBound === 'true') return;

    const slides = Array.from(scope.querySelectorAll<HTMLElement>('.carousel-slide'));
    if (slides.length === 0) {
      scope.dataset.carouselBound = 'true';
      return;
    }

    const dots = Array.from(scope.querySelectorAll<HTMLElement>('.carousel-dot'));
    const nextButton = scope.querySelector<HTMLElement>('.carousel-next');
    const activeIndex = slides.findIndex((slide) => slide.classList.contains('active'));
    let currentIndex = activeIndex >= 0 ? activeIndex : 0;

    const clearTimer = () => {
      if (!scope.__brokawCarouselTimer) return;
      window.clearInterval(scope.__brokawCarouselTimer);
      delete scope.__brokawCarouselTimer;
    };

    const startTimer = () => {
      clearTimer();
      if (slides.length < 2) return;

      scope.__brokawCarouselTimer = window.setInterval(() => {
        if (!document.contains(scope)) {
          clearTimer();
          return;
        }
        currentIndex = (currentIndex + 1) % slides.length;
        setSlideState(slides, dots, currentIndex);
      }, 6000);
    };

    const goToSlide = (nextIndex: number) => {
      currentIndex = nextIndex;
      setSlideState(slides, dots, currentIndex);
      startTimer();
    };

    dots.forEach((dot, dotIndex) => {
      dot.addEventListener('click', () => goToSlide(dotIndex));
    });

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        goToSlide((currentIndex + 1) % slides.length);
      });
    }

    scope.addEventListener('mouseenter', clearTimer);
    scope.addEventListener('mouseleave', startTimer);

    setSlideState(slides, dots, currentIndex);
    startTimer();
    scope.dataset.carouselBound = 'true';
  });
}
