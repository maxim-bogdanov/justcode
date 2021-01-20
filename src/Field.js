import Cell from "./Cell";
import Hero from "./Hero";

export default class Field{
  constructor(levels, number, widthContainer) {
    this.levels = levels;
    this.number = number;
    this.widthContainer = widthContainer;
    this.cellsData = levels[number].cells;
    this.size = levels[number].size;
    this.width = widthContainer / this.size.x;
    this.height = widthContainer / this.size.y;
    this.cells = [];

    this.createHero();
    this.createCells();
  }

  reset(number) {
    const {levels} = this;
    this.number = number;
    this.cellsData = levels[number].cells;
    this.size = levels[number].size;

    const {cellsData, widthContainer} = this;
    const heroData = cellsData[0];

    this.width = widthContainer / this.size.x;
    this.height = widthContainer / this.size.y;
    this.cells.length = 0;

    this.hero.setCoord(heroData.coordinates);

    this.createCells();
  }

  createHero() {
    const {cellsData} = this;
    const heroData = cellsData[0];
    this.hero = new Hero(heroData);
  }

  createCells() {
    const {cellsData, cells} = this;
    for (let i = 1; i < cellsData.length; i++) {
      const cellData = cellsData[i];
      const cell = new Cell(cellData);
      cells.push(cell);
    }
  }
}
