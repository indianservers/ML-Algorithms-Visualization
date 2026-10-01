import type { QuizQuestion } from "../components/common/TopicQuickQuiz";

export const classifierQuestions: Record<"sentiment" | "text" | "spam", QuizQuestion[]> = {
  sentiment: [
    { prompt: "What does the lexicon Sentiment Score represent?", choices: ["A calibrated probability", "A word-based polarity score", "The Naive Bayes accuracy"], answer: 1, explanation: "The lexicon score summarizes matched positive and negative words; it is not a probability." },
    { prompt: "Which documents are allowed to build the Naive Bayes vocabulary?", choices: ["The training split only", "Training and test together", "The text entered for inference"], answer: 0, explanation: "Fitting vocabulary on test or inference text would leak information into the model." },
  ],
  text: [
    { prompt: "Why fit the vocabulary on the training split only?", choices: ["To make all words identical", "To avoid test-data leakage", "To remove class labels"], answer: 1, explanation: "The held-out test split must not influence the model or its vocabulary." },
    { prompt: "How does multinomial Naive Bayes classify a new document?", choices: ["By choosing the largest class posterior score", "By measuring sentence length only", "By changing the training labels"], answer: 0, explanation: "It combines class priors and token likelihoods, then selects the class with the largest posterior score." },
  ],
  spam: [
    { prompt: "What does Laplace smoothing prevent?", choices: ["A zero likelihood for an unseen class-token pair", "All false positives", "The need for training data"], answer: 0, explanation: "Smoothing gives an unseen token a small nonzero conditional likelihood." },
    { prompt: "Changing the spam threshold does what?", choices: ["Retrains the tokenizer", "Changes the decision from the same scores", "Deletes the test fold"], answer: 1, explanation: "The threshold changes the final class decision; it does not retrain Naive Bayes." },
  ],
};

const deepQuestion = (prompt: string, choices: [string, string, string], answer: number, explanation: string): QuizQuestion[] => [{ prompt, choices, answer, explanation }];

export const deepLearningQuestions: Record<string, QuizQuestion[]> = {
  "/ml/deep-learning/perceptron": deepQuestion("When does a perceptron update its weights?", ["After a misclassified training example", "Only after inference", "Whenever the plot is resized"], 0, "The classic perceptron rule updates weights when its current decision is wrong."),
  "/ml/deep-learning/mlp": deepQuestion("Why does an MLP need nonlinear activations?", ["To make stacked layers model nonlinear boundaries", "To eliminate all training data", "To make every weight identical"], 0, "Without nonlinearities, stacked dense layers collapse to a single linear transformation."),
  "/ml/deep-learning/nn-playground": deepQuestion("What should you inspect when a network fits training points but fails on new points?", ["Generalization and overfitting", "Only the number of colors", "The browser window size"], 0, "A model can memorize training samples yet fail away from them; compare its boundary on unseen points."),
  "/ml/deep-learning/cnn": deepQuestion("What does a convolutional filter do?", ["Slides a small set of weights over local pixels", "Reads only the image filename", "Assigns a class before training"], 0, "The same local kernel is reused across image positions to build feature maps."),
  "/ml/deep-learning/convolution-visualizer": deepQuestion("Why can one kernel find a pattern in different image positions?", ["Its weights are shared as it slides", "The image never moves", "Each pixel gets an unrelated model"], 0, "Convolution reuses the same kernel across the spatial grid."),
  "/ml/deep-learning/rnn": deepQuestion("What carries information from one sequence step to the next?", ["The recurrent hidden state", "The browser URL", "The test split"], 0, "An RNN updates a hidden state at each time step and passes it forward."),
  "/ml/deep-learning/lstm": deepQuestion("What helps an LSTM retain useful information over many steps?", ["Gated cell state", "A larger image filter", "A nearest-neighbor vote"], 0, "Input, forget, and output gates regulate information flow through the cell state."),
  "/ml/deep-learning/gru": deepQuestion("Which GRU gate controls how much past hidden state is retained?", ["Update gate", "Pooling gate", "Class threshold"], 0, "The update gate balances the prior hidden state against a candidate state."),
  "/ml/deep-learning/transformer-attention": deepQuestion("What does attention weight express?", ["How strongly one token uses information from another", "A fixed class label", "The number of training epochs"], 0, "Attention scores determine the weighted mixture of value vectors for a query token."),
  "/ml/deep-learning/multi-head-attention": deepQuestion("Why use more than one attention head?", ["To learn different relationships in parallel", "To remove all positional information", "To guarantee a correct answer"], 0, "Separate heads can focus on different token relationships before their outputs are combined."),
  "/ml/deep-learning/backpropagation-visualizer": deepQuestion("What does backpropagation compute?", ["Gradients of the loss with respect to parameters", "New labels for the dataset", "The browser refresh rate"], 0, "The chain rule propagates loss derivatives backward through the network."),
  "/ml/deep-learning/few-shot-learning": deepQuestion("What defines a few-shot episode?", ["A small labeled support set and queries", "A million labels per class", "Only unlabeled test samples"], 0, "Few-shot learning uses a small support set to classify new query examples."),
  "/ml/deep-learning/network-builder": deepQuestion("What must stay consistent between training and inference?", ["Input features and preprocessing", "The button color", "The training progress animation"], 0, "Inference must use the same feature shape and preprocessing that the model saw during training."),
  "/ml/deep-learning/transfer-learning": deepQuestion("What is transferred in transfer learning?", ["Representations learned by a source model", "Test labels copied into training", "Only the screen layout"], 0, "A pretrained feature extractor supplies reusable representations for a new task."),
};

export const nlpConceptQuestions: Record<string, QuizQuestion[]> = {
  "/ml/nlp/bag-of-words": deepQuestion("What does a bag-of-words vector keep?", ["Token counts or presence", "Full sentence order and meaning", "Only punctuation"], 0, "Bag of words represents vocabulary frequencies or presence; sequence information is mostly discarded."),
  "/ml/nlp/tf-idf": deepQuestion("When is a term's IDF relatively high?", ["When it occurs in few documents", "When it occurs in every document", "When its spelling is longer"], 0, "Inverse document frequency gives greater weight to terms that appear in fewer documents."),
  "/ml/nlp/word-embedding-concept": deepQuestion("What does cosine similarity compare in this lab?", ["The direction of two embedding vectors", "Their word lengths", "How often a word appears in the browser"], 0, "Cosine compares vector directions. Here the vectors come from a fixed educational table."),
  "/ml/nlp/audio-classification": deepQuestion("What information does the audio model receive?", ["Features derived from audio frequency bands", "The audio file name", "A sentiment lexicon score"], 0, "The classifier trains on Mel-band features from clips, not text or filenames."),
};
