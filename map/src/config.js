import Overlay from 'ol/Overlay';


// TODO Only works with the English data, should we add a 
// numeric difficulty id property to each feature which 
// works would be independent of language?
let difficultyColours = {
  'Easy Access': '35,200,35',
  'Leisurely': '35,35,200',
  'Easy': '35,200,200',
  'Moderate': '200,200,35',
  'Strenuous': '200,35,35',
  'Mynediad Hawdd': '35,200,35',
  'Hamddenol': '35,35,200',
  'Hawdd': '35,200,200',
  'Cymedrol': '200,200,35',
  'Egnïol': '200,35,35'
}

class Tooltip extends Overlay {
  constructor(opt_options) {
    const elm = document.createElement('div');
    elm.classList.add('tooltip', 'tooltipped');

    const opts = {
      element: elm,
      positioning: 'center-center',
      stopEvent: false,
    };
    for (key in opt_options) {
      opts[key] = opt_options[key];
    }
    super(opts);
  }

  show(coord, text, manual) {
    const map = this.getMap();
    const px = map.getPixelFromCoordinate(coord);
    const size = map.getSize();
    const direction = px[0] < size[0] / 2 ? 'tooltipped-e' : 'tooltipped-w';
    this.getElement().classList.remove('tooltipped-e', 'tooltipped-w');
    this.getElement().classList.add(direction);
    this.getElement().setAttribute('aria-label', text);
    this.setPosition(coord);
    if (manual) {
      this.getElement().classList.add('tooltipped-manual');
    }
  }

  hide() {
    this.getElement().classList.remove('tooltipped-manual');
  }

  manual() {
    this.getElement().classList.contains('tooltipped-manual');
  }
}

export { difficultyColours, Tooltip };
