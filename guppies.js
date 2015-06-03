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
    self.events = $({});
    self.points = 0;
    self.selected = false;
    self.net = new nnet.Network([2, hidden_layer_size, 2]);
    self.shape = new createjs.Shape();
    self.updateColor = function() {
        self.shape.graphics.clear().beginFill(num2color(self.points / 15))
            .beginStroke(self.selected ? 'red' : 'black').drawCircle(0, 0, 10);
    }
    self.updateColor();
    self.levelUp = function() {
        self.points++;
        self.updateColor();
        self.events.trigger('levelUp');
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

    self.isRunning = function() { return running; }
    self.init = function() {
        self.stage.clear();
        self.stage.removeAllChildren();
        self.food = new createjs.Shape();
        self.food.graphics.beginFill('orange').drawCircle(0, 0, 5);
        self.newFoodPos();
        self.stage.addChild(self.food);
        iter(opts.guppies, function (i) {
            var g = new Guppy(opts.hidden_layer_size);
            g.shape.set({x: cwidth / 2, y: cheight / 2});
            self.stage.addChild(g.shape);
            self.guppies[i] = g;
            g.shape.on('click', function(evt, guppy) {
                self.cur_guppy = guppy;
                opts.well.show();
                self.updateDetails();
            }, null, false, g);
            g.events.on('levelUp', self.updateDetails);
        });
    }
    self.start = function() {
        if (running)
            return;
        if (self.guppies.length != opts.guppies)
            self.init();
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

    self.food_count = 0;
    self.tick = function() {
        if (!running) {
            self.stop();
            return;
        }
        food_found = false;
        iter(self.guppies, function (i, guppy) {
            if (!food_found && distance(guppy.shape.x, guppy.shape.y, self.food.x, self.food.y) < 15) {
                food_found = true;
                self.food_count++;
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

    self.updateDetails = function () {
        iter(self.guppies, function (i, guppy) {
            guppy.selected = (guppy == self.cur_guppy);
            guppy.updateColor();
        })
        var guppy = self.cur_guppy;
        if (!guppy || !opts.well.is(':visible'))
            return;
        var contents = 'Points: ' + guppy.points + '/' + self.food_count;
        if (self.food_count)
            contents += ' (' + Math.floor(guppy.points / self.food_count * 100) + '%)';
        contents += '\n';
        contents += '<b>Weights:</b>\n';
        guppy.net.iter(function(lid, nid, layer, neuron) {
            if (lid == 1)
                contents += nid + ' = ' + neuron.weights.map(function(n) { return roundTo(n, 5); }).join(', ') + '\n';
        });
        guppy.selected = true;
        opts.well.html(contents).show();
        $('<a>').addClass('btn btn-sm btn-warning pull-right').text('Dismiss').prependTo(opts.well).click(function() {
            opts.well.hide();
            guppy.selected = false;
            guppy.updateColor();
            self.cur_guppy = null;
            self.stage.update();
        });
        self.stage.update();
    }
}

$(function() {
    $('a#run').click(function() {
        var opts = {
            guppies: toFloat($('#num-guppies').val()),
            max_speed: toFloat($('#max-speed').val()),
            hidden_layer_size: toFloat($('#hidden-layer-size').val()),
            canvas: $('#default-canvas'),
            well: $('.well').first(),
        };
        if (!world)
            world = new World(opts);
        if (!world.isRunning()) {
            world.start();
            $(this).text('Pause');
        }
        else {
            world.stop();
            $(this).text('Run');
        }
    });
    $('a#reset').click(function() {
        if (world) {
            if (world.isRunning())
                $('a#run').click();
            world.stage.clear();
            world.stage.removeAllChildren();
        }
        world = null;
    });
    $('.well').hide().css({'max-height': 300, 'overflow': 'auto'});
});
