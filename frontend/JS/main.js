class HeroSlider {
  constructor() {
    this.slides = document.querySelectorAll('.slide');
    this.indicators = document.querySelectorAll('.indicator');
    this.currentSlide = 0;
    this.slideInterval = null;
    this.slideDuration = 5000; // 5 segundos - cambia a 7000 si quieres 7 segundos

    this.init();
  }

  init() {
    // Iniciar el slider automático
    this.startAutoSlide();
    
    // Agregar eventos a los indicadores
    this.indicators.forEach(indicator => {
      indicator.addEventListener('click', (e) => {
        const slideIndex = parseInt(e.target.getAttribute('data-slide'));
        this.goToSlide(slideIndex);
        this.restartAutoSlide();
      });
    });

    // Pausar slider cuando el mouse está encima
    const slider = document.querySelector('.hero-slider');
    slider.addEventListener('mouseenter', () => this.stopAutoSlide());
    slider.addEventListener('mouseleave', () => this.startAutoSlide());
  }

  goToSlide(slideIndex) {
    // Remover clase active de todos los slides e indicadores
    this.slides.forEach(slide => slide.classList.remove('active'));
    this.indicators.forEach(indicator => indicator.classList.remove('active'));

    // Agregar clase active al slide e indicador actual
    this.slides[slideIndex].classList.add('active');
    this.indicators[slideIndex].classList.add('active');
    
    this.currentSlide = slideIndex;
  }

  nextSlide() {
    const next = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(next);
  }

  startAutoSlide() {
    this.stopAutoSlide(); // Limpiar intervalo existente
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, this.slideDuration);
  }

  stopAutoSlide() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  restartAutoSlide() {
    this.stopAutoSlide();
    this.startAutoSlide();
  }
}

// Inicializar el slider cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new HeroSlider();
});