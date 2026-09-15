import { describe, expect, it } from "vitest";
import { trainPerceptron } from "../src/lib/algorithms/neural/perceptron";
import { trainMLP, forwardMLP } from "../src/lib/algorithms/neural/mlp";
import { convolve2d, maxPool2d } from "../src/lib/algorithms/neural/cnn";
import { runRNN } from "../src/lib/algorithms/neural/rnn";
import { runLSTM } from "../src/lib/algorithms/neural/lstm";
import { runGRU } from "../src/lib/algorithms/neural/gru";
import {
  scaledDotProductAttention,
  softmaxRow,
  runMultiHeadAttention,
} from "../src/lib/algorithms/neural/attention";
import {
  numericalGradientCheck,
  runBackpropagation,
} from "../src/lib/algorithms/neural/backpropagation";
import { evaluateNetwork } from "../src/lib/algorithms/neural/networkBuilder";
import { convolutionPatch } from "../src/lib/algorithms/neural/cnn";
import {
  relu,
  sigmoid,
  stableSoftmax,
  tanhActivation,
} from "../src/lib/algorithms/neural/activations";
import { createFewShotEpisode } from "../src/lib/algorithms/neural/fewShot";
import { runTransferLearning } from "../src/lib/algorithms/neural/transferLearning";

