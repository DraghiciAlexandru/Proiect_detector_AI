import javascriptQuestions from './data/javascript-questions.json';
import reactQuestions from './data/react-questions.json';
import pythonQuestions from './data/python-questions.json';
import nodejsQuestions from './data/nodejs-questions.json';
import aiMlQuestions from './data/ai-ml-questions.json';
import devopsQuestions from './data/devops-questions.json';
import cybersecurityQuestions from './data/cybersecurity-questions.json';

export const questions = {
  [javascriptQuestions.domain]: javascriptQuestions.levels,
  [reactQuestions.domain]: reactQuestions.levels,
  [pythonQuestions.domain]: pythonQuestions.levels,
  [nodejsQuestions.domain]: nodejsQuestions.levels,
  [aiMlQuestions.domain]: aiMlQuestions.levels,
  [devopsQuestions.domain]: devopsQuestions.levels,
  [cybersecurityQuestions.domain]: cybersecurityQuestions.levels
};