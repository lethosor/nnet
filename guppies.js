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

function Guppy (hidden_layers, hidden_layer_size) {
    var self = this;
    self.events = $({});
    self.points = 0;
    self.age = 0;
    self.selected = false;
    var dims = [2, 2];
    iter(hidden_layers, function() { dims.splice(1, 0, hidden_layer_size); });
    self.net = new nnet.Network(dims);
    self.shape = new createjs.Shape();
    self.velocity = {x: 0, y: 0};
    self.getStrokeColor = function() {
        if (self.selected)
            return 'red';
        else if (self.age >= 3)
            return '#070';
        else if (self.age == 2)
            return '#077';
        else if (self.age == 1)
            return '#007';
        else
            return '#000';
    }
    self.updateColor = function() {
        self.shape.graphics.clear().beginFill(num2color(self.points / 15))
            .beginStroke(self.getStrokeColor()).drawCircle(0, 0, 10);
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
    var gen_id = 1;
    var timeout_id = 0;
    var ticks = 0;
    self.tick_delay = 50;
    var cwidth = opts.canvas.width();
    var cheight = opts.canvas.height();
    self.stage = new createjs.Stage(opts.canvas[0]);

    self.isRunning = function() { return running; }
    self.getGeneration = function() { return gen_id; }
    self.init = function() {
        self.food = new createjs.Shape();
        self.food.graphics.beginFill('orange').drawCircle(0, 0, 5);
        self.newFoodPos();
        self.reinitStage();
        iter(opts.guppies, function (i) {
            var g = new Guppy(opts.hidden_layers, opts.hidden_layer_size);
            self.setupGuppy(g);
            self.guppies[i] = g;
        });
    }
    self.destroy = function() {
        self.clearStage();
        opts.timer.text('');
        opts.food_counter.text('');
        opts.generation_counter.text('');
    }
    self.clearStage = function() {
        self.stage.clear();
        self.stage.removeAllChildren();
    }
    self.reinitStage = function() {
        self.clearStage();
        self.stage.addChild(self.food);
    }
    self.setupGuppy = function (g) {
        g.shape.set({x: cwidth / 2, y: cheight / 2});
        self.stage.addChildAt(g.shape, 0);
        g.shape.on('click', function(evt, guppy) {
            self.cur_guppy = guppy;
            opts.well.show();
            self.updateDetails();
        }, null, false, g);
        g.events.on('levelUp', self.updateDetails);
    }
    self.start = function() {
        if (running)
            return;
        if (self.guppies.length != opts.guppies)
            self.init();
        running = true;
        self.tick();
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
        ticks++;
        timeout_id = setTimeout(self.tick, self.tick_delay);
        opts.generation_counter.text('Generation ' + gen_id);
        opts.timer.text('Ticks: ' + ticks);
        opts.food_counter.text('Food: ' + self.food_count);
        if (ticks % opts.generation_ticks == 0) {
            try {
                self.newgen();
                return;
            }
            catch (e) {}
        }
        var food_found = false;
        iter(self.guppies, function (i, guppy) {
            if (!food_found && distance(guppy.shape.x, guppy.shape.y, self.food.x, self.food.y) < 15) {
                food_found = true;
                self.food_count++;
                guppy.levelUp();
                self.newFoodPos();
            }
            switch (opts.control) {
            case 'vel':
            default:
                var velocity = guppy.net.calculate([guppy.shape.x - self.food.x, guppy.shape.y - self.food.y])
                    .map(function(n) {
                        return n * opts.max_speed * 2 - opts.max_speed;
                    });
                guppy.velocity.x = velocity[0];
                guppy.velocity.y = velocity[1];
                break;
            case 'accel':
                var accel = guppy.net.calculate([guppy.shape.x - self.food.x, guppy.shape.y - self.food.y])
                    .map(function(n) {
                        return n - 0.5;
                    });
                guppy.velocity.x = Math.max(-opts.max_speed, Math.min(opts.max_speed, guppy.velocity.x + accel[0]));
                guppy.velocity.y = Math.max(-opts.max_speed, Math.min(opts.max_speed, guppy.velocity.y + accel[1]));
                break;
            case 'polar-vel':
                var raw = guppy.net.calculate([guppy.shape.x - self.food.x, guppy.shape.y - self.food.y]);
                var speed = raw[0] * opts.max_speed * 2 - opts.max_speed;
                var angle = raw[1] * Math.PI * 2;
                guppy.velocity.x = speed * Math.cos(angle);
                guppy.velocity.y = speed * Math.sin(angle);
                break;
            }
            guppy.shape.x = Math.max(10, Math.min(cwidth - 10, guppy.shape.x + guppy.velocity.x));
            guppy.shape.y = Math.max(10, Math.min(cheight - 10, guppy.shape.y + guppy.velocity.y));
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
        contents += 'Age: ' + guppy.age + '\n';
        contents += '<b>Weights:</b>\n';
        guppy.net.iter(function(lid, nid, layer, neuron) {
            if (lid == 1)
                contents += nid + ' = ' + neuron.weights.map(function(n) { return roundTo(n, 5); }).join(', ') + '\n';
        });
        guppy.selected = true;
        opts.well.html(contents).show();
        var buttons = $('<div>').addClass('pull-right').prependTo(opts.well);
        $('<a>').addClass('btn btn-sm btn-warning').text('Dismiss')
            .appendTo(buttons).click(self.clearSelection).wrap($('<div>').css({textAlign: 'right'}));
        $('<a>').addClass('btn btn-sm btn-info btn-test-net').text('Test')
            .appendTo(buttons).wrap($('<div>').css({textAlign: 'right'})).data('net', guppy.net);
        self.stage.update();
    }

    self.clearSelection = function() {
        opts.well.hide();
        if (self.cur_guppy) {
            self.cur_guppy.selected = false;
            self.cur_guppy.updateColor();
            self.cur_guppy = null;
        }
        self.stage.update();
    }

    self.setOpts = function (new_opts) {
        opts = $.extend(opts, new_opts);
    }

    self.newgen = function() {
        var new_guppies = self.guppies.sort(function (a, b) {
            return b.points - a.points;
        }).filter(function (g) {
            return g.points;
        }).slice(0, Math.max(2, opts.guppies / 2));
        if (new_guppies.length < 2)
            throw new Error('Not enough intelligent guppies to evolve');
        self.guppies = new_guppies;
        new_guppies.map(function(g) {
            g.age++;
        });
        self.food_count = 0;
        self.reinitStage();
        while (self.guppies.length < opts.guppies) {
            var parents = [
                self.guppies[randInt(0, self.guppies.length - 1)],
                self.guppies[randInt(0, self.guppies.length - 1)]
            ]
            if (parents[0] == parents[1])
                continue;
            var g = new Guppy(opts.hidden_layers, opts.hidden_layer_size);
            g.net.iter(function(lid, nid, layer, neuron) {
                for (var i = 0; i < neuron.weights.length; i++) {
                    neuron.weights[i] = parents[randInt(0, 1)].net.layers[lid].neurons[nid].weights[i] || 0;
                    if (Math.random() * 100 < opts.mutation_rate)
                        neuron.weights[i] += ([-1, 1])[randInt(0, 1)] * Math.pow(Math.random(), 5);
                    neuron.weights[i] = Math.max(-1, Math.min(1, neuron.weights[i]));
                }
            });
            self.setupGuppy(g);
            self.guppies.push(g);
        }
        iter(self.guppies, function (i, g) {
            g.velocity = {x: 0, y: 0};
            g.points = 0;
            g.updateColor();
            g.shape.set({x: cwidth / 2, y: cheight / 2});
            self.stage.addChild(g.shape);
        });
        gen_id++;
        ticks = 0;
        if (self.cur_guppy) {
            if (self.guppies.indexOf(self.cur_guppy) == -1)
                self.clearSelection();
            else
                self.updateDetails();
        }
    }
}

$(function() {
    $('a#run').click(function() {
        var opts;
        try {
            opts = {
                guppies: toFloat($('#num-guppies').val()),
                max_speed: toFloat($('#max-speed').val()),
                mutation_rate: toFloat($('#mutation-rate').val()),
                hidden_layer_size: toFloat($('#hidden-layer-size').val()),
                hidden_layers: toInt($('#num-hidden-layers').val()),
                canvas: $('#default-canvas'),
                well: $('.well').first(),
                generation_ticks: toInt($('#gen-ticks').val()),
                timer: $('#timer'),
                food_counter: $('#food-count'),
                generation_counter: $('#generation-id'),
                control: $('#control').val(),
            };
        }
        catch (e) {
            showMessageBox('Invalid input', e.message, 'danger');
            return;
        }
        if (!world)
            world = new World(opts);
        else
            world.setOpts(opts);
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
            world.destroy();
        }
        world = null;
    });
    $('a#newgen').click(function() {
        if (world) {
            try {
                world.newgen();
            }
            catch (e) {
                showMessageBox('Error', e.message, 'warning');
            }
        }
    });
    $('a#warp').click(function() {
        if (world) {
            if (!$(this).hasClass('active'))
                world.tick_delay = 1;
            else
                world.tick_delay = 50;
        }
    });
    $('a#fullscreen').click(function() {
        $('#default-canvas')[0].requestFullscreen();
    });
    $('.well').hide().css({'max-height': 300, 'overflow': 'auto'});
    $('input#max-speed').on('keydown keyup', function() {
        try {
            world.setOpts({
                max_speed: toFloat($(this).val())
            });
        }
        catch (e) {}
    });
    $('input#mutation-rate').on('keydown keyup', function() {
        try {
            world.setOpts({
                mutation_rate: toFloat($(this).val())
            });
        }
        catch (e) {}
    });
    $('.well').on('click', '.btn-test-net', function() {
        var net = $(this).data('net');
        if (world && world.isRunning())
            $('a#run').click();
        var contents = $('<div>');
        contents.append(
            $('<h3>').text('Inputs:')
        );
        iter(net.layers[0].neurons.length, function() {
            contents.append(makeDialogInput());
        });
        contents.append(
            $('<h3>').text('Outputs:')
        );
        var outputs = $('<ul>').appendTo(contents);
        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_INFO,
            title: "Test network",
            message: contents,
            buttons: [
                {
                    label: "Close",
                    action: function(d) { d.close() }
                },
                {
                    cssClass: 'btn-primary',
                    label: "Test",
                    action: function() {
                        var inputs = [];
                        contents.find('input[type=text]').each(function (i, e) {
                            inputs.push(toFloat($(e).val()));
                        });
                        outputs.html('');
                        iter(net.calculate(inputs), function (i, out) {
                            $('<li>').text(out).appendTo(outputs);
                        });
                    }
                }
            ]
        });
    });
});
