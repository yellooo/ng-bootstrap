import {
  Component,
  Directive,
  TemplateRef,
  ContentChildren,
  QueryList,
  Input,
  OnDestroy,
  AfterContentChecked,
  OnInit
} from '@angular/core';
import {NgbCarouselConfig} from './carousel-config';

let nextId = 0;

/**
 * Represents an individual slide to be used within a carousel.
 */
@Directive({selector: 'template[ngbSlide]'})
export class NgbSlide {
  /**
   * Unique slide identifier. Must be unique for the entire document for proper accessibility support.
   * Will be auto-generated if not provided.
   */
  @Input() id = `ngb-slide-${nextId++}`;
  constructor(public tplRef: TemplateRef<any>) {}
}

/**
 * Directive to easily create carousels based on Bootstrap's markup.
 */
@Component({
  selector: 'ngb-carousel',
  exportAs: 'ngbCarousel',
  host: {
    'class': 'carousel slide',
    '[style.display]': '"block"',
    'tabIndex': '0',
    '(mouseenter)': 'pause()',
    '(mouseleave)': 'cycle()',
    '(keydown.arrowLeft)': 'keyPrev()',
    '(keydown.arrowRight)': 'keyNext()'
  },
  template: `
    <ol class="carousel-indicators">
      <li *ngFor="let slide of slides" [id]="slide.id" [class.active]="slide.id === activeId" (click)="cycleToSelected(slide.id)"></li>
    </ol>
    <div class="carousel-inner" role="listbox">
      <div *ngFor="let slide of slides" class="carousel-item" [class.active]="slide.id === activeId" 
      [class.slide-left]="slideLeft === true && slide.id === activeId">
        <template [ngTemplateOutlet]="slide.tplRef"></template>
      </div>
    </div>
    <a class="left carousel-control-prev" role="button" (click)="cycleToPrev(); slideLeft = true">
      <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      <span class="sr-only">Previous</span>
    </a>
    <a class="right carousel-control-next" role="button" (click)="cycleToNext(); slideLeft = false">
      <span class="carousel-control-next-icon" aria-hidden="true"></span>
      <span class="sr-only">Next</span>
    </a>
    `
})
export class NgbCarousel implements AfterContentChecked,
    OnDestroy, OnInit {
  @ContentChildren(NgbSlide) slides: QueryList<NgbSlide>;
  private _slideChangeInterval;
  public slideLeft: boolean = false;

  /**
   * Amount of time in milliseconds before next slide is shown.
   */
  @Input() interval: number;

  /**
   * Whether can wrap from the last to the first slide.
   */
  @Input() wrap: boolean;

  /**
   * A flag for allowing navigation via keyboard
   */
  @Input() keyboard: boolean;

  /**
   * The active slide id.
   */
  @Input() activeId: string;

  constructor(config: NgbCarouselConfig) {
    this.interval = config.interval;
    this.wrap = config.wrap;
    this.keyboard = config.keyboard;
  }

  ngAfterContentChecked() {
    let activeSlide = this._getSlideById(this.activeId);
    this.activeId = activeSlide ? activeSlide.id : (this.slides.length ? this.slides.first.id : null);
  }

  ngOnInit() { this._startTimer(); }

  ngOnDestroy() { clearInterval(this._slideChangeInterval); }

  /**
   * Navigate to a slide with the specified identifier.
   */
  select(slideId: string) {
    this.cycleToSelected(slideId);
    this._restartTimer();
  }

  /**
   * Navigate to the next slide.
   */
  prev() {
    this.cycleToPrev();
    this._restartTimer();
  }

  /**
   * Navigate to the next slide.
   */
  next() {
    this.cycleToNext();
    this._restartTimer();
  }

  /**
   * Stops the carousel from cycling through items.
   */
  pause() { this._stopTimer(); }

  /**
   * Restarts cycling through the carousel slides from left to right.
   */
  cycle() { this._startTimer(); }

  cycleToNext() { this.cycleToSelected(this._getNextSlide(this.activeId)); }

  cycleToPrev() { this.cycleToSelected(this._getPrevSlide(this.activeId)); }

  cycleToSelected(slideIdx: string) {
    let selectedSlide = this._getSlideById(slideIdx);
    if (selectedSlide) {
      this.activeId = selectedSlide.id;
    }
  }

  keyPrev() {
    if (this.keyboard) {
      this.prev();
    }
  }

  keyNext() {
    if (this.keyboard) {
      this.next();
    }
  }

  private _restartTimer() {
    this._stopTimer();
    this._startTimer();
  }

  private _startTimer() {
    if (this.interval > 0) {
      this._slideChangeInterval = setInterval(() => { this.cycleToNext(); }, this.interval);
    }
  }

  private _stopTimer() { clearInterval(this._slideChangeInterval); }

  private _getSlideById(slideId: string): NgbSlide {
    let slideWithId: NgbSlide[] = this.slides.filter(slide => slide.id === slideId);
    return slideWithId.length ? slideWithId[0] : null;
  }

  private _getSlideIdxById(slideId: string): number {
    return this.slides.toArray().indexOf(this._getSlideById(slideId));
  }

  private _getNextSlide(currentSlideId: string): string {
    const slideArr = this.slides.toArray();
    const currentSlideIdx = this._getSlideIdxById(currentSlideId);
    const isLastSlide = currentSlideIdx === slideArr.length - 1;

    return isLastSlide ? (this.wrap ? slideArr[0].id : slideArr[slideArr.length - 1].id) :
                         slideArr[currentSlideIdx + 1].id;
  }

  private _getPrevSlide(currentSlideId: string): string {
    const slideArr = this.slides.toArray();
    const currentSlideIdx = this._getSlideIdxById(currentSlideId);
    const isFirstSlide = currentSlideIdx === 0;

    return isFirstSlide ? (this.wrap ? slideArr[slideArr.length - 1].id : slideArr[0].id) :
                          slideArr[currentSlideIdx - 1].id;
  }
}

export const NGB_CAROUSEL_DIRECTIVES = [NgbCarousel, NgbSlide];
