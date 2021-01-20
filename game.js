import {Application} from "pixi.js-legacy";
import $ from "jquery";
import {
  registerPlugins,
  Plugin
} from "../../framework/jquery/plugins/plugins";
import settings from "../splashy/settings";
import GameContainer from "./src/GameContainer";
import Field from "./src/Field";
import GameController from "./src/GameController";
import InputController from "../input-controller/InputController";
import KeyboardInputDevice from "../input-controller/inputDevices/KeyboardInputDevice";
import GesturesInputDevice from "../input-controller/inputDevices/GesturesInputDevice";
import gsap,{Power1} from "gsap";
import ldApi from "../../framework/api/ld-api";

class Game extends Plugin {
  static WIDTH = 800;
  static HEIGHT = 1000;
  static WIDTHCONTAINER = Game.HEIGHT > Game.WIDTH ? Game.WIDTH : Game.HEIGHT;

  #app;
  constructor($element) {
    super($element);

    this.$game = $element;
    this.$frame = this.$game.find('.game__frame');
    this.$level = $('.game-info__item-num');
    const {$game} = this;
    this.currentScore = 1;

    this.initControls(settings.controls);

    this.#app = new Application({
      resolution: window.devicePixelRatio,
      backgroundColor: 0xf5f5f5,
    });

    const game = new GameContainer({
      width: Game.WIDTHCONTAINER - settings.padding * 2, // контейнера
      height: Game.WIDTHCONTAINER - settings.padding * 2,
      contentWidth: Game.WIDTH, // контента
      contentHeight: Game.HEIGHT,
    });

    this.game = game;
    $game.append(this.#app.view);
    this.#app.stage.addChild(game);
    $(window).on('resize', this.resize);
    $game.on('MoveController:HeroGotEnd', this.nextPoint);
    $game.on('LineContoller:lineDelete', this.prevPoint);
    $(window).on('rules-modal:closed', this.enableGame);
    $(window).on('result-modal:reset', this.changeLevel);
  }

  enableGame = () => {
    this.gameController.moveController.modalActive(false);
  }

  addFrame() {
    const {$frame} = this;
    $frame.addClass('game__frame_show');
    gsap.fromTo($frame,  {
      scale: 2
    }, {
      scale: 1,
      duration: settings.durations.frame,
      ease: Power1.easeInOut,
      onComplete: this.frameIsActive,
      callbackScope: this
    });
  }

  frameIsActive = () => {
    setTimeout(this.cleanFrame, 2000);
  }

  cleanFrame = () => {
    const {$frame, totalLevels, levelNumber} = this;
    $frame.removeClass('game__frame_show');
    if (totalLevels === levelNumber) { // все уровни пройдены
      $('#result-modal').modal();
      this.levelNumber = 0;
    } else { // некст левл
      this.changeLevel(levelNumber);
    }
  }


  prevPoint = (e, value, cell) => {
    const {gameController} = this;
    this.changeScore(value);
    gameController.cellController.deleteClip(cell);
  }

  nextPoint = (e, value, cell1, cell2, action) => {
    const {totalScore, gameController} = this;
    this.changeScore(value);
    if (!action) action = this.getAction(cell1, cell2);
    const direction = {
      left: -Math.PI / 2,
      right: Math.PI / 2,
      up: 0,
      down: Math.PI,
    };

    const angle = direction[action];
    if (this.currentScore !== totalScore) {
      gameController.cellController.finishedAnimationOnLine(cell1, cell2, angle);
      return;
    }
    // игра пройдена
    gameController.cellController.firstLastAnimation(cell1, cell2);
    gameController.moveController.levelDone();

    this.addFrame();

  }

  changeScore = (value) => {
    this.currentScore += value;
  }

  initLevels(levels) {
    this.levels = levels;
  }

  initGame() {
    const {game, $game, levels} = this;
    const {fieldContainer, heroContainer, goodsContainer, tailContainer} = game;
     $('#rules-modal').modal();//TODO: Игнорирование реализованного функционала. сделать слушатель закрытия попапа вместо глабльного события на window
    $game.addClass('game_visible');
    this.totalLevels = levels.length;
    ldApi.getData().then((data) => {
      this.levelNumber = data.available_level - 1;
      const {levelNumber} = this;
      this.field = new Field(levels, levelNumber, Game.WIDTHCONTAINER  - settings.padding * 2);
      this.totalScore = levels[levelNumber].cells.length - 1;
      this.gameController = new GameController(this.field, fieldContainer, goodsContainer, heroContainer, tailContainer);
      this.gameController.moveController.modalActive(true);
      this.resize();
    })

  }

  changeLevel = (number) => {
    const {gameController, field, levels} = this;
    let reset = false;
    if (number.target) reset = true;
    ldApi.postData(reset).then((data) => {
      this.levelNumber = data.available_level - 1;
      this.currentScore = 1;
      this.totalScore = levels[this.levelNumber].cells.length - 1;
      field.reset(this.levelNumber);
      gameController.reset();
    })
  }

  set levelNumber(_levelNumber) {
    const {$level} = this;
    this._levelNumber = _levelNumber;
    $level.text(_levelNumber);
  }

  get levelNumber() {
    return this._levelNumber;
  }

  initControls( controls ){
    const actionsToBind = Object.assign( {}, settings.defaultActionsToBind );

    for (const action in controls) {
      actionsToBind[action].enabled = controls[action];
    }

    this.inputController = new InputController();
    const target = window;
    this.inputController.bindActions(actionsToBind);
    this.inputController.addInputDevice( [new KeyboardInputDevice(), new GesturesInputDevice()] );
    this.inputController.attach(target);

    target.addEventListener( InputController.ACTION_ACTIVATED, function(e){ //TODO: зачем функция в функции, вынести
      if( ['left','right','up','down'].indexOf(e.detail.actionName) !== -1){
        this.action = e.detail.actionName;
        $(window).trigger('game:action', this.action);
      }
    }.bind(this));
  }




  resize = () => {
    const {contentContainer} = this.game;
    const parent = this.#app.view.parentNode;
    const width = parent.offsetWidth;

    const scale = width / (Game.WIDTHCONTAINER);
    this.#app.renderer.resize(width, width);
    contentContainer.scale.set(scale);
  }

  getAction(cell1, cell2) {
    let vector = {x: cell1.x - cell2.x, y:cell1.y - cell2.y};
    vector = vector.x !== 0 ? {x: vector.x / Math.abs(vector.x), y: vector.y}
      : {x: vector.x, y: vector.y / Math.abs(vector.y)};
    const vectorString = `${vector.x}${vector.y}`;

    const types = {
      "-10": "left",
      "10": "right",
      "01": "down",
      "0-1": "up",
    }
    return types[vectorString];
  }
}

registerPlugins({
  name: "game",
  Constructor: Game,
  selector: ".game"
});
