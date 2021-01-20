import Line from "./Line";
import settings from "../../splashy/settings";
import {randInteger} from "../../../framework/utils/random";
import gsap,{Power1} from "gsap";
import $ from "jquery";


export default class LineController{
  constructor(field,goodsContainer) {
    this.field = field;
    this.lines = [];
    this.storageLines = [];
    this.goodsContainer = goodsContainer;

    $(window).on('MoveController:FinishAnimation', this.killLine);
    $(window).on('MoveController:changeLine', this.changeLine);
  }

  reset() {
    const {goodsContainer, lines, storageLines} = this;

    let i = lines.length;
    while (i--) {
      goodsContainer.removeChild(lines[i]);
    }

    storageLines.forEach(line => line.isTaken = false);
    this.lines.length = 0;
    this.line = null;
  }

  changeLine = (e, cell1, cell2, resolve) => {
    const foundLine = this.findLine(cell1, cell2);
    this.$game = $('.game');
    if (!foundLine){
      this.addLine(cell1, cell2, resolve);
      return;
    }
    this.deleteLine(foundLine, cell1, cell2, resolve);
  }

  deleteLine(foundLine, cell1, cell2, resolve) {
    const {$game, lines} = this;
    cell2.isActive = false; // текущая ячейка
    this.line = foundLine;

    const index = this.lines.findIndex(line_ => line_ === foundLine);
    lines.splice(index, 1);

    $game.trigger('LineContoller:lineDelete', [-1, foundLine.cell1]);
    this.hideLine(foundLine, resolve);
  }

  addLine(cell1, cell2, resolve) {
    const {goodsContainer, $game, lines, storageLines} = this;
    const foundLine = storageLines.find(storageLine => storageLine.color === cell2.color
      && !storageLine.isTaken);

    if (foundLine) {
      foundLine.isTaken = true;
      foundLine.cell1 = cell1;
      foundLine.cell2 = cell2;
      foundLine.initCoord();
      if (foundLine.clip) foundLine.clip.visible = false;
      this.line = foundLine;
    } else {
      this.line = new Line(cell1, cell2);
      this.line.isTaken = true;
      storageLines.push(this.line);
    }

    lines.push(this.line);
    goodsContainer.addChild(this.line);

    cell1.isActive = true; // выбранная ячейка
    cell2.isActive = true; // текущая ячейка

    $game.trigger('LineContoller:lineAdd');
    this.drawLine(this.line, resolve);
  }

  findLine(cell1, cell2) {
    const {lines} = this;

    // линия уже добавлена
    const foundLine = lines
      .find(line => (line.cell1 === cell2 && line.cell2 === cell1));
    if (foundLine) return foundLine;
  }

  drawLine = (line, resolve) => {
    const {color, cell2} = line;
    const {goodsContainer} = this;
    const vector = this.getKoef(line.cell1, line.cell2);

    const lineSettings = {
      vertical: {
        width: line.cell1.width * 0.7,
        height: Math.abs(line.cell1.y - line.cell2.y),
        angle: vector.y === 1 ? 0 : Math.PI
      },
      horizontal: {
        height: Math.abs(line.cell1.x - line.cell2.x),
        width: line.cell1.width * 0.7,
        angle: -Math.PI / 2 * vector.x
      }
    };

    const currentSettings = lineSettings[line.direction];
    const {angle} = currentSettings;

    if (!line.clip) { // клип нет
      const numLine = randInteger(0, 2);
      const clipName = settings.colors[color].line[numLine].animation;
      line.clip = new global.lib[clipName];
      line.clipWidth = line.clip.width;
      line.clipHeight = line.clip.height;
      const {clip} = line;
      line.addChild(clip);
    } else line.clip.visible = true;

    line.clip.rotation = angle;
    this.scaleLineY = currentSettings.height / line.clipHeight;
    line.clip.scale.set(currentSettings.width / line.clipWidth, 0);
    goodsContainer.removeChild(cell2);
    goodsContainer.addChild(cell2);

    this.setPosition(line, resolve);
  }

  killLine = () => {
    const {line} = this;
    if (!line) return;
    gsap.killTweensOf(line.clip.scale);
  }

  hideLine(line, resolve) {
    const {goodsContainer} = this;
    gsap.to(line.clip.scale, settings.durations.line, {
      y: 0,
      ease: Power1.easeInOut,
      onComplete: () => {
        goodsContainer.removeChild(line);
        resolve();
      }
    })
  }

  setPosition(line, resolve) {
    const {field, scaleLineY} = this;
    const {width, height} = field;
    const {coord} = line;

    line.position.set((coord.start.x) * width, (coord.start.y) * height);
    gsap.to(line.clip.scale, settings.durations.line, {
      y: scaleLineY,
      ease: Power1.easeInOut,
      onComplete: () => resolve()
    })
  }

  getKoef(cell1, cell2) {
    let vector = {x: cell1.x - cell2.x, y:cell1.y - cell2.y};
    vector = vector.x !== 0 ? {x: vector.x / Math.abs(vector.x), y: vector.y}
      : {x: vector.x, y: vector.y / Math.abs(vector.y)};
    return vector;
  }

}
