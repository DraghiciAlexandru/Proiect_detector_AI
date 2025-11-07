import javascriptQuestions from './javascript-questions.json';
import reactQuestions from './react-questions.json';
import pythonQuestions from './python-questions.json';
import nodejsQuestions from './nodejs-questions.json';
import aiMlQuestions from './ai-ml-questions.json';
import devopsQuestions from './devops-questions.json';
import cybersecurityQuestions from './cybersecurity-questions.json';

const questions = {
  [javascriptQuestions.domain]: javascriptQuestions.levels,
  [reactQuestions.domain]: reactQuestions.levels,
  [pythonQuestions.domain]: pythonQuestions.levels,
  [nodejsQuestions.domain]: nodejsQuestions.levels,
  [aiMlQuestions.domain]: aiMlQuestions.levels,
  [devopsQuestions.domain]: devopsQuestions.levels,
  [cybersecurityQuestions.domain]: cybersecurityQuestions.levels
};

export default questions;