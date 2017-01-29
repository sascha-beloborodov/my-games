window.onload = function() {

  function getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
  }

  function foodIntersect(xFood, yFood, xSnake, ySnake) {
    if (xFood === xSnake && yFood === ySnake) {
      return true;
    }
    return false;
  }

  function getRandomX() {
    while (true) {
      var x = Math.random() * 1000;
      if (x < maxWidth) {
        return parseInt(x);
      }
    }
  }

  function getRandomY() {
    while (true) {
      var y = Math.random() * 1000;
      if (y < maxHeight) {
        return parseInt(y);
      }
    }
  }

  function roundingByFive(num) {
    if (0 != num % 5) {
      var result = num;
      return result + (5 - num % 5);
    }
    return num;
  }

  var x, y, size, xApple, yApple, prevDirection;

  var snakeLength = 40;

  var snakeWidth = 5;

  var squareLength = 5;

  var cellSize = 5;

  var directions = {
    'up': 'up',
    'down': 'down',
    'left': 'left',
    'right': 'right'
  };

  var direction = directions.right;

    // init canva and context
  var canva = document.querySelector('#canvas');
  var ctx = canva.getContext('2d');

  // get max width and heigth
  var maxWidth = canva.width;
  var maxHeight = canva.height;

  //Input Handler
  var keyDown = {};
  document.addEventListener("keydown", function(e) {
      keyDown[e.keyCode] = true;
  });
  document.addEventListener("keyup", function(e){
      delete keyDown[e.keyCode];
  });
  var isdown = function(char) {
      return keyDown[char];
  };

  // add click litener
  canva.addEventListener('click', function(e) {
    x = roundingByFive(getMousePos(canva, e).x);
    y = roundingByFive(getMousePos(canva, e).y);
    console.log(x, y);
  });

  ctx.fillStyle = "rgb(200,0,0)";
  var defaultStartX = 305;
  var defaultStartY = 205;

  var incrementX = -5;
  var snake = [0, 0, 0, 0, 0].map(function(el) {
    incrementX += cellSize;
    return {
      x: defaultStartX + incrementX,
      y: defaultStartY
    };
  });

  x = defaultStartX;
  y = defaultStartY;

  xApple = roundingByFive(getRandomX());
  yApple = roundingByFive(getRandomY());

  var intervalId = setInterval(function() {
    ctx.clearRect(0, 0, maxWidth, maxHeight);

    // break
    if (x >= maxWidth || y >= maxHeight || 0 === x || 0 === y) {
      clearInterval(intervalId);
    }

    if (isdown(37)) { //left
      if (directions.right === direction) {
        return;
      }
      direction = directions.left;
    }
    if (isdown(39)) { // right
      if (directions.left === direction) {
        return;
      }
      direction = directions.right;
    }
    if (isdown(38)) { // up
      if (directions.down === direction) {
        return;
      }
      direction = directions.up;
    }
    if (isdown(40)) { // down
      if (directions.up === direction) {
        return;
      }
      direction = directions.down;
    }

    switch (direction) {
      case directions.left:
        x -= cellSize;
        break;
      case directions.right:
        x += cellSize;
        break;
      case directions.up:
        y -= cellSize;
        break;
      case directions.down:
        y += cellSize;
        break;
      default:
    }

    snake.unshift({
      x: x,
      y: y
    });

    ctx.fillRect(xApple, yApple, cellSize, cellSize);

    if (foodIntersect(xApple, yApple, x, y)) {
      xApple = roundingByFive(getRandomX());
      yApple = roundingByFive(getRandomY());
    } else {
      snake.pop();
    }

    for (var i = 0, len = snake.length; i < len; i++) {
      ctx.fillRect(snake[i].x, snake[i].y, cellSize, cellSize);
    }

  }, 200);

};
