import $ from "jquery";
export default class MoveController {
  constructor(field, lines, goodsContainer, cellController) {
    super();
    this.field = field;
    this.hero = field.hero;
    this.cells = field.cells;
    this.lines = lines;
    this._cell = this.cells[0];
    this.cellController = cellController;
    this.goodsContainer = goodsContainer;
    this.actionEnable = true;
    this.$game = $('.game');
    this.isAddLine = false;
    this.isAnimationFinished = true;
    this.isLevelDone = false;
    this.isModalActive = false;
    const {$game} = this;

    goodsContainer.interactive = true;
    goodsContainer.on('pointerupoutside', cellController.toggleCells.bind(this, false));
    goodsContainer.on('pointerup', cellController.toggleCells.bind(this, false));

    // на ячейке может сработать pointerup
    $(window).on('hero:click', cellController.toggleCells.bind(this, true));

    // на ячейке может сработать pointerdown
    // тут инпут контроллер не срабатывает
    $(window).on('cell:click', this.activateCell);

    // нашли выбранную ячейку
    $(window).on('cell:active', (e, cell) => {
      // срабатывает инпут контроллер, нужно игнорировать
      e.preventDefault();
      this.actionEnable = false;
      this.activateCell(e, cell);
    });

    $(window).on('game:action', (e, action) => {
      if (!this.actionEnable || this.isLevelDone || !this.isAnimationFinished || this.isModalActive) return;
      this.actionEnable = false;
      this.isAnimationFinished = false;

      this.action = action;
      // убить твины
      $(window).trigger('MoveController:FinishAnimation');
      this.finishedCell = null;
      this.findClosestCell(e, action);
    });

    $game.on('LineContoller:lineAdd', () => this.isAddLine = true);

  }

  modalActive(value) {
    this.isModalActive = value;
  }

  levelDone() {
    this.isLevelDone = true;
  }

  reset() {
    this._cell = this.field.cells[0];
    this.actionEnable = true;
    this.isAddLine = false;
    this.isAnimationFinished = true;
    this.isLevelDone = false;
  }

  getVector(cell1, cell2) {
    return {x: cell2.x - cell1.x, y: cell2.y - cell1.y};
  }

  compareCoord = (a, b) => {
    const cell = this._cell; // начальная ячейка

    const {coord: {x: xO, y: yO}} = cell;
    const {coord: {x: xA, y: yA}} = a;
    const {coord: {x: xB, y: yB}} = b;

    const lengthOA = Math.sqrt((xA - xO) * (xA - xO) + (yA - yO) * (yA - yO));
    const lengthOB = Math.sqrt((xB - xO) * (xB - xO) + (yB - yO) * (yB - yO));

    return lengthOA - lengthOB;
  }

  isCellAvailable(cell) { // выбранная ячейка
    const {currentCell} = this; // текущая ячейка
    const {lines, cells} = this;
    const lineChoosen = lines.filter(line => line.cell1 === cell || line.cell2 === cell); // линии из выбранной ячейки
    const lineCurrent = lines.find(line => line.cell1 === currentCell || line.cell2 === currentCell); // линии из текущей ячейки

    this.sameCoord = this._cell.coord.x === cell.coord.x ? 'x' : 'y';

    let countActiveCells = 0;
    for (let cell of cells) {
      if (cell.isActive) countActiveCells += 1;
    };

    if (cell.color === 'circleblack' && countActiveCells === cells.length - 1) return true;
    if (cell.color === 'circleblack') return false;

    if (!lineChoosen.length) return true; // ячейка пустая
    if (this.finishedCell) {
      // есть ли соединение выбранной и текущей ячейки вообще?
      const isCellComeBack = lineChoosen.some(line => line.cell1 === currentCell || line.cell2 === currentCell);
      const res = !isCellComeBack && lineChoosen.length === 2;
      if (res) return false;

      return this.isPathClear(lineCurrent);
    }


    for (let line1 of lineChoosen) {
      if (line1 === lineCurrent) {
        return true; // линию нужно удалить, все ок
      }
    }

    return false; // точки принадлежат разным линиям (нельзя соединить)
  }

  isPathClear(lineCurrent) {
    const {sameCoord} = this;
    const prevCell = lineCurrent.cell2;
    if (prevCell.coord[sameCoord] === lineCurrent.cell1.coord[sameCoord]) {// на той же прямой
      if (this.finishedCell === prevCell) return true;
      const prevLine = this.lines.find(line => line.cell1 === prevCell);
      return this.isPathClear(prevLine);
    } else return false;

  }

