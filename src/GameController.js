import CellController from "./CellController";
import HeroController from "./HeroController";
import MoveController from "./MoveController";
import LineController from "./LineController";

export default class GameController{
  constructor(field, fieldContainer,goodsContainer, heroContainer, tailContainer) {
    fieldContainer.position.set(field.width/2);

    this.cellController = new CellController(field, goodsContainer);
    this.heroController = new HeroController(field, heroContainer, tailContainer);
    this.lineController = new LineController(field, goodsContainer);

    // ловлю событие мув контроллер
    this.moveController = new MoveController(field, this.lineController.lines, goodsContainer, this.cellController);
  }

  reset() {
    const {cellController, heroController, lineController, moveController} = this;
    cellController.reset();
    heroController.reset();
    lineController.reset();
    moveController.reset();
  }

}
