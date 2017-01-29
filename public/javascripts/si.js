(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
            || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

var Game = function(screen) {

    var that = this;
    this.screen = new Screen(screen);
    this.control = new Controls();
    this.alienSprite = null;
    this.spaceShipSprite = null;
    this.loopRequest = 0;
    this.gameOver = false;

    var img = new Image();
    img.addEventListener('load', function() {
        that.blockSprite = new Sprite(this, 84, 8, 36, 24);
        that.alienSprite = [
            [new Sprite(this, 0, 0, 22, 16), new Sprite(this, 0, 16, 22, 16)],
            [new Sprite(this, 22, 0, 16, 16), new Sprite(this, 22, 16, 16, 16)],
            [new Sprite(this, 38, 0, 24, 16), new Sprite(this, 38, 16, 24, 16)]
        ];
        that.spaceShipSprite = new Sprite(img, 62, 0, 22, 16);

        init();
        run();
    });
    img.src = 'images/invaders.png';

    function init() {
        that.frames = 0;
        that.spFrame = 0;
        that.levelFrame = 60;
        that.direct = 1;

        //create spaceship
        that.spaceShip = new SpaceShip(
            that.spaceShipSprite,
            (that.screen.width)/2,
            that.screen.height - (30 + that.spaceShipSprite.height)
        );

        //create aliens
        that.aliens = [];
        var rows = [1, 0, 0, 2, 2];
        var i = 0, j = 0, cnt = rows.length;
        for (;i < cnt;i++) {
            for (; j < 11; j++) {
                var a = rows[     i];
                that.aliens.push({
                    sprite: that.alienSprite[a],
                    x: 50  + j*30 + [0, 4, 0][a],
                    y: 30 + i*30,
                    width: that.alienSprite[a][0].width,
                    height: that.alienSprite[a][0].height
                });
            }
            j = 0;
        }

        that.blocks = new Blocks(
            that.blockSprite,
            that.screen.width,
            that.spaceShip.y,
            4
        );

        that.bullets = [];

        that.health = 3;
    }

    function run() {
        function loop() {
            that.update();
            that.render();
            if (that.loopRequest !== undefined) {
                that.loopRequest = requestAnimationFrame(loop);
            }
        }
        that.loopRequest = requestAnimationFrame(loop);
    }

};

Game.prototype.stopGame = function() {
    cancelAnimationFrame(this.loopRequest);
    this.loopRequest = undefined;
    this.gameOver = true;
    this.render();
};

Game.prototype.update = function(){
    if (this.health <= -0) {
        this.screen.drawMessage("Game over...", 180, 250, 48);
        this.screen.drawMessage("Press 'enter' to play again..", 190, 350);
        this.stopGame();
    }
    if (this.aliens.length === 0) {
        this.screen.drawMessage("You win!", 180, 250, 48);
        this.screen.drawMessage("Press 'enter' to play again..", 190, 350);
        this.stopGame();
    }
    this.frames++;

    if (this.control.isdown(37)) { //left
        this.spaceShip.moveLeft();
    }
    if (this.control.isdown(39)) { // right
        this.spaceShip.moveRight();
    }

    this.spaceShip.x = Math.max( Math.min(this.spaceShip.x, this.screen.width - (30 + this.spaceShipSprite.width)) , 30);

    if (this.control.ispressed(32)) {
        this.spaceShip.openFire111(this.bullets);
    }

    this.updateBullets();
    this.shotAliens();
    this.moveAliens();
};

Game.prototype.updateBullets = function() {
    for (var i = 0, len = this.bullets.length; i < len; i++) {
        var b = this.bullets[i];
        b.update();

        if (b.y + b.height < 0 || b.y > screen.height) {
            this.bullets.splice(i, 1);
            i -= 1;
            len -= 1;
            continue;
        }

        var h = b.height * 0.5;
        if (this.blocks.y < b.y + h && b.y + h < this.blocks.y + this.blocks.height) {
            if (this.blocks.hit(b.x, b.y + h)) {
                this.bullets.splice(i, 1);
                i -= 1;
                len -= 1;
                continue;
            }
        }

        for (var j = 0, lenJ = this.aliens.length; j < lenJ; j++) {
            var a = this.aliens[j];
            if (this.intersect(b.x, b.y, b.width, b.height, a.x, a.y, a.width, a.height) && !b.enemy) {
                this.aliens.splice(j, 1);
                j -= 1;
                lenJ -= 1;
                this.bullets.splice(i, 1);
                i -= 1;
                len -= 1;
            }
        }

        if (this.intersect(b.x, b.y, b.width, b.height, this.spaceShip.x, this.spaceShip.y, this.spaceShip.sprite.width, this.spaceShip.sprite.height)) {
            this.health -= 1;
            this.bullets.splice(i, 1);
            i -= 1;
            len -= 1;
            continue;
        }

    }
};

Game.prototype.shotAliens = function() {
    if (Math.random() < 0.04 && this.aliens.length > 0) {
        var a = this.aliens[Math.round(Math.random() * (this.aliens.length - 1))];
        for (var i = 0, len = this.aliens.length; i < len; i++) {
            var b = this.aliens[i];
            if (this.intersect(a.x, a.y, a.width, 100, b.x, b.y, b.width, b.height)) {
                a = b
            }
        }
        this.bullets.push(new Bullet(a.x + a.width*0.5, a.y + a.height, 4, 2, 4, '#ff0000', true));
    }
};

Game.prototype.moveAliens = function() {

    if (this.aliens[this.aliens.length - 1].y > 500) {
        this.screen.drawMessage("Game over...", 180, 250, 48);
        this.screen.drawMessage("Press 'enter' to play again..", 190, 350);
        this.stopGame();
    }

    if (this.frames % this.levelFrame === 0) {
        this.spFrame = (this.spFrame + 1)%2;

        var max = 0, min = this.screen.width;

        for (var i = 0, len = this.aliens.length; i < len; i++) {
            var a = this.aliens[i];
            a.x += 30 * this.direct;

            max = Math.max(max, a.x + a.width);
            min = Math.min(min, a.x)
        }
        if (max > this.screen.width - 30 || min < 30) {
            this.direct *= -1;
            for (var i = 0, len = this.aliens.length; i < len; i++) {
                this.aliens[i].x += 30 * this.direct;
                this.aliens[i].y += 30;
            }
        }
    }
};

Game.prototype.render = function() {

    if (this.gameOver) {
        this.screen.clear();
        this.screen.drawGameOver();
        return;
    }
    else {
        this.screen.clear();
    }

    for (var i = 0, len = this.aliens.length; i < len; i++) {
        var a = this.aliens[i];
        this.screen.drawImg(a.sprite[this.spFrame], a.x, a.y);
    }

    this.screen.ctx.save();
    for (var i = 0, len = this.bullets.length; i < len; i++) {
        this.screen.drawBullet(this.bullets[i]);
    }
    this.screen.ctx.restore();

    this.screen.ctx.drawImage(this.blocks.canvas, 0, this.blocks.y);

    this.screen.drawImg(this.spaceShip.sprite, this.spaceShip.x, this.spaceShip.y);

    this.screen.drawMessage('Lifes: ' + this.health, 555, 590, 18);
};

Game.prototype.intersect = function(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx+bw && bx < ax+aw && ay < by+bh && by < ay+ah;
};

Game.prototype.isGameOver = function() {
    return this.gameOver;
};


// bullet
var Bullet = function (x, y, v, w, h, color, enemy) {
    this.x = x;
    this.y = y;
    this.v = v;
    this.width = w;
    this.height = h;
    this.color = color;
    this.enemy = enemy || false;
};

Bullet.prototype.update = function() {
    this.y += this.v;
};

// Screen
var Screen = function(options) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width = options.width;
    this.canvas.height = this.height = options.height;
    this.ctx = this.canvas.getContext("2d");

    document.body.appendChild(this.canvas);

};