  doFilterCells(cell) {
    const {cells, vector} = this;
    let value = vector.x === 0 ? 'x' : 'y';
    const sameValue = value === 'x' ? 'y' : 'x';

    this.filterCells = cells.filter(_cell => {
      let start, end;
      if (this._cell.coord[sameValue] > cell.coord[sameValue]) {
        start = cell.coord[sameValue];
        end = this._cell.coord[sameValue];
      } else {
        end = cell.coord[sameValue];
        start = this._cell.coord[sameValue];
      }
      return (_cell.coord[value] === this._cell.coord[value] && // та же координата
        _cell.coord[sameValue] >= start && _cell.coord[sameValue] <= end && // лежит на отрезке
        this._cell !== _cell && // не точка в которой находимся
        this.isCellAvailable(_cell));
    });
  }

  getClosestCell(vector, cellsOnLine) {
    const {currentCell} = this;
    const maxOrMin = vector.x === 0 ? vector.y : vector.x; // макс(1) или мин(-1)
    const indexCurrentCell = cellsOnLine.findIndex(cell => cell === currentCell);

    // идем слева направо или сверху вниз
    if (maxOrMin === -1) {
      const start = indexCurrentCell - 1;
      const end = 0;
      if (start < 0) return;
      for (let i = start; i >= end; i--) {
        const cell = cellsOnLine[i];
        if (this.isCellAvailable(cell)) return cell;
      }
      return null;
    }
    const start = indexCurrentCell + 1;
    const end = cellsOnLine.length;
    if (start >= end) return;
    for (let i = start; i < end; i++) {
      const cell = cellsOnLine[i];
      if (this.isCellAvailable(cell)) return cell;
    }
  }

  filterCellsByAction(vector) {
    const {cells, currentCell} = this;
    const value = vector.x === 0 ? 'y' : 'x'; // ось движения
    const sameValue = value === 'y' ? 'x' : 'y'; // постоянная ось

    const cellsOnLine = cells.filter(cell => cell.coord[sameValue] === currentCell.coord[sameValue]);

    cellsOnLine.sort((a, b) => a.coord[value] - b.coord[value]);
    return cellsOnLine;
  }

  fakeHeroMove(vector) {
    const {hero} = this;
    const coord = {x: hero.coord.x + vector.x * 2, y: hero.coord.y + vector.y * 2};
    const color = this.currentCell.color;
    new Promise((resolve) => {
      $(window).trigger('MoveController:fakeHeroMove', [coord, resolve, color]);
    })
      .then(this.enableActions);
  }

  findClosestCell = (e, action) => {
    const direction = {
      right: {x: 1, y: 0},
      left: {x: -1, y: 0},
      up: {x: 0, y: -1},
      down: {x: 0, y: 1},
    };
    const vector = direction[action];
    const filterCells = this.filterCellsByAction(vector);
    const closestCell = this.getClosestCell(vector, filterCells);
    if (!closestCell) {
      this.fakeHeroMove(vector);
      return;
    }
    this.currentCell = closestCell;

    this.changePromise.then(() => {
      this.enableActions();
    })
  }

  findCells = (cell) => {
    this.vector = this.getVector(this.currentCell.coord, cell.coord);

    // конец рекурсии                                 кликнули по ячейке, до которой нельзя добраться
    if (!this.vector.x && !this.vector.y || this.vector.x && this.vector.y) {
      this.enableActions();
      return;
    };

    this.doFilterCells(cell);

    const {filterCells} = this;
    if (!filterCells.length) {
      const smallVector = this.getSmallVec(this.vector);
      this.fakeHeroMove(smallVector);
      return;
    };
    filterCells.sort(this.compareCoord);
    this.currentCell = filterCells[0];

    this.changePromise.then(() => {
      this.findCells(cell);
    })

  }

  set currentCell(cell) {
    // cell выбранная ячейка
    // this.currentCell текущая ячейка
    const {$game} = this;

    const promiseHero = new Promise((resolve) => {
      $(window).trigger('MoveController:changeHeroCoord', [cell, resolve]);
    });

    const promiseLine = new Promise((resolve) => {
      $(window).trigger('MoveController:changeLine', [cell, this.currentCell, resolve]);
    });

    promiseHero.then(() => {
      if (this.isAddLine)
        // если попало в новую ячейку, то добавить кляксу
        $game.trigger('MoveController:HeroGotEnd', [1, cell, this.currentCell, this.action]);
      this.isAddLine = false;
      this._cell = cell;
    });

    this.changePromise = Promise.all([promiseLine, promiseHero]);
  }

  getSmallVec(vector) {
    return vector.x !== 0 ? {x: vector.x / Math.abs(vector.x), y: vector.y}
      : {x: vector.x, y: vector.y / Math.abs(vector.y)};
  }

  get currentCell() {
    return this._cell;
  }

  enableActions = () => {
    this.isAnimationFinished = true;
    this.actionEnable = true;
  }


  activateCell = (e, cell) => {
    if (!this.isAnimationFinished || this.isLevelDone || this.isModalActive) return;
    e.preventDefault();
    this.isAnimationFinished = false;
    this.finishedCell = cell;
    this.action = null;
    this.findCells(cell);
  }
}
