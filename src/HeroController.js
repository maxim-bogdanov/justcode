import settings from "../../splashy/settings";
import gsap,{Power1} from "gsap";

const {Graphics } = global.PIXI;
import $ from "jquery";

export default class HeroController{
  constructor(field, heroContainer, tailContainer) {
    this.field = field;
    this.tailContainer = tailContainer;
    const {hero} = this.field;

    this.drawHero();
    // heroContainer.position.set(this.width / 2);
    $(window).on('MoveController:FinishAnimation', this.killHero);
    $(window).on('MoveController:fakeHeroMove', this.fakeHeroMove);
    $(window).on('MoveController:changeHeroCoord', (e, cell, resolve) => {
      this.updateCoord(cell);
      this.animateHero(resolve);
    });

    heroContainer.addChild(hero);
    this.setPosition();
  }

  fakeHeroMove = (e, coord, resolve, color) => {
    const {hero, width} = this.field;
    const end = {x: coord.x * width, y: coord.y * width};
    this.fakeColor = color;
    this.prevCoord = {x: hero.x, y: hero.y};
    gsap.to(hero, settings.durations.hero, {
      x: end.x,
      y: end.y,
      ease: Power1.easeInOut,
      repeat: 1,
      onUpdate: this.drawTail,
      yoyo: true,
      onComplete: resolve
    });
  }

  reset() {
    this.setPosition();
  }

  killHero = () =>{
    const {hero} = this.field;
    gsap.killTweensOf(hero)
  }

  drawHero() {
    const {hero, width, height} = this.field;
    const clipName = settings.colors[hero.color].cell.animation;
    const clip = new global.lib[clipName];
    hero.addChild(clip);
    hero.scale.x = width / clip.width;
    hero.scale.y = height / clip.height;
  }

  updateCoord(cell) {
    this.field.hero.coord = cell.coord;
  }

  setPosition(){
    const {hero, width, height} = this.field;
    hero.position.set(hero.coord.x * width, hero.coord.y * height);
  }

  tailCircle(x, y) {
    const {tailContainer, prevCoord, fakeColor} = this;
    // длина веткора
    const color = settings.fakeColors[fakeColor];
    const distance = this.getDistance({x, y}, prevCoord);
    const direction = this.getKoef({x, y}, prevCoord);
    const lengthBetween = (distance + 1) / settings.circlesBetween;

    for (let i = 0; i < settings.circlesBetween; i++) {
      const circle = new Graphics();
      circle.position.set(this.prevCoord.x + lengthBetween * direction.x,
                          this.prevCoord.y + lengthBetween * direction.y);
      this.prevCoord = {x: circle.x, y: circle.y};
      circle
        .beginFill(color)
        .drawCircle(0, 0, settings.circleRadius);
      tailContainer.addChild(circle);
      gsap.to(circle.scale, {
        x: 0,
        y: 0,
        duration: settings.durations.tail,
        onComplete: this.removeTailCircles,
        onCompleteParams: [circle]
      });
    }
    this.prevCoord = {x, y};
  }

  removeTailCircles = (circle) => {
    const {tailContainer} = this;
    tailContainer.removeChild(circle);
  }

  animateHero(resolve) {
    const {hero, width} = this.field;
    const {coord} = hero;
    const end = {x: coord.x * width, y: coord.y * width};
    gsap.to(hero, settings.durations.hero, {
      x: end.x,
      y: end.y,
      ease: Power1.easeInOut,
      callbackScope: this,
      onComplete: resolve,
    });
  }

  drawTail = () => {
    const {hero} = this.field;
    this.tailCircle(hero.x, hero.y);
  }

  getKoef(cell1, cell2) {
    let vector = {x: cell1.x - cell2.x, y:cell1.y - cell2.y};
    vector = vector.x !== 0 ? {x: vector.x / Math.abs(vector.x), y: vector.y}
      : {x: vector.x, y: vector.y / Math.abs(vector.y)};
    return vector;
  }

  getDistance(a, b) {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  }
}
