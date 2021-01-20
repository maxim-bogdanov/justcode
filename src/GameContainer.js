import settings from "../../splashy/settings";
const { Container, Graphics } = global.PIXI;

export default class GameContainer extends Container {
  constructor({ width, height, contentWidth, contentHeight }) {
    super();

    this.contentWidth = contentWidth;
    this.contentHeight = contentHeight;
    this.coord = {x: 0, y: 0};

    const heroContainer = new Container();
    this.heroContainer = heroContainer;

    const goodsContainer = new Container();
    this.goodsContainer = goodsContainer;

    const tailContainer = new Container();
    this.tailContainer = tailContainer;

    const fieldContainer = new Container();
    const bg = new Graphics();
    bg
      .lineStyle(2,0xff0000)
      .drawRect(0, 0,width, height);
    this.fieldContainer = fieldContainer;

    this.fieldContainer.addChild(goodsContainer);
    this.fieldContainer.addChild(tailContainer);
    this.fieldContainer.addChild(heroContainer);

    const contentContainer = new Container();
    this.contentContainer = contentContainer;
    contentContainer.position.set(settings.padding);

    this.addChild(contentContainer);
    this.contentContainer.addChild(fieldContainer);
  }

  destroy(options) {
    super.destroy(options);
    this.contentContainer = null;
  }

}
