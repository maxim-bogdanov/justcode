const { Container} = global.PIXI;

export default class Line extends Container{
  constructor(cell1, cell2) {
    super();
    this.cell1 = cell1;
    this.cell2 = cell2;
    this.coord = {};

    this.initCoord();
    this.setColor();

  }

  setColor() {
    const {cell2} = this;
    this.color = cell2.color;
  }


  initCoord() {
    const {cell1, cell2, coord} = this;
    this.direction = cell1.y !== cell2.y ? 'vertical' : 'horizontal';

    coord.start = {x: cell2.coord.x, y: cell2.coord.y};
    coord.end = {x: cell1.coord.x, y: cell1.coord.y};
    // console.log(coord)
  }
}
