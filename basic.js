function num2color (n) {
    if (n <= 0.5)
        return createjs.Graphics.getRGB(255, Math.floor(255 * n * 2), 0);
    else
        return createjs.Graphics.getRGB(Math.floor(255 * 2 * (1 - n)), 255, 0);
}

function Circle (x, y, r, fill) {
    this.x = x; this.y = y; this.r = r;
    var s = new createjs.Shape();
    var _stage;
    s.x = x;
    s.y = y;
    this.setFill = function (color) {
        s.graphics.clear();
        s.graphics.setStrokeStyle(1);
        s.graphics.beginStroke('#555');
        s.graphics.beginFill(color);
        s.graphics.drawCircle(0, 0, r);
        if (_stage)
            _stage.update();
    }
    if (fill)
        this.setFill(fill);
    this.addTo = function (stage) {
        stage.addChild(s);
        _stage = stage;
    }
}

function main (i1, i2, hidden) {
    var stage = new createjs.Stage("default-canvas");
    var err = new createjs.Text("", "20px Arial", "red");
    var width = $('#default-canvas').width();
    var height = $('#default-canvas').height();
    err.x = 10; err.y = 10;
    stage.addChild(err);
    if (isNaN(i1) || isNaN(i2) || isNaN(hidden)) {
        err.text = "Invalid input";
        stage.update();
        return;
    }
    var dims = [2, 2];
    for (var i = 0; i < hidden; i++)
        dims.splice(1, 0, 3);
    net = new nnet.Network(dims, {
        activationCoefficient: $('#acoeff').val()
    });
    for (var i = 0; i < net.layers.length; i++) {
        var layer = net.layers[i];
        for (var j = 0; j < layer.neurons.length; j++) {
            var neuron = layer.neurons[j];
            neuron.circle = new Circle(
                (width / net.layers.length) * (i + 0.5),
                (height / layer.neurons.length) * (j + 0.5),
                30,
                'red'
            );
            neuron.circle.addTo(stage);
        }
    }
    net.calculate([i1, i2]);
    stage.update();
    for (var i = 0; i < net.layers.length; i++) {
        var layer = net.layers[i];
        for (var j = 0; j < layer.neurons.length; j++) {
            var neuron = layer.neurons[j];
            neuron.circle.setFill(num2color(neuron.output));
        }
    }
    stage.update();
    return;
}

$(function() {
    $('button#run').click(function() {
        main(parseFloat($('#input1').val()),
            parseFloat($('#input2').val()),
            Math.max(1, Math.min(3, parseFloat($('#num-hidden').val())))
        );
    });
})