Screen.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
};

Screen.prototype.drawImg = function(sprite, x, y) {
    this.ctx.drawImage(sprite.sprite, sprite.x, sprite.y, sprite.width, sprite.height, x, y, sprite.width, sprite.height);
};

Screen.prototype.drawBullet = function(bullet) {
    this.ctx.fillStyle = bullet.color;
    this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
};

Screen.prototype.drawGameOver = function() {
    this.ctx.font = "48px Arial";
    this.ctx.fillStyle = 'white';
    this.ctx.fillText("Game over...", 180, 250);

    this.ctx.font = "20px Arial";
    this.ctx.fillText("Press 'enter' to play again..", 190, 350);
};

Screen.prototype.drawMessage = function(msg, x, y, fontSize, color) {
    color = color || 'white';
    fontSize = fontSize || '20px';
    this.ctx.font = fontSize + "px Arial";
    this.ctx.fillStyle = color;
    this.ctx.fillText(msg, x, y);
};

// Sprite
var Sprite = function (img, x, y, width, heigth) {
    this.sprite = img;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = heigth;
};

//Input Handler
var Controls = function() {
    this.down = {};
    this.pressed = {};

    var that = this;

    document.addEventListener("keydown", function(e) {
        that.down[e.keyCode] = true;
    });

    document.addEventListener("keyup", function(e){
        delete that.down[e.keyCode];
        delete that.pressed[e.keyCode];
    });
};

