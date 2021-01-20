const { Container} = global.PIXI;
export default class Hero extends Container{
  constructor({type, coordinates: coord}) {
    super();
    this.type = type;
    this.color = type.color;
    this.coord = coord;
    this.interactive = true;

    this.on('pointerdown', () => $(window).trigger('hero:click'));
  }

  setCoord(coord) {
    this.coord = coord;
  }
}
