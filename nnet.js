Math.roundTo = function (n, decimals) {
    return Math.round(n * Math.pow(10, decimals)) /  Math.pow(10, decimals);
}

nnet = (function() {
    function Neuron (num_inputs, network, is_input) {
        var self = this;
        self.is_input = is_input;
        if (is_input) {
            self.weights = [1];
            self.bias = 0;
        }
        else {
            self.bias = Math.random();
            self.weights = [];
            iter(num_inputs, function (i) {
                self.weights[i] = Math.random() * 2 - 1;
            });
        }
        self.calculate = function (inputs) {
            if (inputs.length != num_inputs)
                throw new Error('Expected ' + num_inputs + ' inputs, got ' + inputs.length);
            self.inputs = inputs;
            if (is_input) {
                self.activation = 0;
                self.output = inputs[0];
            }
            else {
                var activation = 0;
                iter(inputs, function (i, val) {
                    activation += val * self.weights[i];
                })
                activation -= self.bias;
                self.activation = activation;
                self.output = network.calcOutput(activation);
            }
            return self.output;
        };
    }

    function Layer (count, num_inputs, opts, network) {
        var self = this;
        self.neurons = [];
        self.is_input = !!opts.input;
        self.is_output = !!opts.output;
        iter(count, function(i) {
            self.neurons[i] = new Neuron(num_inputs, network, self.is_input);
        });
        self.calculate = function (inputs) {
            self.outputs = [];
            if (self.is_input) {
                if (inputs.length != self.neurons.length)
                    throw new Error('Expected ' + self.neurons.length + ' inputs, got ' + inputs.length);
                iter(self.neurons, function (n, neuron) {
                    self.outputs[n] = neuron.calculate([inputs[n]]);
                });
            }
            else {
                if (inputs.length != num_inputs)
                    throw new Error('Expected ' + num_inputs + ' inputs, got ' + inputs.length);
                iter(self.neurons, function (n, neuron) {
                    self.outputs[n] = neuron.calculate(inputs);
                });
            }
            return self.outputs;
        }
    }

    function Network (dims, opts) {
        var self = this;
        opts = opts || {};
        self.layers = [];
        self.setActivationCoefficient = function (n) {
            self.activationCoefficient = parseFloat(n);
            if (isNaN(self.activationCoefficient))
                self.activationCoefficient = 1;
        }
        self.setActivationCoefficient(opts.activationCoefficient);
        iter(dims, function(i, count) {
            self.layers[i] = new Layer(count, (i == 0) ? 1 : dims[i - 1], {
                input: i == 0,
                output: i == dims.length - 1
            }, self);
        });

        self.calculate = function (inputs) {
            var ilayer = self.layers[0];
            if (inputs.length != ilayer.neurons.length)
                throw new Error('Expected ' + ilayer.neurons.length + ' inputs, got ' + inputs.length);
            ilayer.calculate(inputs)
            for (var i = 1; i < self.layers.length; i++) {
                self.layers[i].calculate(self.layers[i - 1].outputs);
            }
            return self.layers[self.layers.length - 1].outputs;
        }

        self.calcOutput = function (activation) {
            return 1 / (1 + Math.exp(-activation / self.activationCoefficient));
        }

        self.iter = function (callback) {
            for (var layer = 0; layer < self.layers.length; layer++) {
                for (var n = 0; n < self.layers[layer].neurons.length; n++) {
                    callback(layer, n, self.layers[layer], self.layers[layer].neurons[n]);
                }
            }
        }
    }

    return {
        Neuron: Neuron,
        Layer: Layer,
        Network: Network,
    };
})();
