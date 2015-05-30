function num2color (n) {
    if (n <= 0.5)
        return createjs.Graphics.getRGB(255, Math.floor(255 * n * 2), 0);
    else
        return createjs.Graphics.getRGB(Math.floor(255 * 2 * (1 - n)), 255, 0);
}

function Circle (x, y, r, fill) {
    this.x = x; this.y = y; this.r = r;
    var s = new createjs.Shape();
    this.shape = s;
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

function handleMouseEvent (evt, data) {
    if (evt.type == 'mouseover') {
        var neuron = data.neuron;
        var tt = $('.ctooltip').show().css({
            whiteSpace: 'pre',
            position: 'absolute',
            zIndex: 2,
            top: $('#default-canvas').offset().top + data.y + data.r,
            left: $('#default-canvas').offset().left + data.x + data.r,
        });
        var text = 'Inputs: \n';
        for (var i = 0; i < neuron.inputs.length; i++) {
            text += Math.roundTo(neuron.inputs[i], 5) + ' * ' + Math.roundTo(neuron.weights[i], 5) + '\n';
        }
        text += 'Bias: ' + Math.roundTo(neuron.bias, 5) + '\n';
        text += 'Activation: ' + Math.roundTo(neuron.activation, 5) + '\n';
        text += 'Output: ' + Math.roundTo(neuron.output, 5) + '\n';
        tt.text(text);
    }
    else {
        $('.ctooltip').hide();
    }
}

function main (i1, i2, hidden_layers, hidden_neurons, create) {
    stage.removeAllChildren();
    var err = new createjs.Text("", "20px Arial", "red");
    var width = $('#default-canvas').width();
    var height = $('#default-canvas').height();
    err.x = 10; err.y = 10;
    stage.addChild(err);
    if (isNaN(i1) || isNaN(i2) || isNaN(hidden_layers) || isNaN(hidden_neurons)) {
        err.text = "Invalid input";
        stage.update();
        return;
    }
    var dims = [2, 2];
    for (var i = 0; i < hidden_layers; i++)
        dims.splice(1, 0, hidden_neurons);
    if (create) {
        net = new nnet.Network(dims);
    }
    net.setActivationCoefficient($('#acoeff').val());
    net.iter(function(lid, nid, layer, neuron) {
        var x = (width / net.layers.length) * (lid + 0.5);
        var y = (height / layer.neurons.length) * (nid + 0.5);
        var r = 30;
        var data = {neuron: neuron, x: x, y: y, r: r}
        neuron.circle = new Circle(x, y, r, 'black');
        neuron.circle.addTo(stage);
        neuron.circle.shape.on('mouseover', handleMouseEvent, null, false, data);
        neuron.circle.shape.on('mouseout', handleMouseEvent, null, false, data);
    })
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
    net = new nnet.Network([2, 3, 2]);
    stage = new createjs.Stage("default-canvas");
    stage.enableMouseOver();
    $('.ctooltip').hide();
    $('button#run, button#create').click(function() {
        main(parseFloat($('#input1').val()),
            parseFloat($('#input2').val()),
            Math.max(1, Math.min(3, parseFloat($('#num-hidden-layers').val()))),
            Math.max(1, Math.min(5, parseFloat($('#num-hidden-neurons').val()))),
            $(this).attr('id') == 'create'
        );
    });
    $('input[type=text]').on('keydown', function (evt) {
        if (evt.which == 13)
            $('button#run').click();
    })
})
