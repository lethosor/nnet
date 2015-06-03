world = null;

function num2color (n) {
    n = Math.max(0, Math.min(1, n));
    if (n < 1/3)
        return createjs.Graphics.getRGB(255, 255, Math.floor(255 * (1 - (3 * n))));
    else if (n < 2/3)
        return createjs.Graphics.getRGB(Math.floor(255 * (2 - (3 * n))), 255, 0);
    else
        return createjs.Graphics.getRGB(0, Math.floor(210 * 3 * (1 - n) + 45), 0);
}

function Guppy (hidden_layer_size) {
    var self = this;
    self.points = 0;
    self.net = new nnet.Network([2, hidden_layer_size, 2]);
    self.shape = new createjs.Shape();
    self.setColor = function() {
        console.log('setColor', self.points, 'Color: ', num2color(self.points / 15));
        self.shape.graphics.clear().beginFill(num2color(self.points / 15)).beginStroke('black').drawCircle(0, 0, 10);
    }
    self.setColor();
    self.levelUp = function() {
        self.points++;
        self.setColor();
    }
}

function World (opts) {
    var self = this;
    var running = false;
    self.guppies = [];
    var timeout_id = 0;
    var cwidth = opts.canvas.width();
    var cheight = opts.canvas.height();
    self.stage = new createjs.Stage(opts.canvas[0]);
    self.stage.clear();
    self.stage.removeAllChildren();

    self.start = function() {
        if (running)
            return;
        iter(opts.guppies, function (i) {
            var g = new Guppy(opts.hidden_layer_size);
            g.shape.set({x: cwidth / 2, y: cheight / 2});
            self.stage.addChild(g.shape)
            self.guppies[i] = g;
        });
        running = true;
        timeout_id = setInterval(self.tick, 50);
    }

    self.stop = function () {
        running = false;
        clearInterval(timeout_id);
    }

    self.newFoodPos = function () {
        self.food.set({
            x: randInt(10, cwidth - 10),
            y: randInt(10, cheight - 10),
        });
    }

    self.tick = function() {
        if (!running) {
            self.stop();
            return;
        }
        food_found = false;
        iter(self.guppies, function (i, guppy) {
            if (!food_found && distance(guppy.shape.x, guppy.shape.y, self.food.x, self.food.y) < 15) {
                food_found = true;
                guppy.levelUp();
                self.newFoodPos();
            }
            var velocity = guppy.net.calculate([guppy.shape.x - self.food.x, guppy.shape.y - self.food.y])
                .map(function(n) {
                    return n * opts.max_speed * 2 - opts.max_speed;
                });
            guppy.shape.x = Math.max(10, Math.min(cwidth - 10, guppy.shape.x + velocity[0]));
            guppy.shape.y = Math.max(10, Math.min(cheight - 10, guppy.shape.y + velocity[1]));
        });
        self.stage.update();
    }

    self.food = new createjs.Shape();
    self.food.graphics.beginFill('orange').drawCircle(0, 0, 5);
    self.newFoodPos();
    self.stage.addChild(self.food);
}

$(function() {
    $('a#run').click(function() {
        var opts = {
            guppies: toFloat($('#num-guppies').val()),
            max_speed: toFloat($('#max-speed').val()),
            hidden_layer_size: toFloat($('#hidden-layer-size').val()),
            canvas: $('#default-canvas'),
        };
        if (!world)
            world = new World(opts);
        world.start();
        $('a#run, a#stop').toggle();
    });
    $('a#stop').click(function() {
        if (world)
            world.stop();
        world = null;
        $('a#run, a#stop').toggle();
    }).hide();
});
