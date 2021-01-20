import Cell from "./Cell";
import settings from "../../splashy/settings";
import {randInteger} from "../../../framework/utils/random";

export default class CellController {
  constructor(field, goodsContainer, widthContainer) {
    this.field = field;
    this.goodsContainer = goodsContainer;
    this.isCellsActive = false;
    this.widthContainer = widthContainer;
    this.storageCells = [];

    this.addCellsToContainer();
    this.drawCells();
  }

  addCellsToContainer() {
    const {goodsContainer, field} = this;
    const {cells} = field;
    cells.forEach(cell => {
      cell.isActive = false;
      cell.isTaken = false;
      goodsContainer.addChild(cell);
    });
  }

  reset() {
    const {goodsContainer, storageCells} = this;
    this.isCellsActive = false;

    let i = goodsContainer.children.length;
    while (i--) {
      const item = goodsContainer.children[i];
      if (item instanceof Cell) {
        goodsContainer.removeChild(item);
      }
    }

    storageCells.forEach(cell => cell.isTaken = false);
    this.drawCells();
    this.addCellsToContainer();
  }

  drawCells() {
    const {storageCells, field} = this;
    const {cells, width, height} = field;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const {coord, color} = cell;
      // есть ячейка в храналище
      const foundCell = storageCells.find(storageCell => storageCell.color === cell.color
        && !storageCell.isTaken); // не взята

      if (foundCell) {
        foundCell.isTaken = true; // ячейка стала использоваться
        foundCell.position.set(coord.x * width, coord.y * height);
        foundCell.coord = cell.coord;
        cells.splice(i, 1, foundCell);
        if (foundCell.firstClip) {
          foundCell.firstClip.visible = false;
          foundCell.firstClip.gotoAndStop(0);
        }
        if (foundCell.finishedClip) {
          foundCell.finishedClip.visible = false;
          foundCell.finishedClip.gotoAndStop(0);
        }
        continue;
      }

      cell.position.set(coord.x * width, coord.y * height);
      const clipName = settings.colors[color].cell.animation;

      const clip = new global.lib[clipName];
      cell.addChild(clip);
      clip.scale.set(width / clip.width, height / clip.height);
      this.scaleCell = new PIXI.Point(clip.scale.x, clip.scale.y);

      cell.on('pointerup', (e) => {
        if (!this.isCellsActive) return;
        $(window).trigger('cell:active', e.target);
      })

      cell.isTaken = true; // создается новая ячейка
      storageCells.push(cell);
    }
    this.firstLastAnimation(cells[0]);
  }

  deleteClip = (cell) => {
    PIXI.animate.Animator.play(cell.finishedClip, 'out', () => {
      cell.finishedClip.visible = false;
    })
  }

  firstLastAnimation(cell1, cell2) {
    const {goodsContainer, scaleCell} = this;
    const colorType = settings.colors[cell1.color];
    const numberAnimation = randInteger(0, colorType.choose.length - 1);
    if (!cell1.firstClip || cell1.color === 'circleblack') {
      const clipName = colorType.choose[numberAnimation].animation;
      cell1.firstClip = new global.lib[clipName];
      const firstClip = cell1.firstClip;

      firstClip.scale.set(scaleCell.x, scaleCell.y);
      cell1.addChild(firstClip);
    } else {
      cell1.firstClip.visible = true;
    }
    PIXI.animate.Animator.play(cell1.firstClip, 'in');

    goodsContainer.removeChild(cell1);
    goodsContainer.addChild(cell1);
    if (cell2) {
      goodsContainer.removeChild(cell2);
      goodsContainer.addChild(cell2);
    }
  }

  finishedAnimationOnLine(cell1, cell2, angle) {
    const {goodsContainer, scaleCell} = this;
    const numberAnimation = randInteger(0, 2);
    let clipName
    if (cell1.color === 'black') return;

    if (!cell1.finishedClip) {
      clipName = settings.colors[cell1.color].finish[numberAnimation].animation;
      cell1.finishedClip = new global.lib[clipName];
      const finishedClip = cell1.finishedClip;
      cell1.addChild(finishedClip);
    } else
      cell1.finishedClip.visible = true;

    PIXI.animate.Animator.play(cell1.finishedClip, 'in');
    cell1.finishedClip.scale.set(scaleCell.x, scaleCell.y);

    cell1.rotation = angle;

    goodsContainer.removeChild(cell2);
    goodsContainer.addChild(cell2);
    goodsContainer.removeChild(cell1);
    goodsContainer.addChild(cell1);
  }


  toggleCells = (value) => {
    this.isCellsActive = value;
  }


}
