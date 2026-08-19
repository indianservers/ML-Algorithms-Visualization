import type { RouteLessonContent } from './learningContent';

export const generatedAlgorithmLessons: Record<string, RouteLessonContent> = {
  "/ml/supervised/simple-linear-regression": {
    "algorithmId": "supervised-learning-regression-simple-linear-regression",
    "sourceTitle": "Simple Linear Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Simple Linear Regression: The Lemonade Line",
        "story": "Anaya runs a tiny lemonade stall. Every hot afternoon she writes down the temperature and how many cups she sells. Soon she wants tomorrow's answer before tomorrow arrives.",
        "simpleExplanation": "Simple Linear Regression is the main tool in this story because it learns a straight relationship between one clue and one number to predict. Linear regression models a continuous target as a straight-line relationship between an input feature and an output.",
        "realtimeExample": "A store estimates demand from weather so it can prepare enough stock without wasting food.",
        "realtimeApplications": [
          "price estimation",
          "demand forecasting",
          "school science trend lines",
          "energy usage prediction"
        ],
        "teacherTip": "Before touching code, ask: what is the input, what is the output, and what mistake would hurt a real person?"
      },
      {
        "pageNumber": 2,
        "title": "Simple Linear Regression in Kid-Simple English",
        "story": "It is like drawing the fairest straight road through scattered dots on graph paper.",
        "simpleExplanation": "Simple Linear Regression predicts a number by learning a line. If temperature goes up, cup sales may go up too. The line turns that pattern into a prediction.",
        "realtimeExample": "A store estimates demand from weather so it can prepare enough stock without wasting food.",
        "realtimeApplications": [
          "You see this idea in price estimation",
          "demand forecasting",
          "school science trend lines",
          "energy usage prediction."
        ],
        "teacherTip": "Teach it to a younger friend in one sentence. If they can repeat it, you understand the heart of Simple Linear Regression."
      },
      {
        "pageNumber": 3,
        "title": "How Simple Linear Regression Thinks",
        "story": "Now Anaya slows down and watches the algorithm one move at a time.",
        "simpleExplanation": "1. Collect pairs like temperature and cups sold. 2. Draw a starting line. 3. Measure how far the line is from each real sale. 4. Move the line to reduce total error. 5. Use the final line for a new temperature.",
        "realtimeExample": "A production ML team would log each step, compare it against validation data, and check whether the model still behaves well on fresh examples.",
        "realtimeApplications": [
          "Slope tells how strongly the input changes the output; intercept is the starting value when the input is zero."
        ],
        "teacherTip": "Follow the data like a detective follows footprints. Each step should explain the next step."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math of Simple Linear Regression",
        "story": "The math is the scoreboard. It tells Anaya whether the algorithm is getting warmer or colder.",
        "simpleExplanation": "y_hat = wx + b,   minimize sum_i (y_i - y_hat_i)^2. Ordinary least squares chooses the line with minimum squared residual error.",
        "realtimeExample": "The equation turns every x into y_hat, and the loss measures how far y_hat is from the real y.",
        "realtimeApplications": [
          "Important setting: learning rate",
          "slope",
          "intercept",
          "and residual error."
        ],
        "teacherTip": "Do not fear the equation. Point to each part and say what real thing it measures."
      },
      {
        "pageNumber": 5,
        "title": "Simple Linear Regression in the Real World",
        "story": "Anaya learns that the line is helpful, but it cannot predict a festival day unless festival data was part of the clues.",
        "simpleExplanation": "Superpower: clear, explainable numeric prediction. Careful: a straight line can miss curves, outliers, and hidden causes.",
        "realtimeExample": "A store estimates demand from weather so it can prepare enough stock without wasting food.",
        "realtimeApplications": [
          "price estimation",
          "demand forecasting",
          "school science trend lines",
          "energy usage prediction"
        ],
        "teacherTip": "Award-winning ML thinking is honest thinking: test on new data, explain limits, and improve carefully."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Simple Linear Regression?",
        "options": [
          "Use it as an interpretable baseline for numeric prediction and for learning residuals, slope, intercept, and least-sq...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it as an interpretable baseline for numeric prediction and for learning residuals, slope, intercept, and least-squares fitting. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Simple Linear Regression?",
        "options": [
          "Price estimation",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Simple Linear Regression is Price estimation."
      },
      {
        "question": "Why does the formula matter for Simple Linear Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Simple Linear Regression?",
        "options": [
          "fit_intercept",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is fit_intercept."
      },
      {
        "question": "What is a common mistake when using Simple Linear Regression?",
        "options": [
          "Treating correlation as causation",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Treating correlation as causation."
      }
    ]
  },
  "/ml/supervised/multiple-linear-regression": {
    "algorithmId": "supervised-learning-regression-multiple-linear-regression",
    "sourceTitle": "Multiple Linear Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Multiple Linear Regression: The Number Predictor",
        "story": "Asha faces a real problem: a neighborhood shop wants to estimate tomorrow's demand before ordering supplies. Multiple Linear Regression enters the story because it learns how clues connect to a numeric answer.",
        "simpleExplanation": "Multiple Linear Regression is a regression concept in supervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Multiple Linear Regression predicts a number, not a label. It studies past examples and learns how inputs push the output up or down.",
        "realtimeExample": "A planning system forecasts sales, traffic, energy use, or delivery time from historical signals.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Multiple Linear Regression feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Multiple Linear Regression as a Simple Picture",
        "story": "Picture a smooth measuring tape stretched across scattered dots. The tape is useful only if it stays close to most dots.",
        "simpleExplanation": "Imagine balancing a line or curve through a cloud of points so the total residual error is small. The model is trying to make prediction errors smaller while staying simple enough to trust.",
        "realtimeExample": "In a classroom demo, students can use prices, temperatures, house sizes, or study hours drawn as input-output pairs to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Multiple Linear Regression Works Step by Step",
        "story": "Asha slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Prepare numeric features and targets 2. Compute predictions 3. Measure residual loss 4. Update parameters 5. Validate on unseen points",
        "realtimeExample": "A team prepares numeric features, trains the model, checks residuals, and tests whether errors stay reasonable on new days.",
        "realtimeApplications": [
          "The important mechanics are feature quality",
          "target definition",
          "residual error",
          "and validation on unseen examples."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Multiple Linear Regression",
        "story": "The math is a scoreboard for Asha. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "y_hat = f(x; theta),   J(theta) = (1/n) sum L(y_hat_i, y_i). Training chooses parameters that minimize prediction error, optionally with regularization.",
        "realtimeExample": "The equation is a promise: convert inputs into a predicted number, then measure how far that number is from reality.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Multiple Linear Regression in Real Applications",
        "story": "Asha finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Strong, interpretable baseline. Watch-outs: Misses unmodelled nonlinear structure, Outliers can dominate common losses, Correlation is not causation. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "If a festival, storm, or holiday changes behavior, the model can look confident while being wrong.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Jobs that use this thinking include demand planning",
          "pricing",
          "forecasting",
          "and operations analytics."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Multiple Linear Regression?",
        "options": [
          "Use it to estimate a continuous outcome and explain how features move that estimate. Focus on the visible input-to-ou...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to estimate a continuous outcome and explain how features move that estimate. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Multiple Linear Regression?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Multiple Linear Regression is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Multiple Linear Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Multiple Linear Regression?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Multiple Linear Regression?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/supervised/polynomial-regression": {
    "algorithmId": "supervised-learning-regression-polynomial-regression",
    "sourceTitle": "Polynomial Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Polynomial Regression: The Number Predictor",
        "story": "Asha faces a real problem: a neighborhood shop wants to estimate tomorrow's demand before ordering supplies. Polynomial Regression enters the story because it learns how clues connect to a numeric answer.",
        "simpleExplanation": "Polynomial regression fits a curved relationship by expanding the input into powers such as x, x^2, and x^3, then applying linear regression. In kid-simple words, Polynomial Regression predicts a number, not a label. It studies past examples and learns how inputs push the output up or down.",
        "realtimeExample": "A planning system forecasts sales, traffic, energy use, or delivery time from historical signals.",
        "realtimeApplications": [
          "Growth curves",
          "Calibration curves",
          "Physics-inspired curve fitting"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Polynomial Regression feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Polynomial Regression as a Simple Picture",
        "story": "Picture a smooth measuring tape stretched across scattered dots. The tape is useful only if it stays close to most dots.",
        "simpleExplanation": "Instead of bending the model directly, you give linear regression extra curved features to combine. The model is trying to make prediction errors smaller while staying simple enough to trust.",
        "realtimeExample": "In a classroom demo, students can use prices, temperatures, house sizes, or study hours drawn as input-output pairs to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Growth curves",
          "Calibration curves",
          "Physics-inspired curve fitting."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Polynomial Regression Works Step by Step",
        "story": "Asha slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Choose polynomial degree 2. Create powers of each feature 3. Fit linear coefficients on expanded features 4. Inspect training versus validation error 5. Reduce degree or regularize if the curve wiggles too much",
        "realtimeExample": "A team prepares numeric features, trains the model, checks residuals, and tests whether errors stay reasonable on new days.",
        "realtimeApplications": [
          "The important mechanics are feature quality",
          "target definition",
          "residual error",
          "and validation on unseen examples."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Polynomial Regression",
        "story": "The math is a scoreboard for Asha. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "y_hat = b + w1*x + w2*x^2 + ... + wd*x^d. The model is linear in coefficients but nonlinear in the original input.",
        "realtimeExample": "The equation is a promise: convert inputs into a predicted number, then measure how far that number is from reality.",
        "realtimeApplications": [
          "Important setting to inspect: degree."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Polynomial Regression in Real Applications",
        "story": "Asha finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Captures smooth curves. Watch-outs: High degree can overfit, Feature values can explode without scaling, Poor extrapolation outside training range. Common mistakes: Choosing degree from test data, Trusting extrapolation, Skipping scaling for high-degree terms.",
        "realtimeExample": "If a festival, storm, or holiday changes behavior, the model can look confident while being wrong.",
        "realtimeApplications": [
          "Growth curves",
          "Calibration curves",
          "Physics-inspired curve fitting. Jobs that use this thinking include demand planning",
          "pricing",
          "forecasting",
          "and operations analytics."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Polynomial Regression?",
        "options": [
          "Use it when a numeric target follows a smooth nonlinear curve but you still want a transparent parametric model. Focu...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it when a numeric target follows a smooth nonlinear curve but you still want a transparent parametric model. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Polynomial Regression?",
        "options": [
          "Growth curves",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Polynomial Regression is Growth curves."
      },
      {
        "question": "Why does the formula matter for Polynomial Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Polynomial Regression?",
        "options": [
          "degree",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is degree."
      },
      {
        "question": "What is a common mistake when using Polynomial Regression?",
        "options": [
          "Choosing degree from test data",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Choosing degree from test data."
      }
    ]
  },
  "/ml/supervised/ridge-regression": {
    "algorithmId": "supervised-learning-regression-ridge-regression",
    "sourceTitle": "Ridge Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Ridge Regression: The Number Predictor",
        "story": "Asha faces a real problem: a neighborhood shop wants to estimate tomorrow's demand before ordering supplies. Ridge Regression enters the story because it learns how clues connect to a numeric answer.",
        "simpleExplanation": "Ridge regression is linear regression with an L2 penalty that shrinks coefficients toward zero without usually making them exactly zero. In kid-simple words, Ridge Regression predicts a number, not a label. It studies past examples and learns how inputs push the output up or down.",
        "realtimeExample": "A planning system forecasts sales, traffic, energy use, or delivery time from historical signals.",
        "realtimeApplications": [
          "High-dimensional regression",
          "Forecasting baselines",
          "Noisy tabular prediction"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Ridge Regression feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Ridge Regression as a Simple Picture",
        "story": "Picture a smooth measuring tape stretched across scattered dots. The tape is useful only if it stays close to most dots.",
        "simpleExplanation": "The model still fits a line or plane, but large weights become costly, so the fit becomes smoother and less brittle. The model is trying to make prediction errors smaller while staying simple enough to trust.",
        "realtimeExample": "In a classroom demo, students can use prices, temperatures, house sizes, or study hours drawn as input-output pairs to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for High-dimensional regression",
          "Forecasting baselines",
          "Noisy tabular prediction."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Ridge Regression Works Step by Step",
        "story": "Asha slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Scale numeric features 2. Fit linear predictions 3. Add lambda * sum(w^2) to the loss 4. Tune lambda on validation data 5. Inspect coefficients and residuals",
        "realtimeExample": "A team prepares numeric features, trains the model, checks residuals, and tests whether errors stay reasonable on new days.",
        "realtimeApplications": [
          "The important mechanics are feature quality",
          "target definition",
          "residual error",
          "and validation on unseen examples."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Ridge Regression",
        "story": "The math is a scoreboard for Asha. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "min_w sum_i (y_i - x_i^T w)^2 + lambda * sum_j w_j^2. The L2 penalty reduces variance by discouraging large coefficients.",
        "realtimeExample": "The equation is a promise: convert inputs into a predicted number, then measure how far that number is from reality.",
        "realtimeApplications": [
          "Important setting to inspect: alpha or lambda."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Ridge Regression in Real Applications",
        "story": "Asha finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Handles multicollinearity. Watch-outs: Does not perform feature selection, Still linear in engineered features, Requires tuning lambda. Common mistakes: Applying penalty to unscaled features, Assuming small coefficients mean no effect, Tuning lambda on the test set.",
        "realtimeExample": "If a festival, storm, or holiday changes behavior, the model can look confident while being wrong.",
        "realtimeApplications": [
          "High-dimensional regression",
          "Forecasting baselines",
          "Noisy tabular prediction. Jobs that use this thinking include demand planning",
          "pricing",
          "forecasting",
          "and operations analytics."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Ridge Regression?",
        "options": [
          "Use it to stabilize linear models when features are correlated or numerous. Focus on the visible input-to-output beha...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to stabilize linear models when features are correlated or numerous. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Ridge Regression?",
        "options": [
          "High-dimensional regression",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Ridge Regression is High-dimensional regression."
      },
      {
        "question": "Why does the formula matter for Ridge Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Ridge Regression?",
        "options": [
          "alpha or lambda",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is alpha or lambda."
      },
      {
        "question": "What is a common mistake when using Ridge Regression?",
        "options": [
          "Applying penalty to unscaled features",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Applying penalty to unscaled features."
      }
    ]
  },
  "/ml/supervised/lasso-regression": {
    "algorithmId": "supervised-learning-regression-lasso-regression",
    "sourceTitle": "Lasso Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Lasso Regression: The Number Predictor",
        "story": "Asha faces a real problem: a neighborhood shop wants to estimate tomorrow's demand before ordering supplies. Lasso Regression enters the story because it learns how clues connect to a numeric answer.",
        "simpleExplanation": "Lasso regression is linear regression with an L1 penalty that can shrink some coefficients exactly to zero. In kid-simple words, Lasso Regression predicts a number, not a label. It studies past examples and learns how inputs push the output up or down.",
        "realtimeExample": "A planning system forecasts sales, traffic, energy use, or delivery time from historical signals.",
        "realtimeApplications": [
          "Feature selection",
          "Sparse risk scoring",
          "High-dimensional tabular models"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Lasso Regression feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Lasso Regression as a Simple Picture",
        "story": "Picture a smooth measuring tape stretched across scattered dots. The tape is useful only if it stays close to most dots.",
        "simpleExplanation": "Every nonzero coefficient pays a cost, so weak or redundant features can be dropped entirely. The model is trying to make prediction errors smaller while staying simple enough to trust.",
        "realtimeExample": "In a classroom demo, students can use prices, temperatures, house sizes, or study hours drawn as input-output pairs to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Feature selection",
          "Sparse risk scoring",
          "High-dimensional tabular models."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Lasso Regression Works Step by Step",
        "story": "Asha slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Scale features 2. Fit linear predictions 3. Add lambda * sum(abs(w)) to the loss 4. Tune lambda 5. Inspect selected nonzero features",
        "realtimeExample": "A team prepares numeric features, trains the model, checks residuals, and tests whether errors stay reasonable on new days.",
        "realtimeApplications": [
          "The important mechanics are feature quality",
          "target definition",
          "residual error",
          "and validation on unseen examples."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Lasso Regression",
        "story": "The math is a scoreboard for Asha. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "min_w sum_i (y_i - x_i^T w)^2 + lambda * sum_j |w_j|. The L1 penalty creates sparse solutions by pushing some weights to zero.",
        "realtimeExample": "The equation is a promise: convert inputs into a predicted number, then measure how far that number is from reality.",
        "realtimeApplications": [
          "Important setting to inspect: alpha or lambda."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Lasso Regression in Real Applications",
        "story": "Asha finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Automatic feature selection. Watch-outs: Can be unstable with highly correlated features, Still linear, May underfit when lambda is too high. Common mistakes: Forgetting to scale features, Treating selected features as causal proof, Using too much regularization.",
        "realtimeExample": "If a festival, storm, or holiday changes behavior, the model can look confident while being wrong.",
        "realtimeApplications": [
          "Feature selection",
          "Sparse risk scoring",
          "High-dimensional tabular models. Jobs that use this thinking include demand planning",
          "pricing",
          "forecasting",
          "and operations analytics."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Lasso Regression?",
        "options": [
          "Use it when you want a sparse, interpretable linear model and built-in feature selection. Focus on the visible input-...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it when you want a sparse, interpretable linear model and built-in feature selection. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Lasso Regression?",
        "options": [
          "Feature selection",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Lasso Regression is Feature selection."
      },
      {
        "question": "Why does the formula matter for Lasso Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Lasso Regression?",
        "options": [
          "alpha or lambda",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is alpha or lambda."
      },
      {
        "question": "What is a common mistake when using Lasso Regression?",
        "options": [
          "Forgetting to scale features",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Forgetting to scale features."
      }
    ]
  },
  "/ml/supervised/elastic-net-regression": {
    "algorithmId": "supervised-learning-regression-elastic-net-regression",
    "sourceTitle": "Elastic Net Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Elastic Net Regression: The Number Predictor",
        "story": "Asha faces a real problem: a neighborhood shop wants to estimate tomorrow's demand before ordering supplies. Elastic Net Regression enters the story because it learns how clues connect to a numeric answer.",
        "simpleExplanation": "Elastic Net Regression is a regression concept in supervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Elastic Net Regression predicts a number, not a label. It studies past examples and learns how inputs push the output up or down.",
        "realtimeExample": "A planning system forecasts sales, traffic, energy use, or delivery time from historical signals.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Elastic Net Regression feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Elastic Net Regression as a Simple Picture",
        "story": "Picture a smooth measuring tape stretched across scattered dots. The tape is useful only if it stays close to most dots.",
        "simpleExplanation": "Imagine balancing a line or curve through a cloud of points so the total residual error is small. The model is trying to make prediction errors smaller while staying simple enough to trust.",
        "realtimeExample": "In a classroom demo, students can use prices, temperatures, house sizes, or study hours drawn as input-output pairs to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Elastic Net Regression Works Step by Step",
        "story": "Asha slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Prepare numeric features and targets 2. Compute predictions 3. Measure residual loss 4. Update parameters 5. Validate on unseen points",
        "realtimeExample": "A team prepares numeric features, trains the model, checks residuals, and tests whether errors stay reasonable on new days.",
        "realtimeApplications": [
          "The important mechanics are feature quality",
          "target definition",
          "residual error",
          "and validation on unseen examples."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Elastic Net Regression",
        "story": "The math is a scoreboard for Asha. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "y_hat = f(x; theta),   J(theta) = (1/n) sum L(y_hat_i, y_i). Training chooses parameters that minimize prediction error, optionally with regularization.",
        "realtimeExample": "The equation is a promise: convert inputs into a predicted number, then measure how far that number is from reality.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Elastic Net Regression in Real Applications",
        "story": "Asha finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Strong, interpretable baseline. Watch-outs: Misses unmodelled nonlinear structure, Outliers can dominate common losses, Correlation is not causation. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "If a festival, storm, or holiday changes behavior, the model can look confident while being wrong.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Jobs that use this thinking include demand planning",
          "pricing",
          "forecasting",
          "and operations analytics."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Elastic Net Regression?",
        "options": [
          "Use it to estimate a continuous outcome and explain how features move that estimate. Focus on the visible input-to-ou...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to estimate a continuous outcome and explain how features move that estimate. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Elastic Net Regression?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Elastic Net Regression is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Elastic Net Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Elastic Net Regression?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Elastic Net Regression?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/supervised/decision-tree-regression": {
    "algorithmId": "supervised-learning-regression-decision-tree-regression",
    "sourceTitle": "Decision Tree Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Decision Tree Regression: The Question Path",
        "story": "Ishaan faces a real problem: a team needs a decision that people can inspect step by step. Decision Tree Regression enters the story because it builds answers from clear branching questions.",
        "simpleExplanation": "Decision Tree Regression is a regression concept in supervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Decision Tree Regression asks useful questions about features and uses the answers to reach a prediction.",
        "realtimeExample": "A business rule assistant explains why a case was approved, flagged, grouped, or predicted.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Decision Tree Regression feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Decision Tree Regression as a Simple Picture",
        "story": "It feels like a choose-your-path story where every branch makes the group cleaner.",
        "simpleExplanation": "Ask one useful yes/no question at a time until each region is easier to predict. Each split should reduce confusion. Too many splits can memorize noise.",
        "realtimeExample": "In a classroom demo, students can use paper cards sorted by yes/no questions like age, color, score, or size to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Decision Tree Regression Works Step by Step",
        "story": "Ishaan slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team controls depth, checks leaf sizes, compares validation results, and watches for leakage.",
        "realtimeApplications": [
          "The mechanics are split candidates",
          "impurity",
          "branches",
          "leaves",
          "ensembles when used",
          "and overfit control."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Decision Tree Regression",
        "story": "The math is a scoreboard for Ishaan. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation scores how much a split improves the child groups compared with the parent group.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Decision Tree Regression in Real Applications",
        "story": "Ishaan finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Readable decision logic. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A deep tree can explain training data beautifully and still fail on new messy cases.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Tree thinking is common in risk tools",
          "diagnostics",
          "operations rules",
          "and tabular ML baselines."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Decision Tree Regression?",
        "options": [
          "Use it to build readable conditional decisions or an ensemble of them. Focus on the visible input-to-output behavior...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to build readable conditional decisions or an ensemble of them. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Decision Tree Regression?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Decision Tree Regression is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Decision Tree Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Decision Tree Regression?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Decision Tree Regression?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/supervised/random-forest-regression": {
    "algorithmId": "supervised-learning-regression-random-forest-regression",
    "sourceTitle": "Random Forest Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Random Forest Regression: The Question Path",
        "story": "Ishaan faces a real problem: a team needs a decision that people can inspect step by step. Random Forest Regression enters the story because it builds answers from clear branching questions.",
        "simpleExplanation": "Random Forest Regression is a regression concept in supervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Random Forest Regression asks useful questions about features and uses the answers to reach a prediction.",
        "realtimeExample": "A business rule assistant explains why a case was approved, flagged, grouped, or predicted.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Random Forest Regression feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Random Forest Regression as a Simple Picture",
        "story": "It feels like a choose-your-path story where every branch makes the group cleaner.",
        "simpleExplanation": "Ask one useful yes/no question at a time until each region is easier to predict. Each split should reduce confusion. Too many splits can memorize noise.",
        "realtimeExample": "In a classroom demo, students can use paper cards sorted by yes/no questions like age, color, score, or size to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Random Forest Regression Works Step by Step",
        "story": "Ishaan slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team controls depth, checks leaf sizes, compares validation results, and watches for leakage.",
        "realtimeApplications": [
          "The mechanics are split candidates",
          "impurity",
          "branches",
          "leaves",
          "ensembles when used",
          "and overfit control."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Random Forest Regression",
        "story": "The math is a scoreboard for Ishaan. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation scores how much a split improves the child groups compared with the parent group.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Random Forest Regression in Real Applications",
        "story": "Ishaan finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Readable decision logic. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A deep tree can explain training data beautifully and still fail on new messy cases.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Tree thinking is common in risk tools",
          "diagnostics",
          "operations rules",
          "and tabular ML baselines."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Random Forest Regression?",
        "options": [
          "Use it to build readable conditional decisions or an ensemble of them. Focus on the visible input-to-output behavior...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to build readable conditional decisions or an ensemble of them. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Random Forest Regression?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Random Forest Regression is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Random Forest Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Random Forest Regression?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Random Forest Regression?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/supervised/gradient-boosting-regression": {
    "algorithmId": "supervised-learning-regression-gradient-boosting-regression",
    "sourceTitle": "Gradient Boosting Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Gradient Boosting Regression: The Question Path",
        "story": "Ishaan faces a real problem: a team needs a decision that people can inspect step by step. Gradient Boosting Regression enters the story because it builds answers from clear branching questions.",
        "simpleExplanation": "Gradient Boosting builds an additive ensemble of weak learners, usually trees, where each new learner corrects current errors. In kid-simple words, Gradient Boosting Regression asks useful questions about features and uses the answers to reach a prediction.",
        "realtimeExample": "A business rule assistant explains why a case was approved, flagged, grouped, or predicted.",
        "realtimeApplications": [
          "Tabular regression",
          "Ranking",
          "Classification baselines"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Gradient Boosting Regression feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Gradient Boosting Regression as a Simple Picture",
        "story": "It feels like a choose-your-path story where every branch makes the group cleaner.",
        "simpleExplanation": "The model starts simple, then repeatedly adds small trees that point in the direction of lower loss. Each split should reduce confusion. Too many splits can memorize noise.",
        "realtimeExample": "In a classroom demo, students can use paper cards sorted by yes/no questions like age, color, score, or size to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Tabular regression",
          "Ranking",
          "Classification baselines."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Gradient Boosting Regression Works Step by Step",
        "story": "Ishaan slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Start with a baseline prediction 2. Compute residuals or negative gradients 3. Fit a weak learner to those errors 4. Add it with a learning rate 5. Repeat and validate stage count",
        "realtimeExample": "A team controls depth, checks leaf sizes, compares validation results, and watches for leakage.",
        "realtimeApplications": [
          "The mechanics are split candidates",
          "impurity",
          "branches",
          "leaves",
          "ensembles when used",
          "and overfit control."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Gradient Boosting Regression",
        "story": "The math is a scoreboard for Ishaan. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "F_m(x) = F_(m-1)(x) + eta * h_m(x). Each stage adds a small correction to the current model.",
        "realtimeExample": "The equation scores how much a split improves the child groups compared with the parent group.",
        "realtimeApplications": [
          "Important setting to inspect: n_estimators."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Gradient Boosting Regression in Real Applications",
        "story": "Ishaan finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: High predictive accuracy. Watch-outs: Can overfit without regularization, Sequential training is slower than bagging, Needs careful tuning. Common mistakes: Using too many stages, Ignoring validation curves, Setting learning rate too high.",
        "realtimeExample": "A deep tree can explain training data beautifully and still fail on new messy cases.",
        "realtimeApplications": [
          "Tabular regression",
          "Ranking",
          "Classification baselines. Tree thinking is common in risk tools",
          "diagnostics",
          "operations rules",
          "and tabular ML baselines."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Gradient Boosting Regression?",
        "options": [
          "Use it for strong tabular prediction and to teach stage-wise residual correction. Focus on the visible input-to-outpu...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for strong tabular prediction and to teach stage-wise residual correction. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Gradient Boosting Regression?",
        "options": [
          "Tabular regression",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Gradient Boosting Regression is Tabular regression."
      },
      {
        "question": "Why does the formula matter for Gradient Boosting Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Gradient Boosting Regression?",
        "options": [
          "n_estimators",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is n_estimators."
      },
      {
        "question": "What is a common mistake when using Gradient Boosting Regression?",
        "options": [
          "Using too many stages",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Using too many stages."
      }
    ]
  },
  "/ml/supervised/support-vector-regression": {
    "algorithmId": "supervised-learning-regression-support-vector-regression",
    "sourceTitle": "Support Vector Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Support Vector Regression: The Number Predictor",
        "story": "Asha faces a real problem: a neighborhood shop wants to estimate tomorrow's demand before ordering supplies. Support Vector Regression enters the story because it learns how clues connect to a numeric answer.",
        "simpleExplanation": "Support Vector Regression is a regression concept in supervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Support Vector Regression predicts a number, not a label. It studies past examples and learns how inputs push the output up or down.",
        "realtimeExample": "A planning system forecasts sales, traffic, energy use, or delivery time from historical signals.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Support Vector Regression feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Support Vector Regression as a Simple Picture",
        "story": "Picture a smooth measuring tape stretched across scattered dots. The tape is useful only if it stays close to most dots.",
        "simpleExplanation": "Imagine balancing a line or curve through a cloud of points so the total residual error is small. The model is trying to make prediction errors smaller while staying simple enough to trust.",
        "realtimeExample": "In a classroom demo, students can use prices, temperatures, house sizes, or study hours drawn as input-output pairs to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Support Vector Regression Works Step by Step",
        "story": "Asha slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Prepare numeric features and targets 2. Compute predictions 3. Measure residual loss 4. Update parameters 5. Validate on unseen points",
        "realtimeExample": "A team prepares numeric features, trains the model, checks residuals, and tests whether errors stay reasonable on new days.",
        "realtimeApplications": [
          "The important mechanics are feature quality",
          "target definition",
          "residual error",
          "and validation on unseen examples."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Support Vector Regression",
        "story": "The math is a scoreboard for Asha. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "y_hat = f(x; theta),   J(theta) = (1/n) sum L(y_hat_i, y_i). Training chooses parameters that minimize prediction error, optionally with regularization.",
        "realtimeExample": "The equation is a promise: convert inputs into a predicted number, then measure how far that number is from reality.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Support Vector Regression in Real Applications",
        "story": "Asha finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Strong, interpretable baseline. Watch-outs: Misses unmodelled nonlinear structure, Outliers can dominate common losses, Correlation is not causation. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "If a festival, storm, or holiday changes behavior, the model can look confident while being wrong.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Jobs that use this thinking include demand planning",
          "pricing",
          "forecasting",
          "and operations analytics."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Support Vector Regression?",
        "options": [
          "Use it to estimate a continuous outcome and explain how features move that estimate. Focus on the visible input-to-ou...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to estimate a continuous outcome and explain how features move that estimate. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Support Vector Regression?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Support Vector Regression is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Support Vector Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Support Vector Regression?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Support Vector Regression?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/supervised/logistic-regression": {
    "algorithmId": "supervised-learning-classification-logistic-regression",
    "sourceTitle": "Logistic Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Logistic Regression: The Email Gatekeeper",
        "story": "Kabir builds a school email helper. It must decide whether a message is safe or spam before anyone clicks a risky link.",
        "simpleExplanation": "Logistic Regression is the main tool in this story because it converts clues into a probability for a yes-or-no decision. Logistic regression is a linear classifier that maps a weighted feature score through a sigmoid or softmax to estimate class probability.",
        "realtimeExample": "A security system estimates whether an email is spam, fraud, or safe.",
        "realtimeApplications": [
          "spam detection",
          "churn prediction",
          "medical risk screening",
          "fraud alerts"
        ],
        "teacherTip": "Before touching code, ask: what is the input, what is the output, and what mistake would hurt a real person?"
      },
      {
        "pageNumber": 2,
        "title": "Logistic Regression in Kid-Simple English",
        "story": "It is like a confidence meter that slides from almost no to almost yes.",
        "simpleExplanation": "Logistic Regression predicts a class by calculating a score, squeezing it into a probability, and comparing it with a threshold.",
        "realtimeExample": "A security system estimates whether an email is spam, fraud, or safe.",
        "realtimeApplications": [
          "You see this idea in spam detection",
          "churn prediction",
          "medical risk screening",
          "fraud alerts."
        ],
        "teacherTip": "Teach it to a younger friend in one sentence. If they can repeat it, you understand the heart of Logistic Regression."
      },
      {
        "pageNumber": 3,
        "title": "How Logistic Regression Thinks",
        "story": "Now Kabir slows down and watches the algorithm one move at a time.",
        "simpleExplanation": "1. Turn message clues into numbers. 2. Add weighted clues into a score. 3. Convert the score into probability. 4. Compare probability with a threshold. 5. Check false alarms and missed spam.",
        "realtimeExample": "A production ML team would log each step, compare it against validation data, and check whether the model still behaves well on fresh examples.",
        "realtimeApplications": [
          "Weights show which clues push the answer toward yes or no; the threshold controls the final decision."
        ],
        "teacherTip": "Follow the data like a detective follows footprints. Each step should explain the next step."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math of Logistic Regression",
        "story": "The math is the scoreboard. It tells Kabir whether the algorithm is getting warmer or colder.",
        "simpleExplanation": "p(y=1|x) = 1 / (1 + exp(-(w^T x + b))). The log-odds are linear in the input features; the sigmoid maps them into 0..1.",
        "realtimeExample": "The sigmoid turns a raw score into a probability between 0 and 1.",
        "realtimeApplications": [
          "Important setting: decision threshold",
          "regularization",
          "class weights."
        ],
        "teacherTip": "Do not fear the equation. Point to each part and say what real thing it measures."
      },
      {
        "pageNumber": 5,
        "title": "Logistic Regression in the Real World",
        "story": "Kabir learns that 0.50 is not always the best threshold. A hospital alert may prefer catching more risky cases, even with extra checks.",
        "simpleExplanation": "Superpower: interpretable probability-based classification. Careful: bad thresholds and imbalanced data can create unfair or risky decisions.",
        "realtimeExample": "A security system estimates whether an email is spam, fraud, or safe.",
        "realtimeApplications": [
          "spam detection",
          "churn prediction",
          "medical risk screening",
          "fraud alerts"
        ],
        "teacherTip": "Award-winning ML thinking is honest thinking: test on new data, explain limits, and improve carefully."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Logistic Regression?",
        "options": [
          "Use it for interpretable classification, calibrated probability baselines, and decision-threshold experiments. Focus...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for interpretable classification, calibrated probability baselines, and decision-threshold experiments. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Logistic Regression?",
        "options": [
          "Spam detection",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Logistic Regression is Spam detection."
      },
      {
        "question": "Why does the formula matter for Logistic Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Logistic Regression?",
        "options": [
          "C or lambda regularization",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is C or lambda regularization."
      },
      {
        "question": "What is a common mistake when using Logistic Regression?",
        "options": [
          "Using 0.5 threshold blindly",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Using 0.5 threshold blindly."
      }
    ]
  },
  "/ml/supervised/multinomial-logistic-regression": {
    "algorithmId": "supervised-learning-classification-logistic-regression",
    "sourceTitle": "Logistic Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Logistic Regression: The Email Gatekeeper",
        "story": "Kabir builds a school email helper. It must decide whether a message is safe or spam before anyone clicks a risky link.",
        "simpleExplanation": "Logistic Regression is the main tool in this story because it converts clues into a probability for a yes-or-no decision. Logistic regression is a linear classifier that maps a weighted feature score through a sigmoid or softmax to estimate class probability.",
        "realtimeExample": "A security system estimates whether an email is spam, fraud, or safe.",
        "realtimeApplications": [
          "spam detection",
          "churn prediction",
          "medical risk screening",
          "fraud alerts"
        ],
        "teacherTip": "Before touching code, ask: what is the input, what is the output, and what mistake would hurt a real person?"
      },
      {
        "pageNumber": 2,
        "title": "Logistic Regression in Kid-Simple English",
        "story": "It is like a confidence meter that slides from almost no to almost yes.",
        "simpleExplanation": "Logistic Regression predicts a class by calculating a score, squeezing it into a probability, and comparing it with a threshold.",
        "realtimeExample": "A security system estimates whether an email is spam, fraud, or safe.",
        "realtimeApplications": [
          "You see this idea in spam detection",
          "churn prediction",
          "medical risk screening",
          "fraud alerts."
        ],
        "teacherTip": "Teach it to a younger friend in one sentence. If they can repeat it, you understand the heart of Logistic Regression."
      },
      {
        "pageNumber": 3,
        "title": "How Logistic Regression Thinks",
        "story": "Now Kabir slows down and watches the algorithm one move at a time.",
        "simpleExplanation": "1. Turn message clues into numbers. 2. Add weighted clues into a score. 3. Convert the score into probability. 4. Compare probability with a threshold. 5. Check false alarms and missed spam.",
        "realtimeExample": "A production ML team would log each step, compare it against validation data, and check whether the model still behaves well on fresh examples.",
        "realtimeApplications": [
          "Weights show which clues push the answer toward yes or no; the threshold controls the final decision."
        ],
        "teacherTip": "Follow the data like a detective follows footprints. Each step should explain the next step."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math of Logistic Regression",
        "story": "The math is the scoreboard. It tells Kabir whether the algorithm is getting warmer or colder.",
        "simpleExplanation": "p(y=1|x) = 1 / (1 + exp(-(w^T x + b))). The log-odds are linear in the input features; the sigmoid maps them into 0..1.",
        "realtimeExample": "The sigmoid turns a raw score into a probability between 0 and 1.",
        "realtimeApplications": [
          "Important setting: decision threshold",
          "regularization",
          "class weights."
        ],
        "teacherTip": "Do not fear the equation. Point to each part and say what real thing it measures."
      },
      {
        "pageNumber": 5,
        "title": "Logistic Regression in the Real World",
        "story": "Kabir learns that 0.50 is not always the best threshold. A hospital alert may prefer catching more risky cases, even with extra checks.",
        "simpleExplanation": "Superpower: interpretable probability-based classification. Careful: bad thresholds and imbalanced data can create unfair or risky decisions.",
        "realtimeExample": "A security system estimates whether an email is spam, fraud, or safe.",
        "realtimeApplications": [
          "spam detection",
          "churn prediction",
          "medical risk screening",
          "fraud alerts"
        ],
        "teacherTip": "Award-winning ML thinking is honest thinking: test on new data, explain limits, and improve carefully."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Logistic Regression?",
        "options": [
          "Use it for interpretable classification, calibrated probability baselines, and decision-threshold experiments. Focus...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for interpretable classification, calibrated probability baselines, and decision-threshold experiments. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Logistic Regression?",
        "options": [
          "Spam detection",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Logistic Regression is Spam detection."
      },
      {
        "question": "Why does the formula matter for Logistic Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Logistic Regression?",
        "options": [
          "C or lambda regularization",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is C or lambda regularization."
      },
      {
        "question": "What is a common mistake when using Logistic Regression?",
        "options": [
          "Using 0.5 threshold blindly",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Using 0.5 threshold blindly."
      }
    ]
  },
  "/ml/supervised/knn-classification": {
    "algorithmId": "supervised-learning-classification-k-nearest-neighbors",
    "sourceTitle": "K-Nearest Neighbors",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "K-Nearest Neighbors: The Nearest Friends Vote",
        "story": "Meera finds a mystery fruit in the lunch basket. Instead of guessing, she compares it with fruits she already knows.",
        "simpleExplanation": "K-Nearest Neighbors is the main tool in this story because it predicts by asking the most similar saved examples to vote. K-Nearest Neighbors predicts a class by finding the K closest stored training samples and voting among their labels.",
        "realtimeExample": "A shopping app recommends products by finding users or items that look similar.",
        "realtimeApplications": [
          "small classification tools",
          "similarity search",
          "recommendation",
          "handwriting recognition demos"
        ],
        "teacherTip": "Before touching code, ask: what is the input, what is the output, and what mistake would hurt a real person?"
      },
      {
        "pageNumber": 2,
        "title": "K-Nearest Neighbors in Kid-Simple English",
        "story": "It is like asking the nearest classmates who have seen similar examples before.",
        "simpleExplanation": "K-Nearest Neighbors stores examples. For a new item, it finds the K closest examples and lets them vote for the answer.",
        "realtimeExample": "A shopping app recommends products by finding users or items that look similar.",
        "realtimeApplications": [
          "You see this idea in small classification tools",
          "similarity search",
          "recommendation",
          "handwriting recognition demos."
        ],
        "teacherTip": "Teach it to a younger friend in one sentence. If they can repeat it, you understand the heart of K-Nearest Neighbors."
      },
      {
        "pageNumber": 3,
        "title": "How K-Nearest Neighbors Thinks",
        "story": "Now Meera slows down and watches the algorithm one move at a time.",
        "simpleExplanation": "1. Scale features fairly. 2. Store labelled examples. 3. Choose K. 4. Measure distance from the new item. 5. Vote using the closest examples.",
        "realtimeExample": "A production ML team would log each step, compare it against validation data, and check whether the model still behaves well on fresh examples.",
        "realtimeApplications": [
          "Distance decides who counts as a neighbor; K decides how many neighbors get a vote."
        ],
        "teacherTip": "Follow the data like a detective follows footprints. Each step should explain the next step."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math of K-Nearest Neighbors",
        "story": "The math is the scoreboard. It tells Meera whether the algorithm is getting warmer or colder.",
        "simpleExplanation": "class(x) = majority label among N_K(x). The neighbourhood N_K(x) contains the K training samples closest to the query.",
        "realtimeExample": "The prediction comes from N_K(x), the neighborhood around the new point.",
        "realtimeApplications": [
          "Important setting: K",
          "distance metric",
          "feature scaling."
        ],
        "teacherTip": "Do not fear the equation. Point to each part and say what real thing it measures."
      },
      {
        "pageNumber": 5,
        "title": "K-Nearest Neighbors in the Real World",
        "story": "Meera learns that one neighbor can be noisy, but too many neighbors can ignore local detail.",
        "simpleExplanation": "Superpower: simple local reasoning with no heavy training. Careful: unscaled features and irrelevant columns can ruin distance.",
        "realtimeExample": "A shopping app recommends products by finding users or items that look similar.",
        "realtimeApplications": [
          "small classification tools",
          "similarity search",
          "recommendation",
          "handwriting recognition demos"
        ],
        "teacherTip": "Award-winning ML thinking is honest thinking: test on new data, explain limits, and improve carefully."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of K-Nearest Neighbors?",
        "options": [
          "Use it to teach distance-based local prediction and the effect of K, scaling, and distance metrics. Focus on the visi...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to teach distance-based local prediction and the effect of K, scaling, and distance metrics. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches K-Nearest Neighbors?",
        "options": [
          "Similarity search classification",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of K-Nearest Neighbors is Similarity search classification."
      },
      {
        "question": "Why does the formula matter for K-Nearest Neighbors?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for K-Nearest Neighbors?",
        "options": [
          "K",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is K."
      },
      {
        "question": "What is a common mistake when using K-Nearest Neighbors?",
        "options": [
          "Skipping scaling",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Skipping scaling."
      }
    ]
  },
  "/ml/supervised/naive-bayes": {
    "algorithmId": "supervised-learning-classification-gaussian-naive-bayes",
    "sourceTitle": "Gaussian Naive Bayes",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Gaussian Naive Bayes: The Decision Gate",
        "story": "Kabir faces a real problem: a safety monitor must decide whether each case needs attention now or can wait. Gaussian Naive Bayes enters the story because it turns evidence into a class decision.",
        "simpleExplanation": "Naive Bayes is a probabilistic classifier that applies Bayes' theorem while assuming features are conditionally independent given the class. In kid-simple words, Gaussian Naive Bayes chooses a category. It studies labelled examples and learns the clues that separate one class from another.",
        "realtimeExample": "A realtime alert system classifies transactions, messages, defects, or support tickets for faster review.",
        "realtimeApplications": [
          "Spam filtering",
          "Document classification",
          "Sentiment baselines"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Gaussian Naive Bayes feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Gaussian Naive Bayes as a Simple Picture",
        "story": "Imagine a gate with colored lanes. Each new example is guided into the lane that best matches its evidence.",
        "simpleExplanation": "Each feature contributes evidence to each class, and the class with the largest posterior score wins. The model is not just saying yes or no; it is organizing evidence into a decision rule.",
        "realtimeExample": "In a classroom demo, students can use cards labelled safe/risky, healthy/sick, spam/not spam, or pass/review to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Spam filtering",
          "Document classification",
          "Sentiment baselines."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Gaussian Naive Bayes Works Step by Step",
        "story": "Kabir slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Estimate class priors 2. Estimate feature likelihoods per class 3. Apply smoothing 4. Sum log evidence for a new sample 5. Predict the class with highest posterior score",
        "realtimeExample": "A team balances precision, recall, fairness, and calibration before trusting the classifier.",
        "realtimeApplications": [
          "The mechanics are labels",
          "features",
          "decision boundary",
          "threshold",
          "and confusion-matrix tradeoffs."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Gaussian Naive Bayes",
        "story": "The math is a scoreboard for Kabir. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "argmax_c log P(c) + sum_j log P(x_j | c). The independence assumption makes likelihood estimation simple and fast.",
        "realtimeExample": "The formula creates a score or probability; the threshold turns that score into a final class.",
        "realtimeApplications": [
          "Important setting to inspect: smoothing alpha."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Gaussian Naive Bayes in Real Applications",
        "story": "Kabir finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Very fast. Watch-outs: Independence assumption is often false, Probability calibration can be poor, Feature likelihood choice matters. Common mistakes: Using Gaussian NB for count text, Ignoring correlated features, Forgetting smoothing.",
        "realtimeExample": "A model can score high overall while missing the rare class that matters most.",
        "realtimeApplications": [
          "Spam filtering",
          "Document classification",
          "Sentiment baselines. This powers fraud review",
          "medical triage",
          "moderation",
          "quality inspection",
          "and customer routing."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Gaussian Naive Bayes?",
        "options": [
          "Use it for fast probabilistic classification and as a strong baseline for text or count-like features. Focus on the v...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for fast probabilistic classification and as a strong baseline for text or count-like features. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Gaussian Naive Bayes?",
        "options": [
          "Spam filtering",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Gaussian Naive Bayes is Spam filtering."
      },
      {
        "question": "Why does the formula matter for Gaussian Naive Bayes?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Gaussian Naive Bayes?",
        "options": [
          "smoothing alpha",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is smoothing alpha."
      },
      {
        "question": "What is a common mistake when using Gaussian Naive Bayes?",
        "options": [
          "Using Gaussian NB for count text",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Using Gaussian NB for count text."
      }
    ]
  },
  "/ml/supervised/decision-tree-classification": {
    "algorithmId": "supervised-learning-classification-decision-tree",
    "sourceTitle": "Decision Tree",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Decision Tree: The Question Tree",
        "story": "Ishaan helps the school library sort books for younger readers. He asks one clear question at a time until every book lands on the right shelf.",
        "simpleExplanation": "Decision Tree is the main tool in this story because it makes predictions through readable yes-or-no questions. A decision tree recursively splits feature space into regions whose labels are increasingly pure.",
        "realtimeExample": "A bank explains a simple approval rule by showing the path through a decision tree.",
        "realtimeApplications": [
          "rule explanations",
          "risk screening",
          "tabular classification",
          "triage tools"
        ],
        "teacherTip": "Before touching code, ask: what is the input, what is the output, and what mistake would hurt a real person?"
      },
      {
        "pageNumber": 2,
        "title": "Decision Tree in Kid-Simple English",
        "story": "It is like a choose-your-own-adventure path where each answer sends you to the next question.",
        "simpleExplanation": "A Decision Tree splits data into smaller groups. Each split tries to make the groups cleaner and easier to predict.",
        "realtimeExample": "A bank explains a simple approval rule by showing the path through a decision tree.",
        "realtimeApplications": [
          "You see this idea in rule explanations",
          "risk screening",
          "tabular classification",
          "triage tools."
        ],
        "teacherTip": "Teach it to a younger friend in one sentence. If they can repeat it, you understand the heart of Decision Tree."
      },
      {
        "pageNumber": 3,
        "title": "How Decision Tree Thinks",
        "story": "Now Ishaan slows down and watches the algorithm one move at a time.",
        "simpleExplanation": "1. Look at all possible questions. 2. Pick the split that reduces label mixing most. 3. Repeat on each branch. 4. Stop before the tree memorizes noise. 5. Predict from the final leaf.",
        "realtimeExample": "A production ML team would log each step, compare it against validation data, and check whether the model still behaves well on fresh examples.",
        "realtimeApplications": [
          "Impurity measures how mixed a node is; depth controls how many questions the tree may ask."
        ],
        "teacherTip": "Follow the data like a detective follows footprints. Each step should explain the next step."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math of Decision Tree",
        "story": "The math is the scoreboard. It tells Ishaan whether the algorithm is getting warmer or colder.",
        "simpleExplanation": "best split = arg max impurity(parent) - weighted impurity(children). Gini or entropy measures how mixed the class labels are in a node.",
        "realtimeExample": "The best split is the one that improves purity the most.",
        "realtimeApplications": [
          "Important setting: max depth",
          "min samples per leaf",
          "impurity criterion."
        ],
        "teacherTip": "Do not fear the equation. Point to each part and say what real thing it measures."
      },
      {
        "pageNumber": 5,
        "title": "Decision Tree in the Real World",
        "story": "Ishaan learns that a tree with too many questions may memorize one messy day instead of learning library rules.",
        "simpleExplanation": "Superpower: human-readable nonlinear decisions. Careful: deep trees overfit unless they are controlled.",
        "realtimeExample": "A bank explains a simple approval rule by showing the path through a decision tree.",
        "realtimeApplications": [
          "rule explanations",
          "risk screening",
          "tabular classification",
          "triage tools"
        ],
        "teacherTip": "Award-winning ML thinking is honest thinking: test on new data, explain limits, and improve carefully."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Decision Tree?",
        "options": [
          "Use it for interpretable nonlinear classification and to teach impurity, split thresholds, and tree paths. Focus on t...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for interpretable nonlinear classification and to teach impurity, split thresholds, and tree paths. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Decision Tree?",
        "options": [
          "Rule extraction",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Decision Tree is Rule extraction."
      },
      {
        "question": "Why does the formula matter for Decision Tree?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Decision Tree?",
        "options": [
          "max_depth",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is max_depth."
      },
      {
        "question": "What is a common mistake when using Decision Tree?",
        "options": [
          "Growing unrestricted trees",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Growing unrestricted trees."
      }
    ]
  },
  "/ml/supervised/random-forest-classification": {
    "algorithmId": "supervised-learning-classification-random-forest",
    "sourceTitle": "Random Forest",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Random Forest: The Council of Trees",
        "story": "Sara does not trust one noisy judge. She asks many different decision trees and lets the forest vote.",
        "simpleExplanation": "Random Forest is the main tool in this story because it reduces single-tree mistakes by combining many trees. Random Forest is an ensemble of decision trees trained on bootstrap samples with random feature subsets, then averaged or voted.",
        "realtimeExample": "A fraud team combines many tree opinions to flag suspicious transactions more reliably.",
        "realtimeApplications": [
          "fraud detection",
          "credit scoring",
          "churn prediction",
          "robust tabular baselines"
        ],
        "teacherTip": "Before touching code, ask: what is the input, what is the output, and what mistake would hurt a real person?"
      },
      {
        "pageNumber": 2,
        "title": "Random Forest in Kid-Simple English",
        "story": "It is like asking a classroom of careful students instead of one student who may be tired.",
        "simpleExplanation": "Random Forest trains many decision trees on slightly different data and feature choices. Their votes make the final answer more stable.",
        "realtimeExample": "A fraud team combines many tree opinions to flag suspicious transactions more reliably.",
        "realtimeApplications": [
          "You see this idea in fraud detection",
          "credit scoring",
          "churn prediction",
          "robust tabular baselines."
        ],
        "teacherTip": "Teach it to a younger friend in one sentence. If they can repeat it, you understand the heart of Random Forest."
      },
      {
        "pageNumber": 3,
        "title": "How Random Forest Thinks",
        "story": "Now Sara slows down and watches the algorithm one move at a time.",
        "simpleExplanation": "1. Create bootstrap samples. 2. Train many trees. 3. Randomize features at splits. 4. Let every tree vote. 5. Average or majority-vote the result.",
        "realtimeExample": "A production ML team would log each step, compare it against validation data, and check whether the model still behaves well on fresh examples.",
        "realtimeApplications": [
          "Bootstrapping and feature randomness make trees disagree in useful ways."
        ],
        "teacherTip": "Follow the data like a detective follows footprints. Each step should explain the next step."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math of Random Forest",
        "story": "The math is the scoreboard. It tells Sara whether the algorithm is getting warmer or colder.",
        "simpleExplanation": "prediction = average_or_vote(tree_1(x), ..., tree_B(x)). Bagging reduces variance; feature subsampling decorrelates individual trees.",
        "realtimeExample": "The final prediction is an average or vote across many trees.",
        "realtimeApplications": [
          "Important setting: number of trees",
          "max depth",
          "max features."
        ],
        "teacherTip": "Do not fear the equation. Point to each part and say what real thing it measures."
      },
      {
        "pageNumber": 5,
        "title": "Random Forest in the Real World",
        "story": "Sara learns the forest is powerful, but still needs clean data and honest validation.",
        "simpleExplanation": "Superpower: strong, reliable tabular predictions. Careful: less transparent than one tree and still vulnerable to leakage.",
        "realtimeExample": "A fraud team combines many tree opinions to flag suspicious transactions more reliably.",
        "realtimeApplications": [
          "fraud detection",
          "credit scoring",
          "churn prediction",
          "robust tabular baselines"
        ],
        "teacherTip": "Award-winning ML thinking is honest thinking: test on new data, explain limits, and improve carefully."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Random Forest?",
        "options": [
          "Use it as a strong tabular baseline that reduces the variance of a single decision tree. Focus on the visible input-t...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it as a strong tabular baseline that reduces the variance of a single decision tree. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Random Forest?",
        "options": [
          "Credit risk",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Random Forest is Credit risk."
      },
      {
        "question": "Why does the formula matter for Random Forest?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Random Forest?",
        "options": [
          "n_estimators",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is n_estimators."
      },
      {
        "question": "What is a common mistake when using Random Forest?",
        "options": [
          "Using too few trees",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Using too few trees."
      }
    ]
  },
  "/ml/supervised/svm-classification": {
    "algorithmId": "supervised-learning-classification-support-vector-machine",
    "sourceTitle": "Support Vector Machine",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Support Vector Machine: The Widest Safety Lane",
        "story": "Dev paints a line between two playground teams. He wants the widest safe lane, not a line that barely misses the players.",
        "simpleExplanation": "Support Vector Machine is the main tool in this story because it finds a boundary with the largest margin around hard examples. Support Vector Machine finds a decision boundary with maximum margin, controlled by support vectors near the boundary.",
        "realtimeExample": "A quality-control system separates acceptable and defective parts from measured features.",
        "realtimeApplications": [
          "classification with clear margins",
          "quality control",
          "bioinformatics",
          "text classification"
        ],
        "teacherTip": "Before touching code, ask: what is the input, what is the output, and what mistake would hurt a real person?"
      },
      {
        "pageNumber": 2,
        "title": "Support Vector Machine in Kid-Simple English",
        "story": "It is like drawing a road between two groups and keeping the road as wide as possible.",
        "simpleExplanation": "Support Vector Machine finds a separating boundary. The closest points, called support vectors, decide where the boundary sits.",
        "realtimeExample": "A quality-control system separates acceptable and defective parts from measured features.",
        "realtimeApplications": [
          "You see this idea in classification with clear margins",
          "quality control",
          "bioinformatics",
          "text classification."
        ],
        "teacherTip": "Teach it to a younger friend in one sentence. If they can repeat it, you understand the heart of Support Vector Machine."
      },
      {
        "pageNumber": 3,
        "title": "How Support Vector Machine Thinks",
        "story": "Now Dev slows down and watches the algorithm one move at a time.",
        "simpleExplanation": "1. Scale features. 2. Choose linear or kernel view. 3. Find the widest margin. 4. Allow controlled mistakes using C. 5. Validate margin behavior.",
        "realtimeExample": "A production ML team would log each step, compare it against validation data, and check whether the model still behaves well on fresh examples.",
        "realtimeApplications": [
          "Support vectors are the important edge cases; C controls how strict the boundary is."
        ],
        "teacherTip": "Follow the data like a detective follows footprints. Each step should explain the next step."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math of Support Vector Machine",
        "story": "The math is the scoreboard. It tells Dev whether the algorithm is getting warmer or colder.",
        "simpleExplanation": "min 1/2 ||w||^2 + C * sum xi_i, subject to y_i(w^T x_i + b) >= 1 - xi_i. C balances wide margin against allowing classification violations.",
        "realtimeExample": "The objective rewards a wide margin and penalizes violations.",
        "realtimeApplications": [
          "Important setting: C",
          "kernel",
          "gamma",
          "feature scaling."
        ],
        "teacherTip": "Do not fear the equation. Point to each part and say what real thing it measures."
      },
      {
        "pageNumber": 5,
        "title": "Support Vector Machine in the Real World",
        "story": "Dev learns that a perfect-looking boundary on training data can fail if the playground changes.",
        "simpleExplanation": "Superpower: strong margin-based classification. Careful: kernel choices and scaling matter a lot.",
        "realtimeExample": "A quality-control system separates acceptable and defective parts from measured features.",
        "realtimeApplications": [
          "classification with clear margins",
          "quality control",
          "bioinformatics",
          "text classification"
        ],
        "teacherTip": "Award-winning ML thinking is honest thinking: test on new data, explain limits, and improve carefully."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Support Vector Machine?",
        "options": [
          "Use it for margin-based classification, especially with scaled features and linear or kernelized boundaries. Focus on...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for margin-based classification, especially with scaled features and linear or kernelized boundaries. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Support Vector Machine?",
        "options": [
          "Text classification",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Support Vector Machine is Text classification."
      },
      {
        "question": "Why does the formula matter for Support Vector Machine?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Support Vector Machine?",
        "options": [
          "C",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is C."
      },
      {
        "question": "What is a common mistake when using Support Vector Machine?",
        "options": [
          "Skipping scaling",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Skipping scaling."
      }
    ]
  },
  "/ml/supervised/gradient-boosting-classification": {
    "algorithmId": "supervised-learning-classification-gradient-boosting",
    "sourceTitle": "Gradient Boosting",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Gradient Boosting: The Question Path",
        "story": "Ishaan faces a real problem: a team needs a decision that people can inspect step by step. Gradient Boosting enters the story because it builds answers from clear branching questions.",
        "simpleExplanation": "Gradient Boosting builds an additive ensemble of weak learners, usually trees, where each new learner corrects current errors. In kid-simple words, Gradient Boosting asks useful questions about features and uses the answers to reach a prediction.",
        "realtimeExample": "A business rule assistant explains why a case was approved, flagged, grouped, or predicted.",
        "realtimeApplications": [
          "Tabular regression",
          "Ranking",
          "Classification baselines"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Gradient Boosting feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Gradient Boosting as a Simple Picture",
        "story": "It feels like a choose-your-path story where every branch makes the group cleaner.",
        "simpleExplanation": "The model starts simple, then repeatedly adds small trees that point in the direction of lower loss. Each split should reduce confusion. Too many splits can memorize noise.",
        "realtimeExample": "In a classroom demo, students can use paper cards sorted by yes/no questions like age, color, score, or size to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Tabular regression",
          "Ranking",
          "Classification baselines."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Gradient Boosting Works Step by Step",
        "story": "Ishaan slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Start with a baseline prediction 2. Compute residuals or negative gradients 3. Fit a weak learner to those errors 4. Add it with a learning rate 5. Repeat and validate stage count",
        "realtimeExample": "A team controls depth, checks leaf sizes, compares validation results, and watches for leakage.",
        "realtimeApplications": [
          "The mechanics are split candidates",
          "impurity",
          "branches",
          "leaves",
          "ensembles when used",
          "and overfit control."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Gradient Boosting",
        "story": "The math is a scoreboard for Ishaan. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "F_m(x) = F_(m-1)(x) + eta * h_m(x). Each stage adds a small correction to the current model.",
        "realtimeExample": "The equation scores how much a split improves the child groups compared with the parent group.",
        "realtimeApplications": [
          "Important setting to inspect: n_estimators."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Gradient Boosting in Real Applications",
        "story": "Ishaan finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: High predictive accuracy. Watch-outs: Can overfit without regularization, Sequential training is slower than bagging, Needs careful tuning. Common mistakes: Using too many stages, Ignoring validation curves, Setting learning rate too high.",
        "realtimeExample": "A deep tree can explain training data beautifully and still fail on new messy cases.",
        "realtimeApplications": [
          "Tabular regression",
          "Ranking",
          "Classification baselines. Tree thinking is common in risk tools",
          "diagnostics",
          "operations rules",
          "and tabular ML baselines."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Gradient Boosting?",
        "options": [
          "Use it for strong tabular prediction and to teach stage-wise residual correction. Focus on the visible input-to-outpu...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for strong tabular prediction and to teach stage-wise residual correction. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Gradient Boosting?",
        "options": [
          "Tabular regression",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Gradient Boosting is Tabular regression."
      },
      {
        "question": "Why does the formula matter for Gradient Boosting?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Gradient Boosting?",
        "options": [
          "n_estimators",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is n_estimators."
      },
      {
        "question": "What is a common mistake when using Gradient Boosting?",
        "options": [
          "Using too many stages",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Using too many stages."
      }
    ]
  },
  "/ml/supervised/adaboost-classification": {
    "algorithmId": "supervised-learning-classification-adaboost",
    "sourceTitle": "AdaBoost",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "AdaBoost: The Question Path",
        "story": "Ishaan faces a real problem: a team needs a decision that people can inspect step by step. AdaBoost enters the story because it builds answers from clear branching questions.",
        "simpleExplanation": "AdaBoost is a classification concept in supervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, AdaBoost asks useful questions about features and uses the answers to reach a prediction.",
        "realtimeExample": "A business rule assistant explains why a case was approved, flagged, grouped, or predicted.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes AdaBoost feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "AdaBoost as a Simple Picture",
        "story": "It feels like a choose-your-path story where every branch makes the group cleaner.",
        "simpleExplanation": "Ask one useful yes/no question at a time until each region is easier to predict. Each split should reduce confusion. Too many splits can memorize noise.",
        "realtimeExample": "In a classroom demo, students can use paper cards sorted by yes/no questions like age, color, score, or size to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How AdaBoost Works Step by Step",
        "story": "Ishaan slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team controls depth, checks leaf sizes, compares validation results, and watches for leakage.",
        "realtimeApplications": [
          "The mechanics are split candidates",
          "impurity",
          "branches",
          "leaves",
          "ensembles when used",
          "and overfit control."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind AdaBoost",
        "story": "The math is a scoreboard for Ishaan. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation scores how much a split improves the child groups compared with the parent group.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "AdaBoost in Real Applications",
        "story": "Ishaan finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Readable decision logic. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A deep tree can explain training data beautifully and still fail on new messy cases.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Tree thinking is common in risk tools",
          "diagnostics",
          "operations rules",
          "and tabular ML baselines."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of AdaBoost?",
        "options": [
          "Use it to build readable conditional decisions or an ensemble of them. Focus on the visible input-to-output behavior...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to build readable conditional decisions or an ensemble of them. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches AdaBoost?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of AdaBoost is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for AdaBoost?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for AdaBoost?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using AdaBoost?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/supervised/xgboost-concept": {
    "algorithmId": "supervised-learning-classification-xgboost",
    "sourceTitle": "XGBoost",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "XGBoost: The Question Path",
        "story": "Ishaan faces a real problem: a team needs a decision that people can inspect step by step. XGBoost enters the story because it builds answers from clear branching questions.",
        "simpleExplanation": "XGBoost is a regularized gradient-boosted tree system that uses first- and second-order loss information plus split penalties. In kid-simple words, XGBoost asks useful questions about features and uses the answers to reach a prediction.",
        "realtimeExample": "A business rule assistant explains why a case was approved, flagged, grouped, or predicted.",
        "realtimeApplications": [
          "Kaggle-style tabular prediction",
          "Risk scoring",
          "Ranking and classification"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes XGBoost feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "XGBoost as a Simple Picture",
        "story": "It feels like a choose-your-path story where every branch makes the group cleaner.",
        "simpleExplanation": "It chooses tree splits by calculating how much each split improves the objective after accounting for complexity cost. Each split should reduce confusion. Too many splits can memorize noise.",
        "realtimeExample": "In a classroom demo, students can use paper cards sorted by yes/no questions like age, color, score, or size to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Kaggle-style tabular prediction",
          "Risk scoring",
          "Ranking and classification."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How XGBoost Works Step by Step",
        "story": "Ishaan slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Compute gradients and Hessians 2. Score candidate splits by gain 3. Grow regularized trees 4. Shrink each tree contribution 5. Validate rounds with early stopping",
        "realtimeExample": "A team controls depth, checks leaf sizes, compares validation results, and watches for leakage.",
        "realtimeApplications": [
          "The mechanics are split candidates",
          "impurity",
          "branches",
          "leaves",
          "ensembles when used",
          "and overfit control."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind XGBoost",
        "story": "The math is a scoreboard for Ishaan. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "gain = 1/2 [G_L^2/(H_L+lambda) + G_R^2/(H_R+lambda) - G^2/(H+lambda)] - gamma. lambda penalizes leaf weights; gamma penalizes adding splits.",
        "realtimeExample": "The equation scores how much a split improves the child groups compared with the parent group.",
        "realtimeApplications": [
          "Important setting to inspect: eta."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "XGBoost in Real Applications",
        "story": "Ishaan finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Excellent tabular accuracy. Watch-outs: Many hyperparameters, Can overfit leakage quickly, Less transparent than small models. Common mistakes: Tuning on test data, Ignoring early stopping, Using importance without leakage checks.",
        "realtimeExample": "A deep tree can explain training data beautifully and still fail on new messy cases.",
        "realtimeApplications": [
          "Kaggle-style tabular prediction",
          "Risk scoring",
          "Ranking and classification. Tree thinking is common in risk tools",
          "diagnostics",
          "operations rules",
          "and tabular ML baselines."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of XGBoost?",
        "options": [
          "Use it for high-performance tabular prediction with explicit regularization and missing-value handling. Focus on the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for high-performance tabular prediction with explicit regularization and missing-value handling. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches XGBoost?",
        "options": [
          "Kaggle-style tabular prediction",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of XGBoost is Kaggle-style tabular prediction."
      },
      {
        "question": "Why does the formula matter for XGBoost?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for XGBoost?",
        "options": [
          "eta",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is eta."
      },
      {
        "question": "What is a common mistake when using XGBoost?",
        "options": [
          "Tuning on test data",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Tuning on test data."
      }
    ]
  },
  "/ml/clustering/k-means": {
    "algorithmId": "unsupervised-learning-clustering-k-means",
    "sourceTitle": "K-Means",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "K-Means: The Sticker Club Finder",
        "story": "Nila has a pile of stickers and no labels. She wants to discover natural clubs: animals, planets, cartoons, and sports.",
        "simpleExplanation": "K-Means is the main tool in this story because it discovers groups by moving centers toward nearby points. K-Means partitions data into K clusters by alternating between nearest-centroid assignment and centroid recomputation.",
        "realtimeExample": "A retail team groups customers by buying behavior to design better offers.",
        "realtimeApplications": [
          "customer segmentation",
          "image color compression",
          "document grouping",
          "exploratory data analysis"
        ],
        "teacherTip": "Before touching code, ask: what is the input, what is the output, and what mistake would hurt a real person?"
      },
      {
        "pageNumber": 2,
        "title": "K-Means in Kid-Simple English",
        "story": "It is like placing club leaders in a room and asking every sticker to join the nearest leader.",
        "simpleExplanation": "K-Means groups data into K clusters. It assigns points to the nearest center, then moves each center to the middle of its assigned points.",
        "realtimeExample": "A retail team groups customers by buying behavior to design better offers.",
        "realtimeApplications": [
          "You see this idea in customer segmentation",
          "image color compression",
          "document grouping",
          "exploratory data analysis."
        ],
        "teacherTip": "Teach it to a younger friend in one sentence. If they can repeat it, you understand the heart of K-Means."
      },
      {
        "pageNumber": 3,
        "title": "How K-Means Thinks",
        "story": "Now Nila slows down and watches the algorithm one move at a time.",
        "simpleExplanation": "1. Choose K centers. 2. Assign each point to the nearest center. 3. Move centers to group averages. 4. Repeat until movement is small. 5. Inspect whether the groups make sense.",
        "realtimeExample": "A production ML team would log each step, compare it against validation data, and check whether the model still behaves well on fresh examples.",
        "realtimeApplications": [
          "K decides the number of groups; initialization decides where the centers start."
        ],
        "teacherTip": "Follow the data like a detective follows footprints. Each step should explain the next step."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math of K-Means",
        "story": "The math is the scoreboard. It tells Nila whether the algorithm is getting warmer or colder.",
        "simpleExplanation": "J = sum_i ||x_i - mu_(c_i)||^2. The objective minimizes within-cluster squared distance to centroids.",
        "realtimeExample": "The objective reduces the distance from points to their assigned centers.",
        "realtimeApplications": [
          "Important setting: K",
          "initialization",
          "max iterations."
        ],
        "teacherTip": "Do not fear the equation. Point to each part and say what real thing it measures."
      },
      {
        "pageNumber": 5,
        "title": "K-Means in the Real World",
        "story": "Nila learns that K-Means will always make K groups, even if the real world does not have exactly K clubs.",
        "simpleExplanation": "Superpower: fast unlabeled grouping. Careful: wrong K or bad scaling can create artificial clusters.",
        "realtimeExample": "A retail team groups customers by buying behavior to design better offers.",
        "realtimeApplications": [
          "customer segmentation",
          "image color compression",
          "document grouping",
          "exploratory data analysis"
        ],
        "teacherTip": "Award-winning ML thinking is honest thinking: test on new data, explain limits, and improve carefully."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of K-Means?",
        "options": [
          "Use it to discover compact, roughly spherical groups and to teach inertia and centroid movement. Focus on the visible...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to discover compact, roughly spherical groups and to teach inertia and centroid movement. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches K-Means?",
        "options": [
          "Customer segmentation",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of K-Means is Customer segmentation."
      },
      {
        "question": "Why does the formula matter for K-Means?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for K-Means?",
        "options": [
          "K",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is K."
      },
      {
        "question": "What is a common mistake when using K-Means?",
        "options": [
          "Using raw unscaled features",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Using raw unscaled features."
      }
    ]
  },
  "/ml/clustering/hierarchical-clustering": {
    "algorithmId": "unsupervised-learning-clustering-hierarchical-clustering",
    "sourceTitle": "Hierarchical Clustering",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Hierarchical Clustering: The Hidden Groups",
        "story": "Nila faces a real problem: a dataset arrives with no labels, but the team suspects useful groups are hiding inside. Hierarchical Clustering enters the story because it searches for structure without being told the answer.",
        "simpleExplanation": "Hierarchical Clustering is a clustering concept in unsupervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Hierarchical Clustering discovers groups or dense regions. It helps people explore data before they know the labels.",
        "realtimeExample": "A product team groups customers, documents, images, or events to understand behavior patterns.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Hierarchical Clustering feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Hierarchical Clustering as a Simple Picture",
        "story": "Imagine arranging mixed buttons on a table until similar buttons naturally sit together.",
        "simpleExplanation": "Move representatives toward dense groups, then reassign observations and repeat. The model is looking for shape, distance, density, or representative centers in the data.",
        "realtimeExample": "In a classroom demo, students can use colored stickers placed on graph paper with students guessing natural groups to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Hierarchical Clustering Works Step by Step",
        "story": "Nila slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Scale features 2. Measure neighbourhood structure 3. Assign groups 4. Update cluster state 5. Check stability and noise",
        "realtimeExample": "A team scales features, tries settings, checks group stability, and asks domain experts whether clusters mean anything.",
        "realtimeApplications": [
          "The mechanics are feature scale",
          "distance or density",
          "assignments",
          "noise points",
          "and cluster validation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Hierarchical Clustering",
        "story": "The math is a scoreboard for Nila. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation measures compactness, density reachability, or probability of belonging to a hidden group.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Hierarchical Clustering in Real Applications",
        "story": "Nila finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "The algorithm may create groups even when the real world has blurry or no meaningful groups.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Clustering supports customer segmentation",
          "anomaly discovery",
          "exploratory analytics",
          "and data labeling strategy."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Hierarchical Clustering?",
        "options": [
          "Use it to find groups and unusual structure without labels. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to find groups and unusual structure without labels. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Hierarchical Clustering?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Hierarchical Clustering is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Hierarchical Clustering?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Hierarchical Clustering?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Hierarchical Clustering?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/clustering/dbscan": {
    "algorithmId": "unsupervised-learning-clustering-dbscan",
    "sourceTitle": "DBSCAN",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "DBSCAN: The Hidden Groups",
        "story": "Nila faces a real problem: a dataset arrives with no labels, but the team suspects useful groups are hiding inside. DBSCAN enters the story because it searches for structure without being told the answer.",
        "simpleExplanation": "DBSCAN clusters points by density, grouping density-connected regions and marking sparse isolated points as noise. In kid-simple words, DBSCAN discovers groups or dense regions. It helps people explore data before they know the labels.",
        "realtimeExample": "A product team groups customers, documents, images, or events to understand behavior patterns.",
        "realtimeApplications": [
          "Spatial clustering",
          "Outlier detection",
          "Shape-based grouping"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes DBSCAN feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "DBSCAN as a Simple Picture",
        "story": "Imagine arranging mixed buttons on a table until similar buttons naturally sit together.",
        "simpleExplanation": "A cluster grows from dense core points; points that cannot connect to dense regions become noise. The model is looking for shape, distance, density, or representative centers in the data.",
        "realtimeExample": "In a classroom demo, students can use colored stickers placed on graph paper with students guessing natural groups to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Spatial clustering",
          "Outlier detection",
          "Shape-based grouping."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How DBSCAN Works Step by Step",
        "story": "Nila slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Scale features 2. Choose epsilon radius and MinPts 3. Identify core points 4. Expand density-connected clusters 5. Mark non-reachable points as noise",
        "realtimeExample": "A team scales features, tries settings, checks group stability, and asks domain experts whether clusters mean anything.",
        "realtimeApplications": [
          "The mechanics are feature scale",
          "distance or density",
          "assignments",
          "noise points",
          "and cluster validation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind DBSCAN",
        "story": "The math is a scoreboard for Nila. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "core point if |N_epsilon(x)| >= MinPts. Density reachability defines clusters without requiring K.",
        "realtimeExample": "The equation measures compactness, density reachability, or probability of belonging to a hidden group.",
        "realtimeApplications": [
          "Important setting to inspect: epsilon."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "DBSCAN in Real Applications",
        "story": "Nila finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Finds arbitrary-shaped clusters. Watch-outs: Sensitive to epsilon and scale, Struggles with varying densities, High dimensions weaken distance. Common mistakes: Using default epsilon, Skipping scaling, Expecting good results with varying densities.",
        "realtimeExample": "The algorithm may create groups even when the real world has blurry or no meaningful groups.",
        "realtimeApplications": [
          "Spatial clustering",
          "Outlier detection",
          "Shape-based grouping. Clustering supports customer segmentation",
          "anomaly discovery",
          "exploratory analytics",
          "and data labeling strategy."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of DBSCAN?",
        "options": [
          "Use it when clusters may have arbitrary shapes and outlier detection matters. Focus on the visible input-to-output be...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it when clusters may have arbitrary shapes and outlier detection matters. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches DBSCAN?",
        "options": [
          "Spatial clustering",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of DBSCAN is Spatial clustering."
      },
      {
        "question": "Why does the formula matter for DBSCAN?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for DBSCAN?",
        "options": [
          "epsilon",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is epsilon."
      },
      {
        "question": "What is a common mistake when using DBSCAN?",
        "options": [
          "Using default epsilon",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Using default epsilon."
      }
    ]
  },
  "/ml/clustering/mean-shift": {
    "algorithmId": "unsupervised-learning-clustering-mean-shift",
    "sourceTitle": "Mean Shift",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Mean Shift: The Hidden Groups",
        "story": "Nila faces a real problem: a dataset arrives with no labels, but the team suspects useful groups are hiding inside. Mean Shift enters the story because it searches for structure without being told the answer.",
        "simpleExplanation": "Mean Shift is a clustering concept in unsupervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Mean Shift discovers groups or dense regions. It helps people explore data before they know the labels.",
        "realtimeExample": "A product team groups customers, documents, images, or events to understand behavior patterns.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Mean Shift feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Mean Shift as a Simple Picture",
        "story": "Imagine arranging mixed buttons on a table until similar buttons naturally sit together.",
        "simpleExplanation": "Move representatives toward dense groups, then reassign observations and repeat. The model is looking for shape, distance, density, or representative centers in the data.",
        "realtimeExample": "In a classroom demo, students can use colored stickers placed on graph paper with students guessing natural groups to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Mean Shift Works Step by Step",
        "story": "Nila slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Scale features 2. Measure neighbourhood structure 3. Assign groups 4. Update cluster state 5. Check stability and noise",
        "realtimeExample": "A team scales features, tries settings, checks group stability, and asks domain experts whether clusters mean anything.",
        "realtimeApplications": [
          "The mechanics are feature scale",
          "distance or density",
          "assignments",
          "noise points",
          "and cluster validation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Mean Shift",
        "story": "The math is a scoreboard for Nila. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation measures compactness, density reachability, or probability of belonging to a hidden group.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Mean Shift in Real Applications",
        "story": "Nila finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "The algorithm may create groups even when the real world has blurry or no meaningful groups.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Clustering supports customer segmentation",
          "anomaly discovery",
          "exploratory analytics",
          "and data labeling strategy."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Mean Shift?",
        "options": [
          "Use it to find groups and unusual structure without labels. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to find groups and unusual structure without labels. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Mean Shift?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Mean Shift is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Mean Shift?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Mean Shift?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Mean Shift?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/clustering/spectral-clustering": {
    "algorithmId": "unsupervised-learning-clustering-spectral-clustering",
    "sourceTitle": "Spectral Clustering",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Spectral Clustering: The Hidden Groups",
        "story": "Nila faces a real problem: a dataset arrives with no labels, but the team suspects useful groups are hiding inside. Spectral Clustering enters the story because it searches for structure without being told the answer.",
        "simpleExplanation": "Spectral Clustering is a clustering concept in unsupervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Spectral Clustering discovers groups or dense regions. It helps people explore data before they know the labels.",
        "realtimeExample": "A product team groups customers, documents, images, or events to understand behavior patterns.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Spectral Clustering feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Spectral Clustering as a Simple Picture",
        "story": "Imagine arranging mixed buttons on a table until similar buttons naturally sit together.",
        "simpleExplanation": "Move representatives toward dense groups, then reassign observations and repeat. The model is looking for shape, distance, density, or representative centers in the data.",
        "realtimeExample": "In a classroom demo, students can use colored stickers placed on graph paper with students guessing natural groups to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Spectral Clustering Works Step by Step",
        "story": "Nila slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Scale features 2. Measure neighbourhood structure 3. Assign groups 4. Update cluster state 5. Check stability and noise",
        "realtimeExample": "A team scales features, tries settings, checks group stability, and asks domain experts whether clusters mean anything.",
        "realtimeApplications": [
          "The mechanics are feature scale",
          "distance or density",
          "assignments",
          "noise points",
          "and cluster validation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Spectral Clustering",
        "story": "The math is a scoreboard for Nila. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation measures compactness, density reachability, or probability of belonging to a hidden group.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Spectral Clustering in Real Applications",
        "story": "Nila finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "The algorithm may create groups even when the real world has blurry or no meaningful groups.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Clustering supports customer segmentation",
          "anomaly discovery",
          "exploratory analytics",
          "and data labeling strategy."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Spectral Clustering?",
        "options": [
          "Use it to find groups and unusual structure without labels. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to find groups and unusual structure without labels. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Spectral Clustering?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Spectral Clustering is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Spectral Clustering?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Spectral Clustering?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Spectral Clustering?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/clustering/optics": {
    "algorithmId": "unsupervised-learning-clustering-optics",
    "sourceTitle": "OPTICS",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "OPTICS: The Hidden Groups",
        "story": "Nila faces a real problem: a dataset arrives with no labels, but the team suspects useful groups are hiding inside. OPTICS enters the story because it searches for structure without being told the answer.",
        "simpleExplanation": "OPTICS is a clustering concept in unsupervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, OPTICS discovers groups or dense regions. It helps people explore data before they know the labels.",
        "realtimeExample": "A product team groups customers, documents, images, or events to understand behavior patterns.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes OPTICS feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "OPTICS as a Simple Picture",
        "story": "Imagine arranging mixed buttons on a table until similar buttons naturally sit together.",
        "simpleExplanation": "Dense connected regions become clusters; isolated observations become noise. The model is looking for shape, distance, density, or representative centers in the data.",
        "realtimeExample": "In a classroom demo, students can use colored stickers placed on graph paper with students guessing natural groups to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How OPTICS Works Step by Step",
        "story": "Nila slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Scale features 2. Measure neighbourhood structure 3. Assign groups 4. Update cluster state 5. Check stability and noise",
        "realtimeExample": "A team scales features, tries settings, checks group stability, and asks domain experts whether clusters mean anything.",
        "realtimeApplications": [
          "The mechanics are feature scale",
          "distance or density",
          "assignments",
          "noise points",
          "and cluster validation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind OPTICS",
        "story": "The math is a scoreboard for Nila. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation measures compactness, density reachability, or probability of belonging to a hidden group.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "OPTICS in Real Applications",
        "story": "Nila finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Sensitive to scale and density variation, Parameter selection can be difficult, High dimensions weaken distance measures. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "The algorithm may create groups even when the real world has blurry or no meaningful groups.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Clustering supports customer segmentation",
          "anomaly discovery",
          "exploratory analytics",
          "and data labeling strategy."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of OPTICS?",
        "options": [
          "Use it to find groups and unusual structure without labels. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to find groups and unusual structure without labels. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches OPTICS?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of OPTICS is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for OPTICS?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for OPTICS?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using OPTICS?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/dimensionality-reduction/pca": {
    "algorithmId": "unsupervised-learning-dimensionality-reduction-pca",
    "sourceTitle": "PCA",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "PCA: The Smart Map",
        "story": "Riya faces a real problem: a dataset has too many columns for anyone to see clearly. PCA enters the story because it compresses many clues into a smaller view.",
        "simpleExplanation": "Principal Component Analysis rotates data to new orthogonal axes that capture maximum variance, then keeps the leading components. In kid-simple words, PCA reduces dimensions so important structure can be seen or used more easily.",
        "realtimeExample": "An analytics team compresses images, text embeddings, or survey data before visualization or modeling.",
        "realtimeApplications": [
          "2D visualization",
          "Noise reduction",
          "Preprocessing for models"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes PCA feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "PCA as a Simple Picture",
        "story": "It is like making a map: you lose tiny details, but keep the shapes that help you travel.",
        "simpleExplanation": "It finds the directions where the data spreads the most and projects points onto those directions. A good projection keeps useful neighbors, variation, or relationships while dropping less useful detail.",
        "realtimeExample": "In a classroom demo, students can use students flattening a 3D object shadow onto paper from different angles to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for 2D visualization",
          "Noise reduction",
          "Preprocessing for models."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How PCA Works Step by Step",
        "story": "Riya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Center and usually scale features 2. Compute covariance or SVD 3. Sort principal components by explained variance 4. Project data onto top components 5. Inspect variance retained and reconstruction error",
        "realtimeExample": "A team scales data, chooses a projection method, checks information loss, and avoids reading too much into pretty plots.",
        "realtimeApplications": [
          "The mechanics are compression",
          "reconstruction",
          "variance",
          "neighborhoods",
          "and information loss."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind PCA",
        "story": "The math is a scoreboard for Riya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "Z = XW, where columns of W are top eigenvectors of covariance(X). Principal components are orthogonal directions of maximum variance.",
        "realtimeExample": "The equation defines what structure should be preserved when high-dimensional data becomes smaller.",
        "realtimeApplications": [
          "Important setting to inspect: n_components."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "PCA in Real Applications",
        "story": "Riya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Fast linear compression. Watch-outs: Only linear structure, Components can be hard to interpret, Variance may not equal task usefulness. Common mistakes: Running PCA before train/test split, Forgetting scaling, Assuming high variance means predictive value.",
        "realtimeExample": "A beautiful 2D picture can exaggerate separation or hide important uncertainty.",
        "realtimeApplications": [
          "2D visualization",
          "Noise reduction",
          "Preprocessing for models. Projection methods help dashboards",
          "embedding inspection",
          "preprocessing",
          "visualization",
          "and model debugging."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of PCA?",
        "options": [
          "Use it for dimensionality reduction, visualization, compression, and noise filtering. Focus on the visible input-to-o...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for dimensionality reduction, visualization, compression, and noise filtering. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches PCA?",
        "options": [
          "2D visualization",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of PCA is 2D visualization."
      },
      {
        "question": "Why does the formula matter for PCA?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for PCA?",
        "options": [
          "n_components",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is n_components."
      },
      {
        "question": "What is a common mistake when using PCA?",
        "options": [
          "Running PCA before train/test split",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Running PCA before train/test split."
      }
    ]
  },
  "/ml/dimensionality-reduction/kernel-pca": {
    "algorithmId": "unsupervised-learning-dimensionality-reduction-kernel-pca",
    "sourceTitle": "Kernel PCA",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Kernel PCA: The Smart Map",
        "story": "Riya faces a real problem: a dataset has too many columns for anyone to see clearly. Kernel PCA enters the story because it compresses many clues into a smaller view.",
        "simpleExplanation": "Kernel PCA is a dimensionality reduction concept in unsupervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Kernel PCA reduces dimensions so important structure can be seen or used more easily.",
        "realtimeExample": "An analytics team compresses images, text embeddings, or survey data before visualization or modeling.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Kernel PCA feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Kernel PCA as a Simple Picture",
        "story": "It is like making a map: you lose tiny details, but keep the shapes that help you travel.",
        "simpleExplanation": "Rotate a lower-dimensional viewing axis until it preserves the structure that matters. A good projection keeps useful neighbors, variation, or relationships while dropping less useful detail.",
        "realtimeExample": "In a classroom demo, students can use students flattening a 3D object shadow onto paper from different angles to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Kernel PCA Works Step by Step",
        "story": "Riya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team scales data, chooses a projection method, checks information loss, and avoids reading too much into pretty plots.",
        "realtimeApplications": [
          "The mechanics are compression",
          "reconstruction",
          "variance",
          "neighborhoods",
          "and information loss."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Kernel PCA",
        "story": "The math is a scoreboard for Riya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation defines what structure should be preserved when high-dimensional data becomes smaller.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Kernel PCA in Real Applications",
        "story": "Riya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A beautiful 2D picture can exaggerate separation or hide important uncertainty.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Projection methods help dashboards",
          "embedding inspection",
          "preprocessing",
          "visualization",
          "and model debugging."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Kernel PCA?",
        "options": [
          "Use it to compress features while preserving useful structure. Focus on the visible input-to-output behavior before t...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to compress features while preserving useful structure. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Kernel PCA?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Kernel PCA is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Kernel PCA?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Kernel PCA?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Kernel PCA?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/dimensionality-reduction/tsne": {
    "algorithmId": "unsupervised-learning-dimensionality-reduction-t-sne",
    "sourceTitle": "t-SNE",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "t-SNE: The Smart Map",
        "story": "Riya faces a real problem: a dataset has too many columns for anyone to see clearly. t-SNE enters the story because it compresses many clues into a smaller view.",
        "simpleExplanation": "t-SNE is a dimensionality reduction concept in unsupervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, t-SNE reduces dimensions so important structure can be seen or used more easily.",
        "realtimeExample": "An analytics team compresses images, text embeddings, or survey data before visualization or modeling.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes t-SNE feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "t-SNE as a Simple Picture",
        "story": "It is like making a map: you lose tiny details, but keep the shapes that help you travel.",
        "simpleExplanation": "Rotate a lower-dimensional viewing axis until it preserves the structure that matters. A good projection keeps useful neighbors, variation, or relationships while dropping less useful detail.",
        "realtimeExample": "In a classroom demo, students can use students flattening a 3D object shadow onto paper from different angles to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How t-SNE Works Step by Step",
        "story": "Riya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team scales data, chooses a projection method, checks information loss, and avoids reading too much into pretty plots.",
        "realtimeApplications": [
          "The mechanics are compression",
          "reconstruction",
          "variance",
          "neighborhoods",
          "and information loss."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind t-SNE",
        "story": "The math is a scoreboard for Riya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation defines what structure should be preserved when high-dimensional data becomes smaller.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "t-SNE in Real Applications",
        "story": "Riya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A beautiful 2D picture can exaggerate separation or hide important uncertainty.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Projection methods help dashboards",
          "embedding inspection",
          "preprocessing",
          "visualization",
          "and model debugging."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of t-SNE?",
        "options": [
          "Use it to compress features while preserving useful structure. Focus on the visible input-to-output behavior before t...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to compress features while preserving useful structure. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches t-SNE?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of t-SNE is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for t-SNE?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for t-SNE?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using t-SNE?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/dimensionality-reduction/umap-concept": {
    "algorithmId": "unsupervised-learning-dimensionality-reduction-umap",
    "sourceTitle": "UMAP",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "UMAP: The Smart Map",
        "story": "Riya faces a real problem: a dataset has too many columns for anyone to see clearly. UMAP enters the story because it compresses many clues into a smaller view.",
        "simpleExplanation": "UMAP is a dimensionality reduction concept in unsupervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, UMAP reduces dimensions so important structure can be seen or used more easily.",
        "realtimeExample": "An analytics team compresses images, text embeddings, or survey data before visualization or modeling.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes UMAP feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "UMAP as a Simple Picture",
        "story": "It is like making a map: you lose tiny details, but keep the shapes that help you travel.",
        "simpleExplanation": "Rotate a lower-dimensional viewing axis until it preserves the structure that matters. A good projection keeps useful neighbors, variation, or relationships while dropping less useful detail.",
        "realtimeExample": "In a classroom demo, students can use students flattening a 3D object shadow onto paper from different angles to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How UMAP Works Step by Step",
        "story": "Riya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team scales data, chooses a projection method, checks information loss, and avoids reading too much into pretty plots.",
        "realtimeApplications": [
          "The mechanics are compression",
          "reconstruction",
          "variance",
          "neighborhoods",
          "and information loss."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind UMAP",
        "story": "The math is a scoreboard for Riya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation defines what structure should be preserved when high-dimensional data becomes smaller.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "UMAP in Real Applications",
        "story": "Riya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A beautiful 2D picture can exaggerate separation or hide important uncertainty.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Projection methods help dashboards",
          "embedding inspection",
          "preprocessing",
          "visualization",
          "and model debugging."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of UMAP?",
        "options": [
          "Use it to compress features while preserving useful structure. Focus on the visible input-to-output behavior before t...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to compress features while preserving useful structure. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches UMAP?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of UMAP is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for UMAP?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for UMAP?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using UMAP?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/dimensionality-reduction/lda": {
    "algorithmId": "supervised-learning-classification-linear-discriminant-analysis",
    "sourceTitle": "Linear Discriminant Analysis",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Linear Discriminant Analysis: The Decision Gate",
        "story": "Kabir faces a real problem: a safety monitor must decide whether each case needs attention now or can wait. Linear Discriminant Analysis enters the story because it turns evidence into a class decision.",
        "simpleExplanation": "Linear Discriminant Analysis models each class as a Gaussian with shared covariance and produces a linear decision boundary. In kid-simple words, Linear Discriminant Analysis chooses a category. It studies labelled examples and learns the clues that separate one class from another.",
        "realtimeExample": "A realtime alert system classifies transactions, messages, defects, or support tickets for faster review.",
        "realtimeApplications": [
          "Classical pattern recognition",
          "Medical classification",
          "Low-dimensional projections"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Linear Discriminant Analysis feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Linear Discriminant Analysis as a Simple Picture",
        "story": "Imagine a gate with colored lanes. Each new example is guided into the lane that best matches its evidence.",
        "simpleExplanation": "Classes are represented by centers and shared spread; a point is assigned to the class whose Gaussian evidence is strongest. The model is not just saying yes or no; it is organizing evidence into a decision rule.",
        "realtimeExample": "In a classroom demo, students can use cards labelled safe/risky, healthy/sick, spam/not spam, or pass/review to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Classical pattern recognition",
          "Medical classification",
          "Low-dimensional projections."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Linear Discriminant Analysis Works Step by Step",
        "story": "Kabir slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Estimate class means 2. Estimate shared covariance 3. Compute discriminant scores 4. Classify by largest score 5. Validate assumptions and calibration",
        "realtimeExample": "A team balances precision, recall, fairness, and calibration before trusting the classifier.",
        "realtimeApplications": [
          "The mechanics are labels",
          "features",
          "decision boundary",
          "threshold",
          "and confusion-matrix tradeoffs."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Linear Discriminant Analysis",
        "story": "The math is a scoreboard for Kabir. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "delta_k(x) = x^T Sigma^-1 mu_k - 1/2 mu_k^T Sigma^-1 mu_k + log pi_k. Shared covariance makes the boundary linear between class distributions.",
        "realtimeExample": "The formula creates a score or probability; the threshold turns that score into a final class.",
        "realtimeApplications": [
          "Important setting to inspect: solver."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Linear Discriminant Analysis in Real Applications",
        "story": "Kabir finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Interpretable linear boundary. Watch-outs: Shared covariance assumption may fail, Sensitive to outliers, Needs enough samples for covariance. Common mistakes: Using it when covariances differ strongly, Ignoring outliers, Forgetting covariance regularization.",
        "realtimeExample": "A model can score high overall while missing the rare class that matters most.",
        "realtimeApplications": [
          "Classical pattern recognition",
          "Medical classification",
          "Low-dimensional projections. This powers fraud review",
          "medical triage",
          "moderation",
          "quality inspection",
          "and customer routing."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Linear Discriminant Analysis?",
        "options": [
          "Use it for interpretable classification and dimensional projection that separates class means. Focus on the visible i...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for interpretable classification and dimensional projection that separates class means. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Linear Discriminant Analysis?",
        "options": [
          "Classical pattern recognition",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Linear Discriminant Analysis is Classical pattern recognition."
      },
      {
        "question": "Why does the formula matter for Linear Discriminant Analysis?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Linear Discriminant Analysis?",
        "options": [
          "solver",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is solver."
      },
      {
        "question": "What is a common mistake when using Linear Discriminant Analysis?",
        "options": [
          "Using it when covariances differ strongly",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Using it when covariances differ strongly."
      }
    ]
  },
  "/ml/dimensionality-reduction/autoencoder": {
    "algorithmId": "deep-learning-autoencoders-basic-autoencoder",
    "sourceTitle": "Basic Autoencoder",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Basic Autoencoder: The Representation Builder",
        "story": "Ravi faces a real problem: raw data is too messy, so the system must build better internal clues. Basic Autoencoder enters the story because it learns layered or structured representations from examples.",
        "simpleExplanation": "Basic Autoencoder is a autoencoders concept in deep learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Basic Autoencoder learns intermediate representations. Those hidden representations make hard patterns easier to use.",
        "realtimeExample": "A model learns embeddings, reconstructions, generated samples, graph signals, or nonlinear predictions.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Basic Autoencoder feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Basic Autoencoder as a Simple Picture",
        "story": "It is like a workshop where each station improves the raw material before the final decision is made.",
        "simpleExplanation": "Squeeze the input through a bottleneck, then reconstruct it from the compact code. Layers, bottlenecks, graph messages, or generators transform data into more useful forms.",
        "realtimeExample": "In a classroom demo, students can use students passing cards through stations that each add, remove, or combine clues to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Basic Autoencoder Works Step by Step",
        "story": "Ravi slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team defines the objective, watches training curves, validates outputs, and inspects failure cases.",
        "realtimeApplications": [
          "The mechanics are representation",
          "loss",
          "capacity",
          "regularization",
          "optimization",
          "and validation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Basic Autoencoder",
        "story": "The math is a scoreboard for Ravi. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation describes how hidden states or samples are transformed and judged by an objective.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Basic Autoencoder in Real Applications",
        "story": "Ravi finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A powerful representation can memorize training examples or create plausible but wrong outputs.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Representation learning supports deep learning",
          "anomaly detection",
          "generation",
          "graph analytics",
          "and embeddings."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Basic Autoencoder?",
        "options": [
          "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior b...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Basic Autoencoder?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Basic Autoencoder is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Basic Autoencoder?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Basic Autoencoder?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Basic Autoencoder?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/deep-learning/perceptron": {
    "algorithmId": "deep-learning-neural-network-fundamentals-perceptron",
    "sourceTitle": "Perceptron",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Perceptron: The Representation Builder",
        "story": "Ravi faces a real problem: raw data is too messy, so the system must build better internal clues. Perceptron enters the story because it learns layered or structured representations from examples.",
        "simpleExplanation": "Perceptron is a neural network fundamentals concept in deep learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Perceptron learns intermediate representations. Those hidden representations make hard patterns easier to use.",
        "realtimeExample": "A model learns embeddings, reconstructions, generated samples, graph signals, or nonlinear predictions.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Perceptron feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Perceptron as a Simple Picture",
        "story": "It is like a workshop where each station improves the raw material before the final decision is made.",
        "simpleExplanation": "Convert raw observations into a structured signal, fit it, and verify that it generalizes. Layers, bottlenecks, graph messages, or generators transform data into more useful forms.",
        "realtimeExample": "In a classroom demo, students can use students passing cards through stations that each add, remove, or combine clues to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Perceptron Works Step by Step",
        "story": "Ravi slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Encode the input 2. Run the forward pass 3. Compute task loss 4. Backpropagate gradients 5. Update weights and validate",
        "realtimeExample": "A team defines the objective, watches training curves, validates outputs, and inspects failure cases.",
        "realtimeApplications": [
          "The mechanics are representation",
          "loss",
          "capacity",
          "regularization",
          "optimization",
          "and validation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Perceptron",
        "story": "The math is a scoreboard for Ravi. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "h_(l+1) = phi(W_l h_l + b_l). Each layer applies an affine transform followed by a non-linear activation.",
        "realtimeExample": "The equation describes how hidden states or samples are transformed and judged by an objective.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Perceptron in Real Applications",
        "story": "Ravi finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A powerful representation can memorize training examples or create plausible but wrong outputs.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Representation learning supports deep learning",
          "anomaly detection",
          "generation",
          "graph analytics",
          "and embeddings."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Perceptron?",
        "options": [
          "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Perceptron?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Perceptron is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Perceptron?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Perceptron?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Perceptron?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/deep-learning/cnn": {
    "algorithmId": "deep-learning-convolutional-neural-networks-cnn",
    "sourceTitle": "CNN",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "CNN: The Sliding Window Detective",
        "story": "Tara teaches a camera to spot shapes. Instead of looking at the whole image at once, it scans small windows like a detective with a magnifying glass.",
        "simpleExplanation": "CNN is the main tool in this story because it learns local visual patterns and reuses the same detector across an image. A Convolutional Neural Network uses learned local filters, shared across spatial positions, to build feature maps from images or grids.",
        "realtimeExample": "A medical imaging app highlights suspicious regions for a trained doctor to review.",
        "realtimeApplications": [
          "image classification",
          "medical imaging",
          "factory defect detection",
          "visual search"
        ],
        "teacherTip": "Before touching code, ask: what is the input, what is the output, and what mistake would hurt a real person?"
      },
      {
        "pageNumber": 2,
        "title": "CNN in Kid-Simple English",
        "story": "It is like sliding a tiny stencil over a picture to find edges, corners, and textures.",
        "simpleExplanation": "A CNN uses convolution filters to create feature maps. Early filters find simple patterns; deeper layers combine them into objects.",
        "realtimeExample": "A medical imaging app highlights suspicious regions for a trained doctor to review.",
        "realtimeApplications": [
          "You see this idea in image classification",
          "medical imaging",
          "factory defect detection",
          "visual search."
        ],
        "teacherTip": "Teach it to a younger friend in one sentence. If they can repeat it, you understand the heart of CNN."
      },
      {
        "pageNumber": 3,
        "title": "How CNN Thinks",
        "story": "Now Tara slows down and watches the algorithm one move at a time.",
        "simpleExplanation": "1. Normalize the image. 2. Slide kernels across pixels. 3. Build feature maps. 4. Pool or downsample. 5. Classify from learned visual evidence.",
        "realtimeExample": "A production ML team would log each step, compare it against validation data, and check whether the model still behaves well on fresh examples.",
        "realtimeApplications": [
          "Kernel size controls local view; stride controls movement; filters learn useful visual detectors."
        ],
        "teacherTip": "Follow the data like a detective follows footprints. Each step should explain the next step."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math of CNN",
        "story": "The math is the scoreboard. It tells Tara whether the algorithm is getting warmer or colder.",
        "simpleExplanation": "feature_map(i,j,k) = phi(sum_c sum_u sum_v W(u,v,c,k) * X(i+u,j+v,c) + b_k). Weight sharing makes CNNs parameter-efficient for spatial data.",
        "realtimeExample": "The feature map equation shows one filter scanning the image and producing activations.",
        "realtimeApplications": [
          "Important setting: filters",
          "kernel size",
          "stride",
          "padding",
          "pooling."
        ],
        "teacherTip": "Do not fear the equation. Point to each part and say what real thing it measures."
      },
      {
        "pageNumber": 5,
        "title": "CNN in the Real World",
        "story": "Tara learns that a CNN can see patterns, but it should never replace careful human review in high-stakes work.",
        "simpleExplanation": "Superpower: excellent visual pattern learning. Careful: distribution shift and poor labels can make image models fail.",
        "realtimeExample": "A medical imaging app highlights suspicious regions for a trained doctor to review.",
        "realtimeApplications": [
          "image classification",
          "medical imaging",
          "factory defect detection",
          "visual search"
        ],
        "teacherTip": "Award-winning ML thinking is honest thinking: test on new data, explain limits, and improve carefully."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of CNN?",
        "options": [
          "Use it for image-like data where local patterns and translation structure matter. Focus on the visible input-to-outpu...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for image-like data where local patterns and translation structure matter. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches CNN?",
        "options": [
          "Image classification",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of CNN is Image classification."
      },
      {
        "question": "Why does the formula matter for CNN?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for CNN?",
        "options": [
          "kernel size",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is kernel size."
      },
      {
        "question": "What is a common mistake when using CNN?",
        "options": [
          "Wrong output shape calculation",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Wrong output shape calculation."
      }
    ]
  },
  "/ml/deep-learning/rnn": {
    "algorithmId": "deep-learning-sequence-models-recurrent-neural-network",
    "sourceTitle": "Recurrent Neural Network",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Recurrent Neural Network: The Time Clue Keeper",
        "story": "Arjun faces a real problem: the answer depends on what happened before, not just what is happening now. Recurrent Neural Network enters the story because it models ordered information across time or tokens.",
        "simpleExplanation": "A Recurrent Neural Network processes a sequence one step at a time while carrying a hidden state forward. In kid-simple words, Recurrent Neural Network studies sequences. Earlier clues can change the meaning of later clues.",
        "realtimeExample": "A monitoring system forecasts demand, detects machine trouble, or understands language from ordered signals.",
        "realtimeApplications": [
          "Simple sequence classification",
          "Time-series baselines",
          "Character modelling"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Recurrent Neural Network feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Recurrent Neural Network as a Simple Picture",
        "story": "It is like reading a story: the current sentence makes more sense when you remember the previous sentences.",
        "simpleExplanation": "Each new item updates a running memory that summarizes earlier items. The model keeps, updates, or attends to context so the next prediction uses history.",
        "realtimeExample": "In a classroom demo, students can use daily temperatures, word cards, music notes, or sensor readings arranged in order to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Simple sequence classification",
          "Time-series baselines",
          "Character modelling."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Recurrent Neural Network Works Step by Step",
        "story": "Arjun slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Encode sequence inputs 2. Update hidden state at each time step 3. Produce output from state 4. Backpropagate through time 5. Watch for vanishing or exploding gradients",
        "realtimeExample": "A team builds time windows, prevents future leakage, validates by time order, and checks drift.",
        "realtimeApplications": [
          "The mechanics are sequence order",
          "hidden state or context",
          "window length",
          "leakage control",
          "and forecast error."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Recurrent Neural Network",
        "story": "The math is a scoreboard for Arjun. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "h_t = phi(W_x x_t + W_h h_(t-1) + b). The same recurrent weights are reused at every time step.",
        "realtimeExample": "The equation updates memory or attention from one step to the next, then predicts from that context.",
        "realtimeApplications": [
          "Important setting to inspect: hidden size."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Recurrent Neural Network in Real Applications",
        "story": "Arjun finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Natural sequence model. Watch-outs: Vanishing/exploding gradients, Weak long-range memory, Sequential computation is hard to parallelize. Common mistakes: Expecting long memory from a plain RNN, Not clipping gradients, Leaking future time steps.",
        "realtimeExample": "If future values leak into training, the model looks brilliant in practice and weak in real deployment.",
        "realtimeApplications": [
          "Simple sequence classification",
          "Time-series baselines",
          "Character modelling. Sequence thinking powers forecasting",
          "language tools",
          "speech",
          "sensors",
          "finance",
          "and operations monitoring."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Recurrent Neural Network?",
        "options": [
          "Use it to teach sequence memory and temporal dependence, especially before LSTM and GRU gates. Focus on the visible i...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to teach sequence memory and temporal dependence, especially before LSTM and GRU gates. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Recurrent Neural Network?",
        "options": [
          "Simple sequence classification",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Recurrent Neural Network is Simple sequence classification."
      },
      {
        "question": "Why does the formula matter for Recurrent Neural Network?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Recurrent Neural Network?",
        "options": [
          "hidden size",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is hidden size."
      },
      {
        "question": "What is a common mistake when using Recurrent Neural Network?",
        "options": [
          "Expecting long memory from a plain RNN",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Expecting long memory from a plain RNN."
      }
    ]
  },
  "/ml/deep-learning/lstm": {
    "algorithmId": "deep-learning-sequence-models-lstm",
    "sourceTitle": "LSTM",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "LSTM: The Memory Backpack",
        "story": "Arjun reads a long weather diary. To predict tomorrow, he must remember useful old clues and forget noisy details.",
        "simpleExplanation": "LSTM is the main tool in this story because it uses gates to keep, erase, and reveal sequence memory. Long Short-Term Memory is a gated recurrent network that uses input, forget and output gates plus a cell state to preserve sequence information.",
        "realtimeExample": "A sensor system forecasts machine failure from a stream of readings over time.",
        "realtimeApplications": [
          "time-series forecasting",
          "text sequence modeling",
          "sensor monitoring",
          "speech sequences"
        ],
        "teacherTip": "Before touching code, ask: what is the input, what is the output, and what mistake would hurt a real person?"
      },
      {
        "pageNumber": 2,
        "title": "LSTM in Kid-Simple English",
        "story": "It is like carrying a backpack where gates decide what notes stay inside.",
        "simpleExplanation": "LSTM is a sequence model with a cell state and gates. The gates control what information enters memory, what is forgotten, and what becomes output.",
        "realtimeExample": "A sensor system forecasts machine failure from a stream of readings over time.",
        "realtimeApplications": [
          "You see this idea in time-series forecasting",
          "text sequence modeling",
          "sensor monitoring",
          "speech sequences."
        ],
        "teacherTip": "Teach it to a younger friend in one sentence. If they can repeat it, you understand the heart of LSTM."
      },
      {
        "pageNumber": 3,
        "title": "How LSTM Thinks",
        "story": "Now Arjun slows down and watches the algorithm one move at a time.",
        "simpleExplanation": "1. Read one time step. 2. Compute input, forget, and output gates. 3. Update cell memory. 4. Emit hidden state. 5. Repeat through the sequence.",
        "realtimeExample": "A production ML team would log each step, compare it against validation data, and check whether the model still behaves well on fresh examples.",
        "realtimeApplications": [
          "The forget gate removes stale clues; the input gate writes new clues; the output gate reveals useful memory."
        ],
        "teacherTip": "Follow the data like a detective follows footprints. Each step should explain the next step."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math of LSTM",
        "story": "The math is the scoreboard. It tells Arjun whether the algorithm is getting warmer or colder.",
        "simpleExplanation": "c_t = f_t*c_(t-1) + i_t*g_t,   h_t = o_t*tanh(c_t). Forget, input and output gates regulate memory flow.",
        "realtimeExample": "The cell-state equation mixes old memory with new candidate memory.",
        "realtimeApplications": [
          "Important setting: hidden size",
          "sequence length",
          "dropout",
          "learning rate."
        ],
        "teacherTip": "Do not fear the equation. Point to each part and say what real thing it measures."
      },
      {
        "pageNumber": 5,
        "title": "LSTM in the Real World",
        "story": "Arjun learns that memory helps, but future data must never leak into training windows.",
        "simpleExplanation": "Superpower: handling longer sequence context than plain RNNs. Careful: training is slower than attention and still needs careful windowing.",
        "realtimeExample": "A sensor system forecasts machine failure from a stream of readings over time.",
        "realtimeApplications": [
          "time-series forecasting",
          "text sequence modeling",
          "sensor monitoring",
          "speech sequences"
        ],
        "teacherTip": "Award-winning ML thinking is honest thinking: test on new data, explain limits, and improve carefully."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of LSTM?",
        "options": [
          "Use it for sequence tasks where longer-range context matters more than a plain RNN can handle. Focus on the visible i...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for sequence tasks where longer-range context matters more than a plain RNN can handle. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches LSTM?",
        "options": [
          "Forecasting",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of LSTM is Forecasting."
      },
      {
        "question": "Why does the formula matter for LSTM?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for LSTM?",
        "options": [
          "hidden size",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is hidden size."
      },
      {
        "question": "What is a common mistake when using LSTM?",
        "options": [
          "Forget gate settings that erase useful context",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Forget gate settings that erase useful context."
      }
    ]
  },
  "/ml/deep-learning/gru": {
    "algorithmId": "deep-learning-sequence-models-gru",
    "sourceTitle": "GRU",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "GRU: The Time Clue Keeper",
        "story": "Arjun faces a real problem: the answer depends on what happened before, not just what is happening now. GRU enters the story because it models ordered information across time or tokens.",
        "simpleExplanation": "Gated Recurrent Unit is a compact gated recurrent network using update and reset gates to manage sequence memory. In kid-simple words, GRU studies sequences. Earlier clues can change the meaning of later clues.",
        "realtimeExample": "A monitoring system forecasts demand, detects machine trouble, or understands language from ordered signals.",
        "realtimeApplications": [
          "Time-series forecasting",
          "Sequence classification",
          "Text and sensor streams"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes GRU feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "GRU as a Simple Picture",
        "story": "It is like reading a story: the current sentence makes more sense when you remember the previous sentences.",
        "simpleExplanation": "One gate controls how much old state survives, while another controls how new candidate memory is formed. The model keeps, updates, or attends to context so the next prediction uses history.",
        "realtimeExample": "In a classroom demo, students can use daily temperatures, word cards, music notes, or sensor readings arranged in order to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Time-series forecasting",
          "Sequence classification",
          "Text and sensor streams."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How GRU Works Step by Step",
        "story": "Arjun slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Encode sequence inputs 2. Compute update and reset gates 3. Build candidate hidden state 4. Mix old and new state 5. Train through time and validate",
        "realtimeExample": "A team builds time windows, prevents future leakage, validates by time order, and checks drift.",
        "realtimeApplications": [
          "The mechanics are sequence order",
          "hidden state or context",
          "window length",
          "leakage control",
          "and forecast error."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind GRU",
        "story": "The math is a scoreboard for Arjun. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "h_t = (1 - z_t)*h_(t-1) + z_t*h_tilde_t. The update gate z_t controls memory retention versus replacement.",
        "realtimeExample": "The equation updates memory or attention from one step to the next, then predicts from that context.",
        "realtimeApplications": [
          "Important setting to inspect: hidden size."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "GRU in Real Applications",
        "story": "Arjun finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Fewer parameters than LSTM. Watch-outs: Less explicit memory structure than LSTM, Still sequential, Can struggle with very long context. Common mistakes: Assuming gates solve all long-context problems, Not validating sequence window length, Skipping scaling for time series.",
        "realtimeExample": "If future values leak into training, the model looks brilliant in practice and weak in real deployment.",
        "realtimeApplications": [
          "Time-series forecasting",
          "Sequence classification",
          "Text and sensor streams. Sequence thinking powers forecasting",
          "language tools",
          "speech",
          "sensors",
          "finance",
          "and operations monitoring."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of GRU?",
        "options": [
          "Use it as a simpler alternative to LSTM for sequence tasks with fewer parameters. Focus on the visible input-to-outpu...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it as a simpler alternative to LSTM for sequence tasks with fewer parameters. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches GRU?",
        "options": [
          "Time-series forecasting",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of GRU is Time-series forecasting."
      },
      {
        "question": "Why does the formula matter for GRU?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for GRU?",
        "options": [
          "hidden size",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is hidden size."
      },
      {
        "question": "What is a common mistake when using GRU?",
        "options": [
          "Assuming gates solve all long-context problems",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Assuming gates solve all long-context problems."
      }
    ]
  },
  "/ml/deep-learning/multi-head-attention": {
    "algorithmId": "deep-learning-transformers-multi-head-attention",
    "sourceTitle": "Multi-Head Attention",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Multi-Head Attention: The Focus Lens",
        "story": "Zoya faces a real problem: a model must decide which parts of a sentence, image, or document matter most right now. Multi-Head Attention enters the story because it lets each item look at other items and mix useful information.",
        "simpleExplanation": "Multi-Head Attention is a transformers concept in deep learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Multi-Head Attention uses attention to compare pieces of context and decide what information to focus on.",
        "realtimeExample": "A document system answers questions, summarizes text, searches passages, or connects image patches.",
        "realtimeApplications": [
          "Language understanding",
          "Sequence forecasting",
          "Document retrieval"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Multi-Head Attention feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Multi-Head Attention as a Simple Picture",
        "story": "Imagine each word holding a tiny flashlight and shining it on the words that help explain its meaning.",
        "simpleExplanation": "Let each token assign relevance weights to other tokens before mixing their information. Attention creates weights between items; stronger weights contribute more to the mixed representation.",
        "realtimeExample": "In a classroom demo, students can use word cards where students draw arrows to the words that explain each other to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Language understanding",
          "Sequence forecasting",
          "Document retrieval."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Multi-Head Attention Works Step by Step",
        "story": "Zoya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Encode the input 2. Run the forward pass 3. Compute task loss 4. Backpropagate gradients 5. Update weights and validate",
        "realtimeExample": "A team checks masking, context length, tokenization, evaluation data, and whether outputs are grounded.",
        "realtimeApplications": [
          "The mechanics are queries",
          "keys",
          "values",
          "weights",
          "heads",
          "context windows",
          "and masks."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Multi-Head Attention",
        "story": "The math is a scoreboard for Zoya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V. Scaled similarity becomes a normalized mixing weight over value vectors.",
        "realtimeExample": "The equation turns query-key similarity into weights, then uses those weights to mix values.",
        "realtimeApplications": [
          "Important setting to inspect: Model dimension."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Multi-Head Attention in Real Applications",
        "story": "Zoya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Models long-range interactions. Watch-outs: Memory grows quickly with sequence length, Needs substantial data and compute, Attention is not always a causal explanation. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "Attention weights can be useful clues, but they are not guaranteed to be perfect explanations.",
        "realtimeApplications": [
          "Language understanding",
          "Sequence forecasting",
          "Document retrieval. Attention is central to modern language",
          "document",
          "coding",
          "retrieval",
          "and vision systems."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Multi-Head Attention?",
        "options": [
          "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Multi-Head Attention?",
        "options": [
          "Language understanding",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Multi-Head Attention is Language understanding."
      },
      {
        "question": "Why does the formula matter for Multi-Head Attention?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Multi-Head Attention?",
        "options": [
          "Model dimension",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Model dimension."
      },
      {
        "question": "What is a common mistake when using Multi-Head Attention?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/deep-learning/backpropagation-visualizer": {
    "algorithmId": "deep-learning-neural-network-fundamentals-backpropagation",
    "sourceTitle": "Backpropagation",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Backpropagation: The Representation Builder",
        "story": "Ravi faces a real problem: raw data is too messy, so the system must build better internal clues. Backpropagation enters the story because it learns layered or structured representations from examples.",
        "simpleExplanation": "Backpropagation is a neural network fundamentals concept in deep learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Backpropagation learns intermediate representations. Those hidden representations make hard patterns easier to use.",
        "realtimeExample": "A model learns embeddings, reconstructions, generated samples, graph signals, or nonlinear predictions.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Backpropagation feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Backpropagation as a Simple Picture",
        "story": "It is like a workshop where each station improves the raw material before the final decision is made.",
        "simpleExplanation": "Convert raw observations into a structured signal, fit it, and verify that it generalizes. Layers, bottlenecks, graph messages, or generators transform data into more useful forms.",
        "realtimeExample": "In a classroom demo, students can use students passing cards through stations that each add, remove, or combine clues to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Backpropagation Works Step by Step",
        "story": "Ravi slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Encode the input 2. Run the forward pass 3. Compute task loss 4. Backpropagate gradients 5. Update weights and validate",
        "realtimeExample": "A team defines the objective, watches training curves, validates outputs, and inspects failure cases.",
        "realtimeApplications": [
          "The mechanics are representation",
          "loss",
          "capacity",
          "regularization",
          "optimization",
          "and validation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Backpropagation",
        "story": "The math is a scoreboard for Ravi. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "h_(l+1) = phi(W_l h_l + b_l). Each layer applies an affine transform followed by a non-linear activation.",
        "realtimeExample": "The equation describes how hidden states or samples are transformed and judged by an objective.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Backpropagation in Real Applications",
        "story": "Ravi finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A powerful representation can memorize training examples or create plausible but wrong outputs.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Representation learning supports deep learning",
          "anomaly detection",
          "generation",
          "graph analytics",
          "and embeddings."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Backpropagation?",
        "options": [
          "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Backpropagation?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Backpropagation is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Backpropagation?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Backpropagation?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Backpropagation?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/preprocessing/outlier-detection": {
    "algorithmId": "unsupervised-learning-anomaly-detection-statistical-outlier-detection",
    "sourceTitle": "Statistical Outlier Detection",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Statistical Outlier Detection: The Pattern Workshop",
        "story": "Diya faces a real problem: a team has data and needs a careful way to turn it into useful evidence. Statistical Outlier Detection enters the story because it gives the team a repeatable method for learning from examples.",
        "simpleExplanation": "Statistical Outlier Detection is a anomaly detection concept in unsupervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Statistical Outlier Detection transforms observations into a signal, estimate, representation, or decision.",
        "realtimeExample": "A practical ML workflow uses Statistical Outlier Detection as one candidate method, then compares it with baselines.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Statistical Outlier Detection feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Statistical Outlier Detection as a Simple Picture",
        "story": "It is like sorting a messy project table into labeled trays so each clue has a job.",
        "simpleExplanation": "Convert raw observations into a structured signal, fit it, and verify that it generalizes. The method works best when the input, objective, validation, and limitations are all clear.",
        "realtimeExample": "In a classroom demo, students can use small datasets where students define inputs, outputs, and a success metric to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Statistical Outlier Detection Works Step by Step",
        "story": "Diya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team prepares data, fits the method, checks intermediate outputs, validates results, and documents limits.",
        "realtimeApplications": [
          "The mechanics are inputs",
          "objective",
          "preprocessing",
          "model behavior",
          "and evaluation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Statistical Outlier Detection",
        "story": "The math is a scoreboard for Diya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation defines what the method considers a good solution.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Statistical Outlier Detection in Real Applications",
        "story": "Diya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A method can be mathematically correct but still solve the wrong real-world problem.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. This kind of thinking supports experimentation",
          "analytics",
          "automation",
          "and responsible ML delivery."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Statistical Outlier Detection?",
        "options": [
          "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior b...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Statistical Outlier Detection?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Statistical Outlier Detection is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Statistical Outlier Detection?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Statistical Outlier Detection?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Statistical Outlier Detection?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/time-series/moving-average": {
    "algorithmId": "time-series-algorithms-forecasting-moving-average",
    "sourceTitle": "Moving Average",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Moving Average: The Time Clue Keeper",
        "story": "Arjun faces a real problem: the answer depends on what happened before, not just what is happening now. Moving Average enters the story because it models ordered information across time or tokens.",
        "simpleExplanation": "Moving Average is a forecasting concept in time-series algorithms that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Moving Average studies sequences. Earlier clues can change the meaning of later clues.",
        "realtimeExample": "A monitoring system forecasts demand, detects machine trouble, or understands language from ordered signals.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Moving Average feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Moving Average as a Simple Picture",
        "story": "It is like reading a story: the current sentence makes more sense when you remember the previous sentences.",
        "simpleExplanation": "Separate recent level, trend and recurring patterns before extending them into the future. The model keeps, updates, or attends to context so the next prediction uses history.",
        "realtimeExample": "In a classroom demo, students can use daily temperatures, word cards, music notes, or sensor readings arranged in order to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Moving Average Works Step by Step",
        "story": "Arjun slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team builds time windows, prevents future leakage, validates by time order, and checks drift.",
        "realtimeApplications": [
          "The mechanics are sequence order",
          "hidden state or context",
          "window length",
          "leakage control",
          "and forecast error."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Moving Average",
        "story": "The math is a scoreboard for Arjun. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation updates memory or attention from one step to the next, then predicts from that context.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Moving Average in Real Applications",
        "story": "Arjun finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "If future values leak into training, the model looks brilliant in practice and weak in real deployment.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Sequence thinking powers forecasting",
          "language tools",
          "speech",
          "sensors",
          "finance",
          "and operations monitoring."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Moving Average?",
        "options": [
          "Use it to forecast future values from ordered observations. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to forecast future values from ordered observations. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Moving Average?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Moving Average is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Moving Average?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Moving Average?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Moving Average?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/time-series/exponential-smoothing": {
    "algorithmId": "time-series-algorithms-forecasting-exponential-smoothing",
    "sourceTitle": "Exponential Smoothing",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Exponential Smoothing: The Time Clue Keeper",
        "story": "Arjun faces a real problem: the answer depends on what happened before, not just what is happening now. Exponential Smoothing enters the story because it models ordered information across time or tokens.",
        "simpleExplanation": "Exponential Smoothing is a forecasting concept in time-series algorithms that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Exponential Smoothing studies sequences. Earlier clues can change the meaning of later clues.",
        "realtimeExample": "A monitoring system forecasts demand, detects machine trouble, or understands language from ordered signals.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Exponential Smoothing feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Exponential Smoothing as a Simple Picture",
        "story": "It is like reading a story: the current sentence makes more sense when you remember the previous sentences.",
        "simpleExplanation": "Separate recent level, trend and recurring patterns before extending them into the future. The model keeps, updates, or attends to context so the next prediction uses history.",
        "realtimeExample": "In a classroom demo, students can use daily temperatures, word cards, music notes, or sensor readings arranged in order to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Exponential Smoothing Works Step by Step",
        "story": "Arjun slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team builds time windows, prevents future leakage, validates by time order, and checks drift.",
        "realtimeApplications": [
          "The mechanics are sequence order",
          "hidden state or context",
          "window length",
          "leakage control",
          "and forecast error."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Exponential Smoothing",
        "story": "The math is a scoreboard for Arjun. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation updates memory or attention from one step to the next, then predicts from that context.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Exponential Smoothing in Real Applications",
        "story": "Arjun finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "If future values leak into training, the model looks brilliant in practice and weak in real deployment.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Sequence thinking powers forecasting",
          "language tools",
          "speech",
          "sensors",
          "finance",
          "and operations monitoring."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Exponential Smoothing?",
        "options": [
          "Use it to forecast future values from ordered observations. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to forecast future values from ordered observations. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Exponential Smoothing?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Exponential Smoothing is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Exponential Smoothing?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Exponential Smoothing?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Exponential Smoothing?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/time-series/holt-winters": {
    "algorithmId": "time-series-algorithms-forecasting-holt-winters",
    "sourceTitle": "Holt-Winters",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Holt-Winters: The Time Clue Keeper",
        "story": "Arjun faces a real problem: the answer depends on what happened before, not just what is happening now. Holt-Winters enters the story because it models ordered information across time or tokens.",
        "simpleExplanation": "Holt-Winters is a forecasting concept in time-series algorithms that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Holt-Winters studies sequences. Earlier clues can change the meaning of later clues.",
        "realtimeExample": "A monitoring system forecasts demand, detects machine trouble, or understands language from ordered signals.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Holt-Winters feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Holt-Winters as a Simple Picture",
        "story": "It is like reading a story: the current sentence makes more sense when you remember the previous sentences.",
        "simpleExplanation": "Separate recent level, trend and recurring patterns before extending them into the future. The model keeps, updates, or attends to context so the next prediction uses history.",
        "realtimeExample": "In a classroom demo, students can use daily temperatures, word cards, music notes, or sensor readings arranged in order to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Holt-Winters Works Step by Step",
        "story": "Arjun slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team builds time windows, prevents future leakage, validates by time order, and checks drift.",
        "realtimeApplications": [
          "The mechanics are sequence order",
          "hidden state or context",
          "window length",
          "leakage control",
          "and forecast error."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Holt-Winters",
        "story": "The math is a scoreboard for Arjun. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation updates memory or attention from one step to the next, then predicts from that context.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Holt-Winters in Real Applications",
        "story": "Arjun finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "If future values leak into training, the model looks brilliant in practice and weak in real deployment.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Sequence thinking powers forecasting",
          "language tools",
          "speech",
          "sensors",
          "finance",
          "and operations monitoring."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Holt-Winters?",
        "options": [
          "Use it to forecast future values from ordered observations. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to forecast future values from ordered observations. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Holt-Winters?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Holt-Winters is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Holt-Winters?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Holt-Winters?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Holt-Winters?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/time-series/arima-concept": {
    "algorithmId": "time-series-algorithms-forecasting-arima",
    "sourceTitle": "ARIMA",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "ARIMA: The Time Clue Keeper",
        "story": "Arjun faces a real problem: the answer depends on what happened before, not just what is happening now. ARIMA enters the story because it models ordered information across time or tokens.",
        "simpleExplanation": "ARIMA is a forecasting concept in time-series algorithms that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, ARIMA studies sequences. Earlier clues can change the meaning of later clues.",
        "realtimeExample": "A monitoring system forecasts demand, detects machine trouble, or understands language from ordered signals.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes ARIMA feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "ARIMA as a Simple Picture",
        "story": "It is like reading a story: the current sentence makes more sense when you remember the previous sentences.",
        "simpleExplanation": "Separate recent level, trend and recurring patterns before extending them into the future. The model keeps, updates, or attends to context so the next prediction uses history.",
        "realtimeExample": "In a classroom demo, students can use daily temperatures, word cards, music notes, or sensor readings arranged in order to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How ARIMA Works Step by Step",
        "story": "Arjun slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team builds time windows, prevents future leakage, validates by time order, and checks drift.",
        "realtimeApplications": [
          "The mechanics are sequence order",
          "hidden state or context",
          "window length",
          "leakage control",
          "and forecast error."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind ARIMA",
        "story": "The math is a scoreboard for Arjun. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation updates memory or attention from one step to the next, then predicts from that context.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "ARIMA in Real Applications",
        "story": "Arjun finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "If future values leak into training, the model looks brilliant in practice and weak in real deployment.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Sequence thinking powers forecasting",
          "language tools",
          "speech",
          "sensors",
          "finance",
          "and operations monitoring."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of ARIMA?",
        "options": [
          "Use it to forecast future values from ordered observations. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to forecast future values from ordered observations. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches ARIMA?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of ARIMA is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for ARIMA?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for ARIMA?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using ARIMA?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/time-series/anomaly-detection": {
    "algorithmId": "unsupervised-learning-anomaly-detection-autoencoder-anomaly-detection",
    "sourceTitle": "Autoencoder Anomaly Detection",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Autoencoder Anomaly Detection: The Representation Builder",
        "story": "Ravi faces a real problem: raw data is too messy, so the system must build better internal clues. Autoencoder Anomaly Detection enters the story because it learns layered or structured representations from examples.",
        "simpleExplanation": "Autoencoder Anomaly Detection is a anomaly detection concept in unsupervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Autoencoder Anomaly Detection learns intermediate representations. Those hidden representations make hard patterns easier to use.",
        "realtimeExample": "A model learns embeddings, reconstructions, generated samples, graph signals, or nonlinear predictions.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Autoencoder Anomaly Detection feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Autoencoder Anomaly Detection as a Simple Picture",
        "story": "It is like a workshop where each station improves the raw material before the final decision is made.",
        "simpleExplanation": "Squeeze the input through a bottleneck, then reconstruct it from the compact code. Layers, bottlenecks, graph messages, or generators transform data into more useful forms.",
        "realtimeExample": "In a classroom demo, students can use students passing cards through stations that each add, remove, or combine clues to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Autoencoder Anomaly Detection Works Step by Step",
        "story": "Ravi slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team defines the objective, watches training curves, validates outputs, and inspects failure cases.",
        "realtimeApplications": [
          "The mechanics are representation",
          "loss",
          "capacity",
          "regularization",
          "optimization",
          "and validation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Autoencoder Anomaly Detection",
        "story": "The math is a scoreboard for Ravi. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation describes how hidden states or samples are transformed and judged by an objective.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Autoencoder Anomaly Detection in Real Applications",
        "story": "Ravi finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A powerful representation can memorize training examples or create plausible but wrong outputs.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Representation learning supports deep learning",
          "anomaly detection",
          "generation",
          "graph analytics",
          "and embeddings."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Autoencoder Anomaly Detection?",
        "options": [
          "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior b...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Autoencoder Anomaly Detection?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Autoencoder Anomaly Detection is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Autoencoder Anomaly Detection?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Autoencoder Anomaly Detection?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Autoencoder Anomaly Detection?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/time-series/lstm-forecasting": {
    "algorithmId": "time-series-algorithms-forecasting-lstm-forecasting",
    "sourceTitle": "LSTM Forecasting",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "LSTM Forecasting: The Time Clue Keeper",
        "story": "Arjun faces a real problem: the answer depends on what happened before, not just what is happening now. LSTM Forecasting enters the story because it models ordered information across time or tokens.",
        "simpleExplanation": "LSTM Forecasting is a forecasting concept in time-series algorithms that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, LSTM Forecasting studies sequences. Earlier clues can change the meaning of later clues.",
        "realtimeExample": "A monitoring system forecasts demand, detects machine trouble, or understands language from ordered signals.",
        "realtimeApplications": [
          "Language understanding",
          "Sequence forecasting",
          "Document retrieval"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes LSTM Forecasting feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "LSTM Forecasting as a Simple Picture",
        "story": "It is like reading a story: the current sentence makes more sense when you remember the previous sentences.",
        "simpleExplanation": "Carry a compact state forward so the current output can use earlier context. The model keeps, updates, or attends to context so the next prediction uses history.",
        "realtimeExample": "In a classroom demo, students can use daily temperatures, word cards, music notes, or sensor readings arranged in order to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Language understanding",
          "Sequence forecasting",
          "Document retrieval."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How LSTM Forecasting Works Step by Step",
        "story": "Arjun slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Encode the input 2. Run the forward pass 3. Compute task loss 4. Backpropagate gradients 5. Update weights and validate",
        "realtimeExample": "A team builds time windows, prevents future leakage, validates by time order, and checks drift.",
        "realtimeApplications": [
          "The mechanics are sequence order",
          "hidden state or context",
          "window length",
          "leakage control",
          "and forecast error."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind LSTM Forecasting",
        "story": "The math is a scoreboard for Arjun. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation updates memory or attention from one step to the next, then predicts from that context.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "LSTM Forecasting in Real Applications",
        "story": "Arjun finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "If future values leak into training, the model looks brilliant in practice and weak in real deployment.",
        "realtimeApplications": [
          "Language understanding",
          "Sequence forecasting",
          "Document retrieval. Sequence thinking powers forecasting",
          "language tools",
          "speech",
          "sensors",
          "finance",
          "and operations monitoring."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of LSTM Forecasting?",
        "options": [
          "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches LSTM Forecasting?",
        "options": [
          "Language understanding",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of LSTM Forecasting is Language understanding."
      },
      {
        "question": "Why does the formula matter for LSTM Forecasting?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for LSTM Forecasting?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using LSTM Forecasting?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/time-series/gru-forecasting": {
    "algorithmId": "time-series-algorithms-forecasting-gru-forecasting",
    "sourceTitle": "GRU Forecasting",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "GRU Forecasting: The Time Clue Keeper",
        "story": "Arjun faces a real problem: the answer depends on what happened before, not just what is happening now. GRU Forecasting enters the story because it models ordered information across time or tokens.",
        "simpleExplanation": "GRU Forecasting is a forecasting concept in time-series algorithms that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, GRU Forecasting studies sequences. Earlier clues can change the meaning of later clues.",
        "realtimeExample": "A monitoring system forecasts demand, detects machine trouble, or understands language from ordered signals.",
        "realtimeApplications": [
          "Language understanding",
          "Sequence forecasting",
          "Document retrieval"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes GRU Forecasting feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "GRU Forecasting as a Simple Picture",
        "story": "It is like reading a story: the current sentence makes more sense when you remember the previous sentences.",
        "simpleExplanation": "Carry a compact state forward so the current output can use earlier context. The model keeps, updates, or attends to context so the next prediction uses history.",
        "realtimeExample": "In a classroom demo, students can use daily temperatures, word cards, music notes, or sensor readings arranged in order to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Language understanding",
          "Sequence forecasting",
          "Document retrieval."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How GRU Forecasting Works Step by Step",
        "story": "Arjun slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Encode the input 2. Run the forward pass 3. Compute task loss 4. Backpropagate gradients 5. Update weights and validate",
        "realtimeExample": "A team builds time windows, prevents future leakage, validates by time order, and checks drift.",
        "realtimeApplications": [
          "The mechanics are sequence order",
          "hidden state or context",
          "window length",
          "leakage control",
          "and forecast error."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind GRU Forecasting",
        "story": "The math is a scoreboard for Arjun. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation updates memory or attention from one step to the next, then predicts from that context.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "GRU Forecasting in Real Applications",
        "story": "Arjun finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "If future values leak into training, the model looks brilliant in practice and weak in real deployment.",
        "realtimeApplications": [
          "Language understanding",
          "Sequence forecasting",
          "Document retrieval. Sequence thinking powers forecasting",
          "language tools",
          "speech",
          "sensors",
          "finance",
          "and operations monitoring."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of GRU Forecasting?",
        "options": [
          "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches GRU Forecasting?",
        "options": [
          "Language understanding",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of GRU Forecasting is Language understanding."
      },
      {
        "question": "Why does the formula matter for GRU Forecasting?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for GRU Forecasting?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using GRU Forecasting?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/nlp/bag-of-words": {
    "algorithmId": "natural-language-processing-classical-nlp-bag-of-words",
    "sourceTitle": "Bag of Words",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Bag of Words: The Pattern Workshop",
        "story": "Diya faces a real problem: a team has data and needs a careful way to turn it into useful evidence. Bag of Words enters the story because it gives the team a repeatable method for learning from examples.",
        "simpleExplanation": "Bag of Words is a classical nlp concept in natural language processing that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Bag of Words transforms observations into a signal, estimate, representation, or decision.",
        "realtimeExample": "A practical ML workflow uses Bag of Words as one candidate method, then compares it with baselines.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Bag of Words feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Bag of Words as a Simple Picture",
        "story": "It is like sorting a messy project table into labeled trays so each clue has a job.",
        "simpleExplanation": "Convert raw observations into a structured signal, fit it, and verify that it generalizes. The method works best when the input, objective, validation, and limitations are all clear.",
        "realtimeExample": "In a classroom demo, students can use small datasets where students define inputs, outputs, and a success metric to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Bag of Words Works Step by Step",
        "story": "Diya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team prepares data, fits the method, checks intermediate outputs, validates results, and documents limits.",
        "realtimeApplications": [
          "The mechanics are inputs",
          "objective",
          "preprocessing",
          "model behavior",
          "and evaluation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Bag of Words",
        "story": "The math is a scoreboard for Diya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation defines what the method considers a good solution.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Bag of Words in Real Applications",
        "story": "Diya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A method can be mathematically correct but still solve the wrong real-world problem.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. This kind of thinking supports experimentation",
          "analytics",
          "automation",
          "and responsible ML delivery."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Bag of Words?",
        "options": [
          "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior b...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Bag of Words?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Bag of Words is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Bag of Words?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Bag of Words?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Bag of Words?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/nlp/tf-idf": {
    "algorithmId": "natural-language-processing-classical-nlp-tf-idf",
    "sourceTitle": "TF-IDF",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "TF-IDF: The Pattern Workshop",
        "story": "Diya faces a real problem: a team has data and needs a careful way to turn it into useful evidence. TF-IDF enters the story because it gives the team a repeatable method for learning from examples.",
        "simpleExplanation": "TF-IDF is a classical nlp concept in natural language processing that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, TF-IDF transforms observations into a signal, estimate, representation, or decision.",
        "realtimeExample": "A practical ML workflow uses TF-IDF as one candidate method, then compares it with baselines.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes TF-IDF feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "TF-IDF as a Simple Picture",
        "story": "It is like sorting a messy project table into labeled trays so each clue has a job.",
        "simpleExplanation": "Convert raw observations into a structured signal, fit it, and verify that it generalizes. The method works best when the input, objective, validation, and limitations are all clear.",
        "realtimeExample": "In a classroom demo, students can use small datasets where students define inputs, outputs, and a success metric to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How TF-IDF Works Step by Step",
        "story": "Diya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team prepares data, fits the method, checks intermediate outputs, validates results, and documents limits.",
        "realtimeApplications": [
          "The mechanics are inputs",
          "objective",
          "preprocessing",
          "model behavior",
          "and evaluation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind TF-IDF",
        "story": "The math is a scoreboard for Diya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation defines what the method considers a good solution.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "TF-IDF in Real Applications",
        "story": "Diya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A method can be mathematically correct but still solve the wrong real-world problem.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. This kind of thinking supports experimentation",
          "analytics",
          "automation",
          "and responsible ML delivery."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of TF-IDF?",
        "options": [
          "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior b...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches TF-IDF?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of TF-IDF is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for TF-IDF?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for TF-IDF?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using TF-IDF?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/nlp/text-classification": {
    "algorithmId": "natural-language-processing-classical-nlp-naive-bayes-text-classification",
    "sourceTitle": "Naive Bayes Text Classification",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Naive Bayes Text Classification: The Decision Gate",
        "story": "Kabir faces a real problem: a safety monitor must decide whether each case needs attention now or can wait. Naive Bayes Text Classification enters the story because it turns evidence into a class decision.",
        "simpleExplanation": "Naive Bayes is a probabilistic classifier that applies Bayes' theorem while assuming features are conditionally independent given the class. In kid-simple words, Naive Bayes Text Classification chooses a category. It studies labelled examples and learns the clues that separate one class from another.",
        "realtimeExample": "A realtime alert system classifies transactions, messages, defects, or support tickets for faster review.",
        "realtimeApplications": [
          "Spam filtering",
          "Document classification",
          "Sentiment baselines"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Naive Bayes Text Classification feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Naive Bayes Text Classification as a Simple Picture",
        "story": "Imagine a gate with colored lanes. Each new example is guided into the lane that best matches its evidence.",
        "simpleExplanation": "Each feature contributes evidence to each class, and the class with the largest posterior score wins. The model is not just saying yes or no; it is organizing evidence into a decision rule.",
        "realtimeExample": "In a classroom demo, students can use cards labelled safe/risky, healthy/sick, spam/not spam, or pass/review to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Spam filtering",
          "Document classification",
          "Sentiment baselines."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Naive Bayes Text Classification Works Step by Step",
        "story": "Kabir slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Estimate class priors 2. Estimate feature likelihoods per class 3. Apply smoothing 4. Sum log evidence for a new sample 5. Predict the class with highest posterior score",
        "realtimeExample": "A team balances precision, recall, fairness, and calibration before trusting the classifier.",
        "realtimeApplications": [
          "The mechanics are labels",
          "features",
          "decision boundary",
          "threshold",
          "and confusion-matrix tradeoffs."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Naive Bayes Text Classification",
        "story": "The math is a scoreboard for Kabir. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "argmax_c log P(c) + sum_j log P(x_j | c). The independence assumption makes likelihood estimation simple and fast.",
        "realtimeExample": "The formula creates a score or probability; the threshold turns that score into a final class.",
        "realtimeApplications": [
          "Important setting to inspect: smoothing alpha."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Naive Bayes Text Classification in Real Applications",
        "story": "Kabir finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Very fast. Watch-outs: Independence assumption is often false, Probability calibration can be poor, Feature likelihood choice matters. Common mistakes: Using Gaussian NB for count text, Ignoring correlated features, Forgetting smoothing.",
        "realtimeExample": "A model can score high overall while missing the rare class that matters most.",
        "realtimeApplications": [
          "Spam filtering",
          "Document classification",
          "Sentiment baselines. This powers fraud review",
          "medical triage",
          "moderation",
          "quality inspection",
          "and customer routing."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Naive Bayes Text Classification?",
        "options": [
          "Use it for fast probabilistic classification and as a strong baseline for text or count-like features. Focus on the v...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for fast probabilistic classification and as a strong baseline for text or count-like features. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Naive Bayes Text Classification?",
        "options": [
          "Spam filtering",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Naive Bayes Text Classification is Spam filtering."
      },
      {
        "question": "Why does the formula matter for Naive Bayes Text Classification?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Naive Bayes Text Classification?",
        "options": [
          "smoothing alpha",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is smoothing alpha."
      },
      {
        "question": "What is a common mistake when using Naive Bayes Text Classification?",
        "options": [
          "Using Gaussian NB for count text",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Using Gaussian NB for count text."
      }
    ]
  },
  "/ml/nlp/naive-bayes-spam": {
    "algorithmId": "natural-language-processing-classical-nlp-naive-bayes-text-classification",
    "sourceTitle": "Naive Bayes Text Classification",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Naive Bayes Text Classification: The Decision Gate",
        "story": "Kabir faces a real problem: a safety monitor must decide whether each case needs attention now or can wait. Naive Bayes Text Classification enters the story because it turns evidence into a class decision.",
        "simpleExplanation": "Naive Bayes is a probabilistic classifier that applies Bayes' theorem while assuming features are conditionally independent given the class. In kid-simple words, Naive Bayes Text Classification chooses a category. It studies labelled examples and learns the clues that separate one class from another.",
        "realtimeExample": "A realtime alert system classifies transactions, messages, defects, or support tickets for faster review.",
        "realtimeApplications": [
          "Spam filtering",
          "Document classification",
          "Sentiment baselines"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Naive Bayes Text Classification feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Naive Bayes Text Classification as a Simple Picture",
        "story": "Imagine a gate with colored lanes. Each new example is guided into the lane that best matches its evidence.",
        "simpleExplanation": "Each feature contributes evidence to each class, and the class with the largest posterior score wins. The model is not just saying yes or no; it is organizing evidence into a decision rule.",
        "realtimeExample": "In a classroom demo, students can use cards labelled safe/risky, healthy/sick, spam/not spam, or pass/review to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Spam filtering",
          "Document classification",
          "Sentiment baselines."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Naive Bayes Text Classification Works Step by Step",
        "story": "Kabir slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Estimate class priors 2. Estimate feature likelihoods per class 3. Apply smoothing 4. Sum log evidence for a new sample 5. Predict the class with highest posterior score",
        "realtimeExample": "A team balances precision, recall, fairness, and calibration before trusting the classifier.",
        "realtimeApplications": [
          "The mechanics are labels",
          "features",
          "decision boundary",
          "threshold",
          "and confusion-matrix tradeoffs."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Naive Bayes Text Classification",
        "story": "The math is a scoreboard for Kabir. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "argmax_c log P(c) + sum_j log P(x_j | c). The independence assumption makes likelihood estimation simple and fast.",
        "realtimeExample": "The formula creates a score or probability; the threshold turns that score into a final class.",
        "realtimeApplications": [
          "Important setting to inspect: smoothing alpha."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Naive Bayes Text Classification in Real Applications",
        "story": "Kabir finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Very fast. Watch-outs: Independence assumption is often false, Probability calibration can be poor, Feature likelihood choice matters. Common mistakes: Using Gaussian NB for count text, Ignoring correlated features, Forgetting smoothing.",
        "realtimeExample": "A model can score high overall while missing the rare class that matters most.",
        "realtimeApplications": [
          "Spam filtering",
          "Document classification",
          "Sentiment baselines. This powers fraud review",
          "medical triage",
          "moderation",
          "quality inspection",
          "and customer routing."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Naive Bayes Text Classification?",
        "options": [
          "Use it for fast probabilistic classification and as a strong baseline for text or count-like features. Focus on the v...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for fast probabilistic classification and as a strong baseline for text or count-like features. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Naive Bayes Text Classification?",
        "options": [
          "Spam filtering",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Naive Bayes Text Classification is Spam filtering."
      },
      {
        "question": "Why does the formula matter for Naive Bayes Text Classification?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Naive Bayes Text Classification?",
        "options": [
          "smoothing alpha",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is smoothing alpha."
      },
      {
        "question": "What is a common mistake when using Naive Bayes Text Classification?",
        "options": [
          "Using Gaussian NB for count text",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Using Gaussian NB for count text."
      }
    ]
  },
  "/ml/computer-vision/image-classification": {
    "algorithmId": "computer-vision-vision-tasks-and-models-image-classification",
    "sourceTitle": "Image Classification",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Image Classification: The Pattern Workshop",
        "story": "Diya faces a real problem: a team has data and needs a careful way to turn it into useful evidence. Image Classification enters the story because it gives the team a repeatable method for learning from examples.",
        "simpleExplanation": "Image Classification is a vision tasks and models concept in computer vision that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Image Classification transforms observations into a signal, estimate, representation, or decision.",
        "realtimeExample": "A practical ML workflow uses Image Classification as one candidate method, then compares it with baselines.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Image Classification feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Image Classification as a Simple Picture",
        "story": "It is like sorting a messy project table into labeled trays so each clue has a job.",
        "simpleExplanation": "Convert raw observations into a structured signal, fit it, and verify that it generalizes. The method works best when the input, objective, validation, and limitations are all clear.",
        "realtimeExample": "In a classroom demo, students can use small datasets where students define inputs, outputs, and a success metric to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Image Classification Works Step by Step",
        "story": "Diya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team prepares data, fits the method, checks intermediate outputs, validates results, and documents limits.",
        "realtimeApplications": [
          "The mechanics are inputs",
          "objective",
          "preprocessing",
          "model behavior",
          "and evaluation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Image Classification",
        "story": "The math is a scoreboard for Diya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation defines what the method considers a good solution.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Image Classification in Real Applications",
        "story": "Diya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A method can be mathematically correct but still solve the wrong real-world problem.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. This kind of thinking supports experimentation",
          "analytics",
          "automation",
          "and responsible ML delivery."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Image Classification?",
        "options": [
          "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior b...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Image Classification?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Image Classification is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Image Classification?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Image Classification?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Image Classification?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/computer-vision/object-detection-demo": {
    "algorithmId": "computer-vision-vision-tasks-and-models-object-detection",
    "sourceTitle": "Object Detection",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Object Detection: The Pattern Workshop",
        "story": "Diya faces a real problem: a team has data and needs a careful way to turn it into useful evidence. Object Detection enters the story because it gives the team a repeatable method for learning from examples.",
        "simpleExplanation": "Object Detection is a vision tasks and models concept in computer vision that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Object Detection transforms observations into a signal, estimate, representation, or decision.",
        "realtimeExample": "A practical ML workflow uses Object Detection as one candidate method, then compares it with baselines.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Object Detection feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Object Detection as a Simple Picture",
        "story": "It is like sorting a messy project table into labeled trays so each clue has a job.",
        "simpleExplanation": "Convert raw observations into a structured signal, fit it, and verify that it generalizes. The method works best when the input, objective, validation, and limitations are all clear.",
        "realtimeExample": "In a classroom demo, students can use small datasets where students define inputs, outputs, and a success metric to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Object Detection Works Step by Step",
        "story": "Diya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team prepares data, fits the method, checks intermediate outputs, validates results, and documents limits.",
        "realtimeApplications": [
          "The mechanics are inputs",
          "objective",
          "preprocessing",
          "model behavior",
          "and evaluation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Object Detection",
        "story": "The math is a scoreboard for Diya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation defines what the method considers a good solution.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Object Detection in Real Applications",
        "story": "Diya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A method can be mathematically correct but still solve the wrong real-world problem.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. This kind of thinking supports experimentation",
          "analytics",
          "automation",
          "and responsible ML delivery."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Object Detection?",
        "options": [
          "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior b...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Object Detection?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Object Detection is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Object Detection?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Object Detection?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Object Detection?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/computer-vision/grad-cam": {
    "algorithmId": "explainable-ai-explanation-methods-grad-cam",
    "sourceTitle": "Grad-CAM",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Grad-CAM: The Why Finder",
        "story": "Naveen faces a real problem: people need to understand why a model gave an answer. Grad-CAM enters the story because it traces predictions back to influential evidence.",
        "simpleExplanation": "Grad-CAM is a explanation methods concept in explainable ai that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Grad-CAM helps explain model behavior. It does not just ask what the answer is; it asks why.",
        "realtimeExample": "A review tool explains risk scores, image decisions, text predictions, or model behavior to experts.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Grad-CAM feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Grad-CAM as a Simple Picture",
        "story": "It is like highlighting the clues in a homework solution so another student can follow the reasoning.",
        "simpleExplanation": "Perturb or trace the prediction to measure which inputs changed it most. Explanation methods compare, perturb, trace, or visualize evidence that influenced a prediction.",
        "realtimeExample": "In a classroom demo, students can use a model answer where students cover one clue at a time and watch the decision change to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Grad-CAM Works Step by Step",
        "story": "Naveen slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team compares explanations with domain knowledge and checks whether users interpret them correctly.",
        "realtimeApplications": [
          "The mechanics are feature influence",
          "perturbation",
          "attribution",
          "local explanation",
          "and trust calibration."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Grad-CAM",
        "story": "The math is a scoreboard for Naveen. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation measures how changing or tracing evidence changes the prediction.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Grad-CAM in Real Applications",
        "story": "Naveen finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "An explanation can look convincing even when it is incomplete or misunderstood.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Explainability matters in healthcare",
          "finance",
          "safety",
          "debugging",
          "governance",
          "and education."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Grad-CAM?",
        "options": [
          "Use it to attribute a prediction to influential inputs or examples. Focus on the visible input-to-output behavior bef...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to attribute a prediction to influential inputs or examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Grad-CAM?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Grad-CAM is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Grad-CAM?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Grad-CAM?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Grad-CAM?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/recommendation/user-based-cf": {
    "algorithmId": "recommendation-algorithms-recommenders-user-based-collaborative-filtering",
    "sourceTitle": "User-Based Collaborative Filtering",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "User-Based Collaborative Filtering: The Helpful Ranker",
        "story": "Sana faces a real problem: a user has too many choices and needs the most useful items first. User-Based Collaborative Filtering enters the story because it predicts relevance and ranks options.",
        "simpleExplanation": "User-Based Collaborative Filtering is a recommenders concept in recommendation algorithms that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, User-Based Collaborative Filtering helps choose what to show next. It learns from users, items, content, and feedback.",
        "realtimeExample": "A media, shopping, or learning app ranks products, videos, lessons, or articles.",
        "realtimeApplications": [
          "Product ranking",
          "Media discovery",
          "Personalized feeds"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes User-Based Collaborative Filtering feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "User-Based Collaborative Filtering as a Simple Picture",
        "story": "It is like a librarian who learns your taste but must still show useful variety.",
        "simpleExplanation": "Place users and items in a shared preference space, then rank nearby candidates. A recommender estimates fit between a person, context, and item, then creates a ranked list.",
        "realtimeExample": "In a classroom demo, students can use students rating books or songs, then finding similar users or items to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Product ranking",
          "Media discovery",
          "Personalized feeds."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How User-Based Collaborative Filtering Works Step by Step",
        "story": "Sana slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team checks relevance, diversity, cold start, feedback loops, and fairness before deployment.",
        "realtimeApplications": [
          "The mechanics are user signals",
          "item features",
          "similarity",
          "ranking score",
          "and evaluation metrics."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind User-Based Collaborative Filtering",
        "story": "The math is a scoreboard for Sana. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation scores user-item fit or learns shared hidden factors.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "User-Based Collaborative Filtering in Real Applications",
        "story": "Sana finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A recommender can trap users in narrow loops if it only repeats old behavior.",
        "realtimeApplications": [
          "Product ranking",
          "Media discovery",
          "Personalized feeds. Recommendation work appears in commerce",
          "media",
          "education",
          "search",
          "and personalization systems."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of User-Based Collaborative Filtering?",
        "options": [
          "Use it to rank items by expected relevance. Focus on the visible input-to-output behavior before the notation.",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to rank items by expected relevance. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches User-Based Collaborative Filtering?",
        "options": [
          "Product ranking",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of User-Based Collaborative Filtering is Product ranking."
      },
      {
        "question": "Why does the formula matter for User-Based Collaborative Filtering?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for User-Based Collaborative Filtering?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using User-Based Collaborative Filtering?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/recommendation/item-based-cf": {
    "algorithmId": "recommendation-algorithms-recommenders-item-based-collaborative-filtering",
    "sourceTitle": "Item-Based Collaborative Filtering",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Item-Based Collaborative Filtering: The Helpful Ranker",
        "story": "Sana faces a real problem: a user has too many choices and needs the most useful items first. Item-Based Collaborative Filtering enters the story because it predicts relevance and ranks options.",
        "simpleExplanation": "Item-Based Collaborative Filtering is a recommenders concept in recommendation algorithms that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Item-Based Collaborative Filtering helps choose what to show next. It learns from users, items, content, and feedback.",
        "realtimeExample": "A media, shopping, or learning app ranks products, videos, lessons, or articles.",
        "realtimeApplications": [
          "Product ranking",
          "Media discovery",
          "Personalized feeds"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Item-Based Collaborative Filtering feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Item-Based Collaborative Filtering as a Simple Picture",
        "story": "It is like a librarian who learns your taste but must still show useful variety.",
        "simpleExplanation": "Place users and items in a shared preference space, then rank nearby candidates. A recommender estimates fit between a person, context, and item, then creates a ranked list.",
        "realtimeExample": "In a classroom demo, students can use students rating books or songs, then finding similar users or items to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Product ranking",
          "Media discovery",
          "Personalized feeds."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Item-Based Collaborative Filtering Works Step by Step",
        "story": "Sana slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team checks relevance, diversity, cold start, feedback loops, and fairness before deployment.",
        "realtimeApplications": [
          "The mechanics are user signals",
          "item features",
          "similarity",
          "ranking score",
          "and evaluation metrics."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Item-Based Collaborative Filtering",
        "story": "The math is a scoreboard for Sana. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation scores user-item fit or learns shared hidden factors.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Item-Based Collaborative Filtering in Real Applications",
        "story": "Sana finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A recommender can trap users in narrow loops if it only repeats old behavior.",
        "realtimeApplications": [
          "Product ranking",
          "Media discovery",
          "Personalized feeds. Recommendation work appears in commerce",
          "media",
          "education",
          "search",
          "and personalization systems."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Item-Based Collaborative Filtering?",
        "options": [
          "Use it to rank items by expected relevance. Focus on the visible input-to-output behavior before the notation.",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to rank items by expected relevance. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Item-Based Collaborative Filtering?",
        "options": [
          "Product ranking",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Item-Based Collaborative Filtering is Product ranking."
      },
      {
        "question": "Why does the formula matter for Item-Based Collaborative Filtering?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Item-Based Collaborative Filtering?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Item-Based Collaborative Filtering?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/recommendation/matrix-factorization": {
    "algorithmId": "recommendation-algorithms-recommenders-matrix-factorization",
    "sourceTitle": "Matrix Factorization",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Matrix Factorization: The Helpful Ranker",
        "story": "Sana faces a real problem: a user has too many choices and needs the most useful items first. Matrix Factorization enters the story because it predicts relevance and ranks options.",
        "simpleExplanation": "Matrix Factorization is a recommenders concept in recommendation algorithms that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Matrix Factorization helps choose what to show next. It learns from users, items, content, and feedback.",
        "realtimeExample": "A media, shopping, or learning app ranks products, videos, lessons, or articles.",
        "realtimeApplications": [
          "Product ranking",
          "Media discovery",
          "Personalized feeds"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Matrix Factorization feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Matrix Factorization as a Simple Picture",
        "story": "It is like a librarian who learns your taste but must still show useful variety.",
        "simpleExplanation": "Place users and items in a shared preference space, then rank nearby candidates. A recommender estimates fit between a person, context, and item, then creates a ranked list.",
        "realtimeExample": "In a classroom demo, students can use students rating books or songs, then finding similar users or items to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Product ranking",
          "Media discovery",
          "Personalized feeds."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Matrix Factorization Works Step by Step",
        "story": "Sana slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team checks relevance, diversity, cold start, feedback loops, and fairness before deployment.",
        "realtimeApplications": [
          "The mechanics are user signals",
          "item features",
          "similarity",
          "ranking score",
          "and evaluation metrics."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Matrix Factorization",
        "story": "The math is a scoreboard for Sana. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation scores user-item fit or learns shared hidden factors.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Matrix Factorization in Real Applications",
        "story": "Sana finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A recommender can trap users in narrow loops if it only repeats old behavior.",
        "realtimeApplications": [
          "Product ranking",
          "Media discovery",
          "Personalized feeds. Recommendation work appears in commerce",
          "media",
          "education",
          "search",
          "and personalization systems."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Matrix Factorization?",
        "options": [
          "Use it to rank items by expected relevance. Focus on the visible input-to-output behavior before the notation.",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to rank items by expected relevance. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Matrix Factorization?",
        "options": [
          "Product ranking",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Matrix Factorization is Product ranking."
      },
      {
        "question": "Why does the formula matter for Matrix Factorization?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Matrix Factorization?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Matrix Factorization?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/recommendation/content-based": {
    "algorithmId": "recommendation-algorithms-recommenders-content-based-filtering",
    "sourceTitle": "Content-Based Filtering",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Content-Based Filtering: The Helpful Ranker",
        "story": "Sana faces a real problem: a user has too many choices and needs the most useful items first. Content-Based Filtering enters the story because it predicts relevance and ranks options.",
        "simpleExplanation": "Content-Based Filtering is a recommenders concept in recommendation algorithms that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Content-Based Filtering helps choose what to show next. It learns from users, items, content, and feedback.",
        "realtimeExample": "A media, shopping, or learning app ranks products, videos, lessons, or articles.",
        "realtimeApplications": [
          "Product ranking",
          "Media discovery",
          "Personalized feeds"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Content-Based Filtering feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Content-Based Filtering as a Simple Picture",
        "story": "It is like a librarian who learns your taste but must still show useful variety.",
        "simpleExplanation": "Place users and items in a shared preference space, then rank nearby candidates. A recommender estimates fit between a person, context, and item, then creates a ranked list.",
        "realtimeExample": "In a classroom demo, students can use students rating books or songs, then finding similar users or items to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Product ranking",
          "Media discovery",
          "Personalized feeds."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Content-Based Filtering Works Step by Step",
        "story": "Sana slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team checks relevance, diversity, cold start, feedback loops, and fairness before deployment.",
        "realtimeApplications": [
          "The mechanics are user signals",
          "item features",
          "similarity",
          "ranking score",
          "and evaluation metrics."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Content-Based Filtering",
        "story": "The math is a scoreboard for Sana. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation scores user-item fit or learns shared hidden factors.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Content-Based Filtering in Real Applications",
        "story": "Sana finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A recommender can trap users in narrow loops if it only repeats old behavior.",
        "realtimeApplications": [
          "Product ranking",
          "Media discovery",
          "Personalized feeds. Recommendation work appears in commerce",
          "media",
          "education",
          "search",
          "and personalization systems."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Content-Based Filtering?",
        "options": [
          "Use it to rank items by expected relevance. Focus on the visible input-to-output behavior before the notation.",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to rank items by expected relevance. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Content-Based Filtering?",
        "options": [
          "Product ranking",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Content-Based Filtering is Product ranking."
      },
      {
        "question": "Why does the formula matter for Content-Based Filtering?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Content-Based Filtering?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Content-Based Filtering?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/reinforcement-learning/multi-armed-bandit": {
    "algorithmId": "reinforcement-learning-classical-rl-multi-armed-bandit",
    "sourceTitle": "Multi-Armed Bandit",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Multi-Armed Bandit: The Reward Explorer",
        "story": "Maya faces a real problem: an agent must learn what to do by trying actions and seeing rewards. Multi-Armed Bandit enters the story because it improves decisions through interaction, feedback, and long-term reward.",
        "simpleExplanation": "Multi-Armed Bandit is a classical rl concept in reinforcement learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Multi-Armed Bandit studies action. The learner tries, observes rewards, and improves its policy over time.",
        "realtimeExample": "A simulation system learns routing, control, resource allocation, or game strategy from repeated trials.",
        "realtimeApplications": [
          "Control",
          "Resource allocation",
          "Simulation-based planning"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Multi-Armed Bandit feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Multi-Armed Bandit as a Simple Picture",
        "story": "It is like learning a maze: one step may look good now, but the best route considers what happens later.",
        "simpleExplanation": "Actions that lead to useful future rewards become more valuable through repeated experience. The algorithm balances exploration of uncertain actions with exploitation of actions that already seem useful.",
        "realtimeExample": "In a classroom demo, students can use a grid game where students move a token, collect rewards, and avoid penalties to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Control",
          "Resource allocation",
          "Simulation-based planning."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Multi-Armed Bandit Works Step by Step",
        "story": "Maya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Observe the state 2. Choose an action 3. Receive reward and next state 4. Update value or policy 5. Repeat with controlled exploration",
        "realtimeExample": "A team defines rewards carefully, tests in simulation, watches unsafe behavior, and evaluates policies separately.",
        "realtimeApplications": [
          "The mechanics are state",
          "action",
          "reward",
          "policy",
          "value",
          "discounting",
          "and exploration."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Multi-Armed Bandit",
        "story": "The math is a scoreboard for Maya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation updates beliefs about action value using reward plus expected future value.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Multi-Armed Bandit in Real Applications",
        "story": "Maya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A badly designed reward can teach the agent to win the score while failing the real goal.",
        "realtimeApplications": [
          "Control",
          "Resource allocation",
          "Simulation-based planning. RL thinking appears in robotics",
          "operations research",
          "games",
          "recommender systems",
          "and control."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Multi-Armed Bandit?",
        "options": [
          "Use it to choose actions that maximize long-term reward. Focus on the visible input-to-output behavior before the not...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to choose actions that maximize long-term reward. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Multi-Armed Bandit?",
        "options": [
          "Control",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Multi-Armed Bandit is Control."
      },
      {
        "question": "Why does the formula matter for Multi-Armed Bandit?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Multi-Armed Bandit?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Multi-Armed Bandit?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/reinforcement-learning/q-learning-grid-world": {
    "algorithmId": "reinforcement-learning-classical-rl-q-learning",
    "sourceTitle": "Q-Learning",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Q-Learning: The Reward Explorer",
        "story": "Maya faces a real problem: an agent must learn what to do by trying actions and seeing rewards. Q-Learning enters the story because it improves decisions through interaction, feedback, and long-term reward.",
        "simpleExplanation": "Q-Learning is a classical rl concept in reinforcement learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Q-Learning studies action. The learner tries, observes rewards, and improves its policy over time.",
        "realtimeExample": "A simulation system learns routing, control, resource allocation, or game strategy from repeated trials.",
        "realtimeApplications": [
          "Control",
          "Resource allocation",
          "Simulation-based planning"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Q-Learning feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Q-Learning as a Simple Picture",
        "story": "It is like learning a maze: one step may look good now, but the best route considers what happens later.",
        "simpleExplanation": "Actions that lead to useful future rewards become more valuable through repeated experience. The algorithm balances exploration of uncertain actions with exploitation of actions that already seem useful.",
        "realtimeExample": "In a classroom demo, students can use a grid game where students move a token, collect rewards, and avoid penalties to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Control",
          "Resource allocation",
          "Simulation-based planning."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Q-Learning Works Step by Step",
        "story": "Maya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Observe the state 2. Choose an action 3. Receive reward and next state 4. Update value or policy 5. Repeat with controlled exploration",
        "realtimeExample": "A team defines rewards carefully, tests in simulation, watches unsafe behavior, and evaluates policies separately.",
        "realtimeApplications": [
          "The mechanics are state",
          "action",
          "reward",
          "policy",
          "value",
          "discounting",
          "and exploration."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Q-Learning",
        "story": "The math is a scoreboard for Maya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "Q(s,a) <- Q(s,a) + alpha [r + gamma max Q(s',a') - Q(s,a)]. The temporal-difference target combines immediate reward with discounted future value.",
        "realtimeExample": "The equation updates beliefs about action value using reward plus expected future value.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Q-Learning in Real Applications",
        "story": "Maya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A badly designed reward can teach the agent to win the score while failing the real goal.",
        "realtimeApplications": [
          "Control",
          "Resource allocation",
          "Simulation-based planning. RL thinking appears in robotics",
          "operations research",
          "games",
          "recommender systems",
          "and control."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Q-Learning?",
        "options": [
          "Use it to choose actions that maximize long-term reward. Focus on the visible input-to-output behavior before the not...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to choose actions that maximize long-term reward. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Q-Learning?",
        "options": [
          "Control",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Q-Learning is Control."
      },
      {
        "question": "Why does the formula matter for Q-Learning?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Q-Learning?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Q-Learning?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/reinforcement-learning/markov-decision-process": {
    "algorithmId": "reinforcement-learning-fundamentals-markov-decision-process",
    "sourceTitle": "Markov Decision Process",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Markov Decision Process: The Time Clue Keeper",
        "story": "Arjun faces a real problem: the answer depends on what happened before, not just what is happening now. Markov Decision Process enters the story because it models ordered information across time or tokens.",
        "simpleExplanation": "Markov Decision Process is a fundamentals concept in reinforcement learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Markov Decision Process studies sequences. Earlier clues can change the meaning of later clues.",
        "realtimeExample": "A monitoring system forecasts demand, detects machine trouble, or understands language from ordered signals.",
        "realtimeApplications": [
          "Language understanding",
          "Sequence forecasting",
          "Document retrieval"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Markov Decision Process feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Markov Decision Process as a Simple Picture",
        "story": "It is like reading a story: the current sentence makes more sense when you remember the previous sentences.",
        "simpleExplanation": "Carry a compact state forward so the current output can use earlier context. The model keeps, updates, or attends to context so the next prediction uses history.",
        "realtimeExample": "In a classroom demo, students can use daily temperatures, word cards, music notes, or sensor readings arranged in order to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Language understanding",
          "Sequence forecasting",
          "Document retrieval."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Markov Decision Process Works Step by Step",
        "story": "Arjun slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Encode the input 2. Run the forward pass 3. Compute task loss 4. Backpropagate gradients 5. Update weights and validate",
        "realtimeExample": "A team builds time windows, prevents future leakage, validates by time order, and checks drift.",
        "realtimeApplications": [
          "The mechanics are sequence order",
          "hidden state or context",
          "window length",
          "leakage control",
          "and forecast error."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Markov Decision Process",
        "story": "The math is a scoreboard for Arjun. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation updates memory or attention from one step to the next, then predicts from that context.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Markov Decision Process in Real Applications",
        "story": "Arjun finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "If future values leak into training, the model looks brilliant in practice and weak in real deployment.",
        "realtimeApplications": [
          "Language understanding",
          "Sequence forecasting",
          "Document retrieval. Sequence thinking powers forecasting",
          "language tools",
          "speech",
          "sensors",
          "finance",
          "and operations monitoring."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Markov Decision Process?",
        "options": [
          "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Markov Decision Process?",
        "options": [
          "Language understanding",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Markov Decision Process is Language understanding."
      },
      {
        "question": "Why does the formula matter for Markov Decision Process?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Markov Decision Process?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Markov Decision Process?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/explainability/feature-importance": {
    "algorithmId": "explainable-ai-explanation-methods-feature-importance",
    "sourceTitle": "Feature Importance",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Feature Importance: The Why Finder",
        "story": "Naveen faces a real problem: people need to understand why a model gave an answer. Feature Importance enters the story because it traces predictions back to influential evidence.",
        "simpleExplanation": "Feature Importance is a explanation methods concept in explainable ai that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Feature Importance helps explain model behavior. It does not just ask what the answer is; it asks why.",
        "realtimeExample": "A review tool explains risk scores, image decisions, text predictions, or model behavior to experts.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Feature Importance feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Feature Importance as a Simple Picture",
        "story": "It is like highlighting the clues in a homework solution so another student can follow the reasoning.",
        "simpleExplanation": "Perturb or trace the prediction to measure which inputs changed it most. Explanation methods compare, perturb, trace, or visualize evidence that influenced a prediction.",
        "realtimeExample": "In a classroom demo, students can use a model answer where students cover one clue at a time and watch the decision change to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Feature Importance Works Step by Step",
        "story": "Naveen slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team compares explanations with domain knowledge and checks whether users interpret them correctly.",
        "realtimeApplications": [
          "The mechanics are feature influence",
          "perturbation",
          "attribution",
          "local explanation",
          "and trust calibration."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Feature Importance",
        "story": "The math is a scoreboard for Naveen. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation measures how changing or tracing evidence changes the prediction.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Feature Importance in Real Applications",
        "story": "Naveen finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "An explanation can look convincing even when it is incomplete or misunderstood.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Explainability matters in healthcare",
          "finance",
          "safety",
          "debugging",
          "governance",
          "and education."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Feature Importance?",
        "options": [
          "Use it to attribute a prediction to influential inputs or examples. Focus on the visible input-to-output behavior bef...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to attribute a prediction to influential inputs or examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Feature Importance?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Feature Importance is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Feature Importance?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Feature Importance?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Feature Importance?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/explainability/partial-dependence-plot": {
    "algorithmId": "explainable-ai-explanation-methods-partial-dependence-plot",
    "sourceTitle": "Partial Dependence Plot",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Partial Dependence Plot: The Why Finder",
        "story": "Naveen faces a real problem: people need to understand why a model gave an answer. Partial Dependence Plot enters the story because it traces predictions back to influential evidence.",
        "simpleExplanation": "Partial Dependence Plot is a explanation methods concept in explainable ai that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Partial Dependence Plot helps explain model behavior. It does not just ask what the answer is; it asks why.",
        "realtimeExample": "A review tool explains risk scores, image decisions, text predictions, or model behavior to experts.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Partial Dependence Plot feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Partial Dependence Plot as a Simple Picture",
        "story": "It is like highlighting the clues in a homework solution so another student can follow the reasoning.",
        "simpleExplanation": "Perturb or trace the prediction to measure which inputs changed it most. Explanation methods compare, perturb, trace, or visualize evidence that influenced a prediction.",
        "realtimeExample": "In a classroom demo, students can use a model answer where students cover one clue at a time and watch the decision change to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Partial Dependence Plot Works Step by Step",
        "story": "Naveen slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team compares explanations with domain knowledge and checks whether users interpret them correctly.",
        "realtimeApplications": [
          "The mechanics are feature influence",
          "perturbation",
          "attribution",
          "local explanation",
          "and trust calibration."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Partial Dependence Plot",
        "story": "The math is a scoreboard for Naveen. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation measures how changing or tracing evidence changes the prediction.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Partial Dependence Plot in Real Applications",
        "story": "Naveen finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "An explanation can look convincing even when it is incomplete or misunderstood.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Explainability matters in healthcare",
          "finance",
          "safety",
          "debugging",
          "governance",
          "and education."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Partial Dependence Plot?",
        "options": [
          "Use it to attribute a prediction to influential inputs or examples. Focus on the visible input-to-output behavior bef...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to attribute a prediction to influential inputs or examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Partial Dependence Plot?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Partial Dependence Plot is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Partial Dependence Plot?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Partial Dependence Plot?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Partial Dependence Plot?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/explainability/shap-concept": {
    "algorithmId": "explainable-ai-explanation-methods-shap",
    "sourceTitle": "SHAP",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "SHAP: The Why Finder",
        "story": "Naveen faces a real problem: people need to understand why a model gave an answer. SHAP enters the story because it traces predictions back to influential evidence.",
        "simpleExplanation": "SHAP is a explanation methods concept in explainable ai that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, SHAP helps explain model behavior. It does not just ask what the answer is; it asks why.",
        "realtimeExample": "A review tool explains risk scores, image decisions, text predictions, or model behavior to experts.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes SHAP feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "SHAP as a Simple Picture",
        "story": "It is like highlighting the clues in a homework solution so another student can follow the reasoning.",
        "simpleExplanation": "Perturb or trace the prediction to measure which inputs changed it most. Explanation methods compare, perturb, trace, or visualize evidence that influenced a prediction.",
        "realtimeExample": "In a classroom demo, students can use a model answer where students cover one clue at a time and watch the decision change to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How SHAP Works Step by Step",
        "story": "Naveen slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team compares explanations with domain knowledge and checks whether users interpret them correctly.",
        "realtimeApplications": [
          "The mechanics are feature influence",
          "perturbation",
          "attribution",
          "local explanation",
          "and trust calibration."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind SHAP",
        "story": "The math is a scoreboard for Naveen. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation measures how changing or tracing evidence changes the prediction.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "SHAP in Real Applications",
        "story": "Naveen finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "An explanation can look convincing even when it is incomplete or misunderstood.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Explainability matters in healthcare",
          "finance",
          "safety",
          "debugging",
          "governance",
          "and education."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of SHAP?",
        "options": [
          "Use it to attribute a prediction to influential inputs or examples. Focus on the visible input-to-output behavior bef...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to attribute a prediction to influential inputs or examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches SHAP?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of SHAP is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for SHAP?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for SHAP?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using SHAP?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/explainability/lime-concept": {
    "algorithmId": "explainable-ai-explanation-methods-lime",
    "sourceTitle": "LIME",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "LIME: The Why Finder",
        "story": "Naveen faces a real problem: people need to understand why a model gave an answer. LIME enters the story because it traces predictions back to influential evidence.",
        "simpleExplanation": "LIME is a explanation methods concept in explainable ai that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, LIME helps explain model behavior. It does not just ask what the answer is; it asks why.",
        "realtimeExample": "A review tool explains risk scores, image decisions, text predictions, or model behavior to experts.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes LIME feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "LIME as a Simple Picture",
        "story": "It is like highlighting the clues in a homework solution so another student can follow the reasoning.",
        "simpleExplanation": "Perturb or trace the prediction to measure which inputs changed it most. Explanation methods compare, perturb, trace, or visualize evidence that influenced a prediction.",
        "realtimeExample": "In a classroom demo, students can use a model answer where students cover one clue at a time and watch the decision change to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How LIME Works Step by Step",
        "story": "Naveen slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team compares explanations with domain knowledge and checks whether users interpret them correctly.",
        "realtimeApplications": [
          "The mechanics are feature influence",
          "perturbation",
          "attribution",
          "local explanation",
          "and trust calibration."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind LIME",
        "story": "The math is a scoreboard for Naveen. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation measures how changing or tracing evidence changes the prediction.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "LIME in Real Applications",
        "story": "Naveen finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "An explanation can look convincing even when it is incomplete or misunderstood.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Explainability matters in healthcare",
          "finance",
          "safety",
          "debugging",
          "governance",
          "and education."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of LIME?",
        "options": [
          "Use it to attribute a prediction to influential inputs or examples. Focus on the visible input-to-output behavior bef...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to attribute a prediction to influential inputs or examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches LIME?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of LIME is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for LIME?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for LIME?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using LIME?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/optimization/gradient-descent": {
    "algorithmId": "deep-learning-neural-network-fundamentals-gradient-descent",
    "sourceTitle": "Gradient Descent",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Gradient Descent: The Representation Builder",
        "story": "Ravi faces a real problem: raw data is too messy, so the system must build better internal clues. Gradient Descent enters the story because it learns layered or structured representations from examples.",
        "simpleExplanation": "Gradient Descent is a neural network fundamentals concept in deep learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Gradient Descent learns intermediate representations. Those hidden representations make hard patterns easier to use.",
        "realtimeExample": "A model learns embeddings, reconstructions, generated samples, graph signals, or nonlinear predictions.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Gradient Descent feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Gradient Descent as a Simple Picture",
        "story": "It is like a workshop where each station improves the raw material before the final decision is made.",
        "simpleExplanation": "Convert raw observations into a structured signal, fit it, and verify that it generalizes. Layers, bottlenecks, graph messages, or generators transform data into more useful forms.",
        "realtimeExample": "In a classroom demo, students can use students passing cards through stations that each add, remove, or combine clues to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Gradient Descent Works Step by Step",
        "story": "Ravi slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Encode the input 2. Run the forward pass 3. Compute task loss 4. Backpropagate gradients 5. Update weights and validate",
        "realtimeExample": "A team defines the objective, watches training curves, validates outputs, and inspects failure cases.",
        "realtimeApplications": [
          "The mechanics are representation",
          "loss",
          "capacity",
          "regularization",
          "optimization",
          "and validation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Gradient Descent",
        "story": "The math is a scoreboard for Ravi. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "h_(l+1) = phi(W_l h_l + b_l). Each layer applies an affine transform followed by a non-linear activation.",
        "realtimeExample": "The equation describes how hidden states or samples are transformed and judged by an objective.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Gradient Descent in Real Applications",
        "story": "Ravi finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A powerful representation can memorize training examples or create plausible but wrong outputs.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Representation learning supports deep learning",
          "anomaly detection",
          "generation",
          "graph analytics",
          "and embeddings."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Gradient Descent?",
        "options": [
          "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Gradient Descent?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Gradient Descent is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Gradient Descent?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Gradient Descent?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Gradient Descent?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/optimization/sgd": {
    "algorithmId": "deep-learning-neural-network-fundamentals-stochastic-gradient-descent",
    "sourceTitle": "Stochastic Gradient Descent",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Stochastic Gradient Descent: The Representation Builder",
        "story": "Ravi faces a real problem: raw data is too messy, so the system must build better internal clues. Stochastic Gradient Descent enters the story because it learns layered or structured representations from examples.",
        "simpleExplanation": "Stochastic Gradient Descent is a neural network fundamentals concept in deep learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Stochastic Gradient Descent learns intermediate representations. Those hidden representations make hard patterns easier to use.",
        "realtimeExample": "A model learns embeddings, reconstructions, generated samples, graph signals, or nonlinear predictions.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Stochastic Gradient Descent feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Stochastic Gradient Descent as a Simple Picture",
        "story": "It is like a workshop where each station improves the raw material before the final decision is made.",
        "simpleExplanation": "Convert raw observations into a structured signal, fit it, and verify that it generalizes. Layers, bottlenecks, graph messages, or generators transform data into more useful forms.",
        "realtimeExample": "In a classroom demo, students can use students passing cards through stations that each add, remove, or combine clues to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Stochastic Gradient Descent Works Step by Step",
        "story": "Ravi slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Encode the input 2. Run the forward pass 3. Compute task loss 4. Backpropagate gradients 5. Update weights and validate",
        "realtimeExample": "A team defines the objective, watches training curves, validates outputs, and inspects failure cases.",
        "realtimeApplications": [
          "The mechanics are representation",
          "loss",
          "capacity",
          "regularization",
          "optimization",
          "and validation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Stochastic Gradient Descent",
        "story": "The math is a scoreboard for Ravi. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "h_(l+1) = phi(W_l h_l + b_l). Each layer applies an affine transform followed by a non-linear activation.",
        "realtimeExample": "The equation describes how hidden states or samples are transformed and judged by an objective.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Stochastic Gradient Descent in Real Applications",
        "story": "Ravi finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A powerful representation can memorize training examples or create plausible but wrong outputs.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Representation learning supports deep learning",
          "anomaly detection",
          "generation",
          "graph analytics",
          "and embeddings."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Stochastic Gradient Descent?",
        "options": [
          "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Stochastic Gradient Descent?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Stochastic Gradient Descent is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Stochastic Gradient Descent?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Stochastic Gradient Descent?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Stochastic Gradient Descent?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/optimization/momentum": {
    "algorithmId": "optimization-algorithms-optimizers-momentum",
    "sourceTitle": "Momentum",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Momentum: The Better-Answer Climber",
        "story": "Omar faces a real problem: a model has many adjustable knobs and needs a careful way to improve them. Momentum enters the story because it moves parameters toward a better objective.",
        "simpleExplanation": "Momentum is a optimizers concept in optimization algorithms that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Momentum is about improvement. It changes parameters to reduce loss or increase a useful score.",
        "realtimeExample": "A training pipeline tunes model weights, schedules, or parameters until validation metrics improve.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Momentum feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Momentum as a Simple Picture",
        "story": "Imagine walking downhill in fog: each step uses the local slope, and step size matters.",
        "simpleExplanation": "Follow the local slope downhill while controlling step size and momentum. Optimization is the engine that turns feedback into parameter updates.",
        "realtimeExample": "In a classroom demo, students can use a simple hill drawing where students choose step sizes and watch overshoot or slow progress to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Momentum Works Step by Step",
        "story": "Omar slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team monitors loss curves, step size, stability, stopping rules, and overfitting.",
        "realtimeApplications": [
          "The mechanics are objective",
          "gradient or search move",
          "learning rate",
          "momentum",
          "and convergence."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Momentum",
        "story": "The math is a scoreboard for Omar. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta_(t+1) = theta_t - alpha * grad J(theta_t). The learning rate controls how far parameters move against the local gradient.",
        "realtimeExample": "The equation says how to move from current parameters to hopefully better parameters.",
        "realtimeApplications": [
          "Important setting to inspect: Learning rate."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Momentum in Real Applications",
        "story": "Omar finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A step that is too large can jump past good solutions; a step too small can waste time.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Optimization appears in every serious ML training system",
          "from linear models to deep networks."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Momentum?",
        "options": [
          "Use it to move model parameters toward a lower objective value. Focus on the visible input-to-output behavior before...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to move model parameters toward a lower objective value. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Momentum?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Momentum is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Momentum?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Momentum?",
        "options": [
          "Learning rate",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Learning rate."
      },
      {
        "question": "What is a common mistake when using Momentum?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/optimization/adam": {
    "algorithmId": "optimization-algorithms-optimizers-adam",
    "sourceTitle": "Adam",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Adam: The Better-Answer Climber",
        "story": "Omar faces a real problem: a model has many adjustable knobs and needs a careful way to improve them. Adam enters the story because it moves parameters toward a better objective.",
        "simpleExplanation": "Adam is a optimizers concept in optimization algorithms that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Adam is about improvement. It changes parameters to reduce loss or increase a useful score.",
        "realtimeExample": "A training pipeline tunes model weights, schedules, or parameters until validation metrics improve.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Adam feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Adam as a Simple Picture",
        "story": "Imagine walking downhill in fog: each step uses the local slope, and step size matters.",
        "simpleExplanation": "Follow the local slope downhill while controlling step size and momentum. Optimization is the engine that turns feedback into parameter updates.",
        "realtimeExample": "In a classroom demo, students can use a simple hill drawing where students choose step sizes and watch overshoot or slow progress to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Adam Works Step by Step",
        "story": "Omar slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team monitors loss curves, step size, stability, stopping rules, and overfitting.",
        "realtimeApplications": [
          "The mechanics are objective",
          "gradient or search move",
          "learning rate",
          "momentum",
          "and convergence."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Adam",
        "story": "The math is a scoreboard for Omar. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta_(t+1) = theta_t - alpha * grad J(theta_t). The learning rate controls how far parameters move against the local gradient.",
        "realtimeExample": "The equation says how to move from current parameters to hopefully better parameters.",
        "realtimeApplications": [
          "Important setting to inspect: Learning rate."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Adam in Real Applications",
        "story": "Omar finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A step that is too large can jump past good solutions; a step too small can waste time.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Optimization appears in every serious ML training system",
          "from linear models to deep networks."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Adam?",
        "options": [
          "Use it to move model parameters toward a lower objective value. Focus on the visible input-to-output behavior before...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to move model parameters toward a lower objective value. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Adam?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Adam is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Adam?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Adam?",
        "options": [
          "Learning rate",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Learning rate."
      },
      {
        "question": "What is a common mistake when using Adam?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/ensemble/bagging": {
    "algorithmId": "ensemble-learning-bagging-bagging",
    "sourceTitle": "Bagging",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Bagging: The Pattern Workshop",
        "story": "Diya faces a real problem: a team has data and needs a careful way to turn it into useful evidence. Bagging enters the story because it gives the team a repeatable method for learning from examples.",
        "simpleExplanation": "Bagging is a bagging concept in ensemble learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Bagging transforms observations into a signal, estimate, representation, or decision.",
        "realtimeExample": "A practical ML workflow uses Bagging as one candidate method, then compares it with baselines.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Bagging feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Bagging as a Simple Picture",
        "story": "It is like sorting a messy project table into labeled trays so each clue has a job.",
        "simpleExplanation": "Convert raw observations into a structured signal, fit it, and verify that it generalizes. The method works best when the input, objective, validation, and limitations are all clear.",
        "realtimeExample": "In a classroom demo, students can use small datasets where students define inputs, outputs, and a success metric to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Bagging Works Step by Step",
        "story": "Diya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team prepares data, fits the method, checks intermediate outputs, validates results, and documents limits.",
        "realtimeApplications": [
          "The mechanics are inputs",
          "objective",
          "preprocessing",
          "model behavior",
          "and evaluation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Bagging",
        "story": "The math is a scoreboard for Diya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation defines what the method considers a good solution.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Bagging in Real Applications",
        "story": "Diya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A method can be mathematically correct but still solve the wrong real-world problem.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. This kind of thinking supports experimentation",
          "analytics",
          "automation",
          "and responsible ML delivery."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Bagging?",
        "options": [
          "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior b...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Bagging?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Bagging is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Bagging?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Bagging?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Bagging?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/ensemble/boosting": {
    "algorithmId": "supervised-learning-classification-gradient-boosting",
    "sourceTitle": "Gradient Boosting",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Gradient Boosting: The Question Path",
        "story": "Ishaan faces a real problem: a team needs a decision that people can inspect step by step. Gradient Boosting enters the story because it builds answers from clear branching questions.",
        "simpleExplanation": "Gradient Boosting builds an additive ensemble of weak learners, usually trees, where each new learner corrects current errors. In kid-simple words, Gradient Boosting asks useful questions about features and uses the answers to reach a prediction.",
        "realtimeExample": "A business rule assistant explains why a case was approved, flagged, grouped, or predicted.",
        "realtimeApplications": [
          "Tabular regression",
          "Ranking",
          "Classification baselines"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Gradient Boosting feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Gradient Boosting as a Simple Picture",
        "story": "It feels like a choose-your-path story where every branch makes the group cleaner.",
        "simpleExplanation": "The model starts simple, then repeatedly adds small trees that point in the direction of lower loss. Each split should reduce confusion. Too many splits can memorize noise.",
        "realtimeExample": "In a classroom demo, students can use paper cards sorted by yes/no questions like age, color, score, or size to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Tabular regression",
          "Ranking",
          "Classification baselines."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Gradient Boosting Works Step by Step",
        "story": "Ishaan slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Start with a baseline prediction 2. Compute residuals or negative gradients 3. Fit a weak learner to those errors 4. Add it with a learning rate 5. Repeat and validate stage count",
        "realtimeExample": "A team controls depth, checks leaf sizes, compares validation results, and watches for leakage.",
        "realtimeApplications": [
          "The mechanics are split candidates",
          "impurity",
          "branches",
          "leaves",
          "ensembles when used",
          "and overfit control."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Gradient Boosting",
        "story": "The math is a scoreboard for Ishaan. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "F_m(x) = F_(m-1)(x) + eta * h_m(x). Each stage adds a small correction to the current model.",
        "realtimeExample": "The equation scores how much a split improves the child groups compared with the parent group.",
        "realtimeApplications": [
          "Important setting to inspect: n_estimators."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Gradient Boosting in Real Applications",
        "story": "Ishaan finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: High predictive accuracy. Watch-outs: Can overfit without regularization, Sequential training is slower than bagging, Needs careful tuning. Common mistakes: Using too many stages, Ignoring validation curves, Setting learning rate too high.",
        "realtimeExample": "A deep tree can explain training data beautifully and still fail on new messy cases.",
        "realtimeApplications": [
          "Tabular regression",
          "Ranking",
          "Classification baselines. Tree thinking is common in risk tools",
          "diagnostics",
          "operations rules",
          "and tabular ML baselines."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Gradient Boosting?",
        "options": [
          "Use it for strong tabular prediction and to teach stage-wise residual correction. Focus on the visible input-to-outpu...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it for strong tabular prediction and to teach stage-wise residual correction. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Gradient Boosting?",
        "options": [
          "Tabular regression",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Gradient Boosting is Tabular regression."
      },
      {
        "question": "Why does the formula matter for Gradient Boosting?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Gradient Boosting?",
        "options": [
          "n_estimators",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is n_estimators."
      },
      {
        "question": "What is a common mistake when using Gradient Boosting?",
        "options": [
          "Using too many stages",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Using too many stages."
      }
    ]
  },
  "/ml/ensemble/stacking": {
    "algorithmId": "ensemble-learning-combining-models-stacking",
    "sourceTitle": "Stacking",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Stacking: The Pattern Workshop",
        "story": "Diya faces a real problem: a team has data and needs a careful way to turn it into useful evidence. Stacking enters the story because it gives the team a repeatable method for learning from examples.",
        "simpleExplanation": "Stacking is a combining models concept in ensemble learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Stacking transforms observations into a signal, estimate, representation, or decision.",
        "realtimeExample": "A practical ML workflow uses Stacking as one candidate method, then compares it with baselines.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Stacking feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Stacking as a Simple Picture",
        "story": "It is like sorting a messy project table into labeled trays so each clue has a job.",
        "simpleExplanation": "Convert raw observations into a structured signal, fit it, and verify that it generalizes. The method works best when the input, objective, validation, and limitations are all clear.",
        "realtimeExample": "In a classroom demo, students can use small datasets where students define inputs, outputs, and a success metric to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Stacking Works Step by Step",
        "story": "Diya slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Define inputs and objective 2. Apply preprocessing 3. Fit or compute the model 4. Inspect intermediate output 5. Evaluate on held-out data",
        "realtimeExample": "A team prepares data, fits the method, checks intermediate outputs, validates results, and documents limits.",
        "realtimeApplications": [
          "The mechanics are inputs",
          "objective",
          "preprocessing",
          "model behavior",
          "and evaluation."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Stacking",
        "story": "The math is a scoreboard for Diya. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation defines what the method considers a good solution.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Stacking in Real Applications",
        "story": "Diya finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "A method can be mathematically correct but still solve the wrong real-world problem.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. This kind of thinking supports experimentation",
          "analytics",
          "automation",
          "and responsible ML delivery."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Stacking?",
        "options": [
          "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior b...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to extract a repeatable signal and test it on unseen examples. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Stacking?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Stacking is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Stacking?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Stacking?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Stacking?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/probabilistic/bayesian-linear-regression": {
    "algorithmId": "supervised-learning-regression-bayesian-linear-regression",
    "sourceTitle": "Bayesian Linear Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Bayesian Linear Regression: The Number Predictor",
        "story": "Asha faces a real problem: a neighborhood shop wants to estimate tomorrow's demand before ordering supplies. Bayesian Linear Regression enters the story because it learns how clues connect to a numeric answer.",
        "simpleExplanation": "Bayesian Linear Regression is a regression concept in supervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Bayesian Linear Regression predicts a number, not a label. It studies past examples and learns how inputs push the output up or down.",
        "realtimeExample": "A planning system forecasts sales, traffic, energy use, or delivery time from historical signals.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Bayesian Linear Regression feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Bayesian Linear Regression as a Simple Picture",
        "story": "Picture a smooth measuring tape stretched across scattered dots. The tape is useful only if it stays close to most dots.",
        "simpleExplanation": "Imagine balancing a line or curve through a cloud of points so the total residual error is small. The model is trying to make prediction errors smaller while staying simple enough to trust.",
        "realtimeExample": "In a classroom demo, students can use prices, temperatures, house sizes, or study hours drawn as input-output pairs to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Bayesian Linear Regression Works Step by Step",
        "story": "Asha slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Prepare numeric features and targets 2. Compute predictions 3. Measure residual loss 4. Update parameters 5. Validate on unseen points",
        "realtimeExample": "A team prepares numeric features, trains the model, checks residuals, and tests whether errors stay reasonable on new days.",
        "realtimeApplications": [
          "The important mechanics are feature quality",
          "target definition",
          "residual error",
          "and validation on unseen examples."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Bayesian Linear Regression",
        "story": "The math is a scoreboard for Asha. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "P(theta|D) = P(D|theta)P(theta) / P(D). Posterior belief is proportional to likelihood times prior belief.",
        "realtimeExample": "The equation is a promise: convert inputs into a predicted number, then measure how far that number is from reality.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Bayesian Linear Regression in Real Applications",
        "story": "Asha finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Strong, interpretable baseline. Watch-outs: Misses unmodelled nonlinear structure, Outliers can dominate common losses, Correlation is not causation. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "If a festival, storm, or holiday changes behavior, the model can look confident while being wrong.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Jobs that use this thinking include demand planning",
          "pricing",
          "forecasting",
          "and operations analytics."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Bayesian Linear Regression?",
        "options": [
          "Use it to estimate a continuous outcome and explain how features move that estimate. Focus on the visible input-to-ou...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to estimate a continuous outcome and explain how features move that estimate. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Bayesian Linear Regression?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Bayesian Linear Regression is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Bayesian Linear Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Bayesian Linear Regression?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Bayesian Linear Regression?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/probabilistic/gaussian-process-regression": {
    "algorithmId": "supervised-learning-regression-gaussian-process-regression",
    "sourceTitle": "Gaussian Process Regression",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Gaussian Process Regression: The Number Predictor",
        "story": "Asha faces a real problem: a neighborhood shop wants to estimate tomorrow's demand before ordering supplies. Gaussian Process Regression enters the story because it learns how clues connect to a numeric answer.",
        "simpleExplanation": "Gaussian Process Regression is a regression concept in supervised learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Gaussian Process Regression predicts a number, not a label. It studies past examples and learns how inputs push the output up or down.",
        "realtimeExample": "A planning system forecasts sales, traffic, energy use, or delivery time from historical signals.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Gaussian Process Regression feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Gaussian Process Regression as a Simple Picture",
        "story": "Picture a smooth measuring tape stretched across scattered dots. The tape is useful only if it stays close to most dots.",
        "simpleExplanation": "Imagine balancing a line or curve through a cloud of points so the total residual error is small. The model is trying to make prediction errors smaller while staying simple enough to trust.",
        "realtimeExample": "In a classroom demo, students can use prices, temperatures, house sizes, or study hours drawn as input-output pairs to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Gaussian Process Regression Works Step by Step",
        "story": "Asha slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Prepare numeric features and targets 2. Compute predictions 3. Measure residual loss 4. Update parameters 5. Validate on unseen points",
        "realtimeExample": "A team prepares numeric features, trains the model, checks residuals, and tests whether errors stay reasonable on new days.",
        "realtimeApplications": [
          "The important mechanics are feature quality",
          "target definition",
          "residual error",
          "and validation on unseen examples."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Gaussian Process Regression",
        "story": "The math is a scoreboard for Asha. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "y_hat = f(x; theta),   J(theta) = (1/n) sum L(y_hat_i, y_i). Training chooses parameters that minimize prediction error, optionally with regularization.",
        "realtimeExample": "The equation is a promise: convert inputs into a predicted number, then measure how far that number is from reality.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Gaussian Process Regression in Real Applications",
        "story": "Asha finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Strong, interpretable baseline. Watch-outs: Misses unmodelled nonlinear structure, Outliers can dominate common losses, Correlation is not causation. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "If a festival, storm, or holiday changes behavior, the model can look confident while being wrong.",
        "realtimeApplications": [
          "Forecasting and decision support",
          "Pattern discovery",
          "Risk-aware automation. Jobs that use this thinking include demand planning",
          "pricing",
          "forecasting",
          "and operations analytics."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Gaussian Process Regression?",
        "options": [
          "Use it to estimate a continuous outcome and explain how features move that estimate. Focus on the visible input-to-ou...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to estimate a continuous outcome and explain how features move that estimate. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Gaussian Process Regression?",
        "options": [
          "Forecasting and decision support",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Gaussian Process Regression is Forecasting and decision support."
      },
      {
        "question": "Why does the formula matter for Gaussian Process Regression?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Gaussian Process Regression?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Gaussian Process Regression?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  },
  "/ml/probabilistic/hidden-markov-model": {
    "algorithmId": "probabilistic-bayesian-learning-probability-models-hidden-markov-models",
    "sourceTitle": "Hidden Markov Models",
    "lessons": [
      {
        "pageNumber": 1,
        "title": "Hidden Markov Models: The Time Clue Keeper",
        "story": "Arjun faces a real problem: the answer depends on what happened before, not just what is happening now. Hidden Markov Models enters the story because it models ordered information across time or tokens.",
        "simpleExplanation": "Hidden Markov Models is a probability models concept in probabilistic & bayesian learning that transforms observed data into a useful representation, estimate, or decision. In kid-simple words, Hidden Markov Models studies sequences. Earlier clues can change the meaning of later clues.",
        "realtimeExample": "A monitoring system forecasts demand, detects machine trouble, or understands language from ordered signals.",
        "realtimeApplications": [
          "Language understanding",
          "Sequence forecasting",
          "Document retrieval"
        ],
        "teacherTip": "Start by naming the evidence, the decision, and the cost of being wrong. That makes Hidden Markov Models feel practical instead of abstract."
      },
      {
        "pageNumber": 2,
        "title": "Hidden Markov Models as a Simple Picture",
        "story": "It is like reading a story: the current sentence makes more sense when you remember the previous sentences.",
        "simpleExplanation": "Carry a compact state forward so the current output can use earlier context. The model keeps, updates, or attends to context so the next prediction uses history.",
        "realtimeExample": "In a classroom demo, students can use daily temperatures, word cards, music notes, or sensor readings arranged in order to see the same idea without heavy math.",
        "realtimeApplications": [
          "Real teams use this style of thinking for Language understanding",
          "Sequence forecasting",
          "Document retrieval."
        ],
        "teacherTip": "Ask the learner to draw the idea first. A good sketch often explains the algorithm before code does."
      },
      {
        "pageNumber": 3,
        "title": "How Hidden Markov Models Works Step by Step",
        "story": "Arjun slows the problem down and follows a repeatable recipe instead of guessing.",
        "simpleExplanation": "1. Encode the input 2. Run the forward pass 3. Compute task loss 4. Backpropagate gradients 5. Update weights and validate",
        "realtimeExample": "A team builds time windows, prevents future leakage, validates by time order, and checks drift.",
        "realtimeApplications": [
          "The mechanics are sequence order",
          "hidden state or context",
          "window length",
          "leakage control",
          "and forecast error."
        ],
        "teacherTip": "Every step should change either the data view, the model state, or the confidence. If nothing changes, check the pipeline."
      },
      {
        "pageNumber": 4,
        "title": "The Tiny Math Behind Hidden Markov Models",
        "story": "The math is a scoreboard for Arjun. It does not replace thinking; it keeps the thinking honest.",
        "simpleExplanation": "theta* = arg min_theta J(theta; X, y). The objective formalizes what a good solution means for this method.",
        "realtimeExample": "The equation updates memory or attention from one step to the next, then predicts from that context.",
        "realtimeApplications": [
          "Important setting to inspect: Capacity or complexity."
        ],
        "teacherTip": "Read the equation like a sentence: what is measured, what is compared, and what should become smaller or stronger?"
      },
      {
        "pageNumber": 5,
        "title": "Hidden Markov Models in Real Applications",
        "story": "Arjun finally ships the idea carefully: first on practice data, then validation data, then a small real trial.",
        "simpleExplanation": "Superpower: Reusable mathematical objective. Watch-outs: Performance depends on data quality, Hyperparameters affect behavior, Distribution shift can invalidate results. Common mistakes: Evaluating on training data only, Ignoring preprocessing and data leakage, Tuning parameters before choosing the right metric.",
        "realtimeExample": "If future values leak into training, the model looks brilliant in practice and weak in real deployment.",
        "realtimeApplications": [
          "Language understanding",
          "Sequence forecasting",
          "Document retrieval. Sequence thinking powers forecasting",
          "language tools",
          "speech",
          "sensors",
          "finance",
          "and operations monitoring."
        ],
        "teacherTip": "Expert ML is humble ML: compare against a baseline, test on fresh examples, explain limits, and improve only when evidence says so."
      }
    ],
    "quiz": [
      {
        "question": "What is the main job of Hidden Markov Models?",
        "options": [
          "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the...",
          "To randomly change answers until something looks exciting",
          "To delete training data before learning begins",
          "To avoid checking results on new examples"
        ],
        "answer": 0,
        "explanation": "Use it to learn layered representations for complex inputs. Focus on the visible input-to-output behavior before the notation."
      },
      {
        "question": "Which real-world use best matches Hidden Markov Models?",
        "options": [
          "Language understanding",
          "Choosing app colors without looking at data",
          "Making labels disappear from a supervised dataset",
          "Replacing validation with guessing"
        ],
        "answer": 0,
        "explanation": "One practical use of Hidden Markov Models is Language understanding."
      },
      {
        "question": "Why does the formula matter for Hidden Markov Models?",
        "options": [
          "It defines the signal or objective the algorithm follows",
          "It is only decoration and never affects learning",
          "It proves every dataset will be perfect",
          "It removes the need for preprocessing"
        ],
        "answer": 0,
        "explanation": "The formula tells the computer what signal, error, distance, probability, or decision rule to optimize."
      },
      {
        "question": "Which setting should a careful learner inspect for Hidden Markov Models?",
        "options": [
          "Capacity or complexity",
          "The phone wallpaper",
          "A secret answer key hidden in test data",
          "A random number chosen after seeing the final score"
        ],
        "answer": 0,
        "explanation": "A useful setting to inspect is Capacity or complexity."
      },
      {
        "question": "What is a common mistake when using Hidden Markov Models?",
        "options": [
          "Evaluating on training data only",
          "Testing on unseen data before deployment",
          "Explaining predictions to users",
          "Comparing models with the right metric"
        ],
        "answer": 0,
        "explanation": "A common mistake is Evaluating on training data only."
      }
    ]
  }
};