Controls.prototype.isdown = function(char) {
    return this.down[char];
};

Controls.prototype.ispressed = function(char) {
    if (this.pressed[char]) {
        return false;
    } else if (this.down[char]) {
        return this.pressed[char] = true;
    }
    return false;
};

// ship
var SpaceShip = function(sprite, x, y) {
    this.sprite = sprite;
    this.x = x;
    this.y = y;
};

SpaceShip.prototype.moveRight = function() {
    this.x += 3;
};

SpaceShip.prototype.moveLeft = function() {
    this.x -= 3;
};

SpaceShip.prototype.openFire111 = function(bullets) {
    bullets.push(new Bullet(
        this.x + 10,
        this.y,
        -6  ,
        2,
        6,
        '#fff'
    ));
};

var Blocks = function(blockSprite, screenWidth, spaceShipY, cntBlocks) {
    this.y = spaceShipY - (30 + blockSprite.height);
    this.height =  blockSprite.height;
    this.canvas = document.createElement("canvas");
    this.canvas.width = screenWidth;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d');

    for (var i = 0; i < 5;i++) {
        this.ctx.drawImage(
            blockSprite.sprite,
            blockSprite.x,
            blockSprite.y,
            blockSprite.width,
            blockSprite.height,
            68 + 111*i,
            0,
            blockSprite.width,
            blockSprite.height);
    }
};

Blocks.prototype.drawDamage = function(x, y) {
    x = Math.floor(x/2) * 2;
    y = Math.floor(y/2) * 2;
    this.ctx.clearRect(x-2, y-2, 4, 4);
    this.ctx.clearRect(x+2, y-4, 2, 4);
    this.ctx.clearRect(x+4, y, 2, 2);
    this.ctx.clearRect(x+2, y+2, 2, 2);
    this.ctx.clearRect(x-4, y+2, 2, 2);
    this.ctx.clearRect(x-6, y, 2, 2);
    this.ctx.clearRect(x-4, y-4, 2, 2);
    this.ctx.clearRect(x-2, y-6, 2, 2);
};

Blocks.prototype.hit = function(x, y) {
    y -= this.y;
    var data = this.ctx.getImageData(x, y, 1, 1);
    if (data.data[3] != 0) {
        this.drawDamage(x, y);
        return true;
    }
    return false;
};
