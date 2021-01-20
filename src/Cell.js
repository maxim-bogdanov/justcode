const { Container, Graphics } = global.PIXI;
export default class Cell extends Container{
  constructor({type, coordinates: coord}) {
    super();
    this.type = type;
    this.color = type.color;
    this.coord = coord;
    this.isActive = false;
    this.interactive = true;
    this.buttonMode = true;

    this.on('pointerdown', () => $(window).trigger('cell:click', this));
  }
}
