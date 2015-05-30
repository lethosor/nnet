nnet = (function() {
    function Break() {};
    function iter (obj, cb) {
        var max = obj.length || obj;
        for (var i = 0; i < max; i++) {
            try {
                cb(i, obj[i]);
            }
            catch (e) {
                if (!(e instanceof Break))
                    throw e;
                break;
            }
        }
    }

    function Neuron (num_inputs, network) {
        var self = this;
        self.bias = Math.random();
        self.weights = [];
        iter(num_inputs, function (i) {
            self.weights[i] = Math.random();
        });
        self.calculate = function (inputs) {
            if (inputs.length != num_inputs)
                throw new Error('Expected ' + num_inputs + ' inputs, got ' + inputs.length);
            var activation = 0;
            iter(inputs, function (i, val) {
                activation += val * self.weights[i];
            })
            activation -= self.bias;
            self.output = network.calcOutput(activation);
            return self.output;
        };
    }

    function Layer (count, num_inputs, opts, network) {
        var self = this;
        self.neurons = [];
        self.is_input = !!opts.input;
        self.is_output = !!opts.output;
        iter(count, function(i) {
            self.neurons[i] = new Neuron(num_inputs, network);
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
        self.activationCoefficient = parseFloat(opts.activationCoefficient);
        if (isNaN(self.activationCoefficient))
            self.activationCoefficient = 1;
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
        }

        self.calcOutput = function (activation) {
            return 1 / (1 + Math.exp(-activation / self.activationCoefficient));
        }
    }

    return {
        Neuron: Neuron,
        Layer: Layer,
        Network: Network,
    };
})();