describe("Phase 4 deep learning mathematics", () => {
  it("updates perceptron weights with the Rosenblatt rule and fails on XOR", () => {
    const separable = trainPerceptron(
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
      [0, 0, 0, 1],
      0.5,
      40,
      "step",
      { initialWeights: [0, 0], initialBias: 0 },
    );
    expect(separable.steps.at(-1)?.errors).toBe(0);

    const xor = trainPerceptron(
      [
        [-1, -1],
        [1, 1],
        [-1, 1],
        [1, -1],
      ],
      [0, 0, 1, 1],
      0.2,
      80,
      "step",
    );
    expect(xor.steps.at(-1)?.errors).toBeGreaterThan(0);
  });

  it("lets a small MLP learn XOR", () => {
    const X = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [0.02, 0.01],
      [0.01, 0.98],
      [0.97, 0.03],
      [0.99, 1.01],
    ];
    const y = [0, 1, 1, 0, 0, 1, 1, 0];
    const model = trainMLP(X, y, {
      hidden: [8, 8],
      activation: "tanh",
      learningRate: 0.2,
      epochs: 220,
      batchSize: 8,
      l2: 0,
      optimizer: "sgd",
      useBias: true,
      seed: 3,
    });
    const predictions = X.slice(0, 4).map(
      (row) => forwardMLP(row, model.weights, model.biases, "tanh").probability,
    );
    expect(predictions[0]).toBeLessThan(0.5);
    expect(predictions[1]).toBeGreaterThan(0.5);
    expect(predictions[2]).toBeGreaterThan(0.5);
    expect(predictions[3]).toBeLessThan(0.5);
  });

  it("matches the known 3×3 convolution and max-pool outputs", () => {
    const image = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    expect(
      convolve2d(image, [
        [1, 0],
        [0, 1],
      ]),
    ).toEqual([
      [6, 8],
      [12, 14],
    ]);
    expect(
      maxPool2d(
        [
          [1, 2],
          [3, 4],
        ],
        2,
      ),
    ).toEqual([[4]]);
  });

  it("advances one RNN hidden state from Wxh x + Whh h + b", () => {
    const result = runRNN(["a", "b"], 3, "tanh", "small", 0, 0);
    expect(result.states).toHaveLength(3);
    expect(result.states[0].every((value) => value === 0)).toBe(true);
    expect(result.states[1].every(Number.isFinite)).toBe(true);
    expect(result.states[1].some((value) => value !== 0)).toBe(true);
  });

  it("applies the LSTM gate equations", () => {
    const [step] = runLSTM([0.5], "sigmoid", "tanh", false, 0, 0, {}, 16, 1, {
      Wf: 0,
      Uf: 0,
      bf: 0,
      Wi: 0,
      Ui: 0,
      bi: 0,
      Wg: 0,
      Ug: 0,
      bg: 0,
      Wo: 0,
      Uo: 0,
      bo: 0,
    });
    expect(step.forget).toBeCloseTo(0.5, 8);
    expect(step.write).toBeCloseTo(0.5, 8);
    expect(step.output).toBeCloseTo(0.5, 8);
    expect(step.candidate).toBeCloseTo(0, 8);
    expect(step.cell).toBeCloseTo(0, 8);
    expect(step.hidden).toBeCloseTo(0, 8);
  });

  it("applies the GRU update interpolation h = (1-z)h + z h̃", () => {
    const [step] = runGRU(["x"], 0, 0, 0, "tanh", "float32");
    expect(step.update).toBeCloseTo(0.5, 8);
    expect(step.reset).toBeCloseTo(0.5, 8);
    expect(step.candidate).toBeCloseTo(0, 8);
    expect(step.hidden).toBeCloseTo(0, 8);
  });

  it("keeps softmax rows summing to 1 and respects a causal mask", () => {
    expect(softmaxRow([1, 2, 3]).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10);
    const attention = scaledDotProductAttention(
      [
        [1, 0],
        [0, 1],
      ],
      [
        [1, 0],
        [0, 1],
      ],
      [
        [1, 0],
        [0, 2],
      ],
      true,
      1,
    );
    expect(attention.weights[0][1]).toBeCloseTo(0, 8);
    expect(attention.weights[0].reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8);
    expect(attention.output[0][0]).toBeCloseTo(1, 6);
  });

  it("rejects multi-head layouts that do not divide the embedding size", () => {
    expect(() =>
      runMultiHeadAttention(["a", "b"], 3, 1, false, 0, false, 8),
    ).toThrow(/divisible/);
    const ok = runMultiHeadAttention(["a", "b", "c"], 2, 1, false, 0, false, 8);
    expect(ok.heads).toHaveLength(2);
    expect(ok.concatenated[0]).toHaveLength(8);
    expect(ok.projected[0]).toHaveLength(8);
    expect(ok.headDim).toBe(4);
  });

  it("matches finite-difference gradients in the backprop visualizer", () => {
    const check = numericalGradientCheck([0.2, -0.4], [0.5], "tanh", 1e-4);
    expect(check.relative).toBeLessThan(1e-3);
    const slow = runBackpropagation([0.2, -0.4], [0.5], "tanh", 0.01);
    const fast = runBackpropagation([0.2, -0.4], [0.5], "tanh", 0.2);
    expect(Math.abs(fast.updated1[0][0] - slow.weights1[0][0])).toBeGreaterThan(
      Math.abs(slow.updated1[0][0] - slow.weights1[0][0]),
    );
  });

  it("counts network-builder parameters from layer shapes", () => {
    const layers = evaluateNetwork([
      { id: "in", type: "input", shape: [8, 8, 1] },
      {
        id: "c",
        type: "conv",
        filters: 4,
        kernel: 3,
        stride: 1,
        padding: "same",
        activation: "relu",
        bias: true,
      },
      { id: "g", type: "globalavg" },
      { id: "d", type: "dense", units: 2, activation: "softmax", bias: true },
    ]);
    expect(layers[1].parameters).toBe(3 * 3 * 1 * 4 + 4);
    expect(layers[3].parameters).toBe(4 * 2 + 2);
    expect(layers.every((layer) => layer.valid)).toBe(true);
  });

  it("reproduces MLP training with a fixed seed", () => {
    const X = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ];
    const y = [0, 1, 1, 0];
    const options = {
      hidden: [4],
      activation: "relu" as const,
      learningRate: 0.1,
      epochs: 20,
      batchSize: 4,
      l2: 0,
      optimizer: "sgd" as const,
      useBias: true,
      seed: 9,
    };
    const a = trainMLP(X, y, options);
    const b = trainMLP(X, y, options);
    expect(a.trainLoss).toEqual(b.trainLoss);
  });

  it("matches activations, stable softmax, and convolution patch arithmetic", () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 12);
    expect(tanhActivation(0)).toBe(0);
    expect(relu(-1)).toBe(0);
    expect(relu(2)).toBe(2);
    expect(relu(-2, 0.1)).toBeCloseTo(-0.2, 12);
    const row = stableSoftmax([1000, 1000, 1000]);
    expect(row.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10);
    expect(row.every(Number.isFinite)).toBe(true);
    const inspect = convolutionPatch(
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
      [
        [1, 0],
        [0, 1],
      ],
      0,
      0,
    );
    expect(inspect.patch).toEqual([
      [1, 2],
      [4, 5],
    ]);
    expect(inspect.sum).toBe(6);
    expect(inspect.output).toBe(6);
  });

  it("rebuilds few-shot prototypes when the support set changes", () => {
    const a = createFewShotEpisode(3, 2, 4, "euclidean", 4);
    const b = createFewShotEpisode(3, 2, 4, "euclidean", 9);
    expect(a.prototypes[0]).not.toEqual(b.prototypes[0]);
    expect(a.predictions[0].probability).toBeGreaterThan(0);
    expect(
      a.predictions[0].distances.reduce((sum, value) => sum + value, 0),
    ).toBeGreaterThan(0);
  });

  it("does not update the frozen extractor when only the head is trained", () => {
    const frozen = runTransferLearning({
      classes: 3,
      samplesPerClass: 10,
      epochs: 4,
      learningRate: 0.0004,
      trainableBlocks: 0,
      seed: 8,
      batchSize: 5,
    });
    const unfrozen = runTransferLearning({
      classes: 3,
      samplesPerClass: 10,
      epochs: 4,
      learningRate: 0.0004,
      trainableBlocks: 2,
      seed: 8,
      batchSize: 5,
    });
    expect(frozen.extractorUpdated).toBe(false);
    expect(frozen.frozenParameters).toBeGreaterThan(0);
    expect(unfrozen.trainableParameters).toBeGreaterThan(frozen.trainableParameters);
    expect(frozen.history[0].validationLoss).not.toBe(
      frozen.history[0].trainLoss * (1.04 + 0.012 * Math.sin(1)),
    );
    const stopped = runTransferLearning({
      classes: 3,
      samplesPerClass: 8,
      epochs: 20,
      learningRate: 0.0004,
      trainableBlocks: 0,
      seed: 2,
      batchSize: 4,
      earlyStopping: true,
      patience: 2,
    });
    expect(stopped.stoppedAt).toBeLessThanOrEqual(20);
    expect(stopped.history).toHaveLength(stopped.stoppedAt);
  });
});
