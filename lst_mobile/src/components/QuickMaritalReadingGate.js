import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { quickMaritalArticles } from '../data/quickMaritalReading';
import AppIcon from './AppIcon';

const QUIZ_TIME_SECONDS = 5 * 60;

export default function QuickMaritalReadingGate({ theme, articles: databaseArticles = [], useFallback = false, onComplete }) {
  const articles = databaseArticles.length ? databaseArticles : (useFallback ? quickMaritalArticles : []);
  const [articleIndex, setArticleIndex] = useState(0);
  const [stage, setStage] = useState('reading');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [latestScore, setLatestScore] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(QUIZ_TIME_SECONDS);
  const article = articles[articleIndex];

  useEffect(() => {
    if (stage !== 'quiz') return undefined;

    if (remainingSeconds <= 0) {
      const score = article.questions.reduce(
        (total, question, index) => total + (answers[index] === question.correctIndex ? 1 : 0),
        0,
      );
      setLatestScore(score);
      setStage('failed');
      Alert.alert('Time is up', `The ${article.durationMinutes || 5}-minute quiz has ended. Review the article and try again.`);
      return undefined;
    }

    const timer = setInterval(() => {
      setRemainingSeconds(current => current - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, remainingSeconds, answers, article.questions]);

  const beginQuiz = () => {
    setAnswers([]);
    setQuestionIndex(0);
    setLatestScore(null);
    setRemainingSeconds((article.durationMinutes || 5) * 60);
    setStage('quiz');
  };

  const answerQuestion = optionIndex => {
    const nextAnswers = [...answers];
    nextAnswers[questionIndex] = optionIndex;
    setAnswers(nextAnswers);
  };

  const finishQuiz = () => {
    if (answers.length !== article.questions.length || answers.some(answer => answer === undefined)) {
      Alert.alert('Complete the quiz', 'Please answer every question before submitting.');
      return;
    }

    const score = article.questions.reduce(
      (total, question, index) => total + (answers[index] === question.correctIndex ? 1 : 0),
      0,
    );

    const requiredScore = Math.ceil(article.questions.length * ((article.passingScore || 70) / 100));
    if (score < requiredScore) {
      setLatestScore(score);
      setStage('failed');
      return;
    }

    if (articleIndex === articles.length - 1) {
      onComplete();
      return;
    }

    setArticleIndex(current => current + 1);
    setStage('reading');
    setAnswers([]);
    setQuestionIndex(0);
  };

  if (stage === 'reading' || stage === 'failed') {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
        <View style={styles.readingMeta}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>READING {articleIndex + 1} OF {articles.length}</Text>
          <Text style={[styles.progress, { color: theme.secondaryText }]}>{article.passingScore || 70}% required</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{article.title}</Text>
        {stage === 'failed' ? (
          <View style={[styles.notice, { backgroundColor: theme.primarySoft }]}>
            <AppIcon name="book-open" size={17} color={theme.primary} />
            <Text style={[styles.noticeText, { color: theme.primary }]}>
              Your score was {latestScore}/{article.questions.length}. You need at least {Math.ceil(article.questions.length * ((article.passingScore || 70) / 100))}/{article.questions.length}. Please read the article carefully before trying again.
            </Text>
          </View>
        ) : null}
        <Text style={[styles.articleText, { color: theme.text }]}>{article.content}</Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={beginQuiz}>
          <Text style={styles.primaryButtonText}>Continue to quiz</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (stage === 'quiz') {
    const question = article.questions[questionIndex];
    const selectedAnswer = answers[questionIndex];
    const isLastQuestion = questionIndex === article.questions.length - 1;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timerText = `${minutes}:${String(seconds).padStart(2, '0')}`;
    const timerColor = remainingSeconds <= 60 ? '#C0392B' : theme.primary;

    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>QUIZ · READING {articleIndex + 1} OF {articles.length}</Text>
        <View style={styles.quizMeta}>
          <Text style={[styles.progress, { color: theme.secondaryText }]}>
            Question {questionIndex + 1} of {article.questions.length}
          </Text>
          <View style={[styles.timer, { backgroundColor: remainingSeconds <= 60 ? '#FDEDEC' : theme.primarySoft }]}>
            <AppIcon name="clock" size={14} color={timerColor} />
            <Text style={[styles.timerText, { color: timerColor }]}>{timerText}</Text>
          </View>
        </View>
        <Text style={[styles.question, { color: theme.text }]}>{question.question}</Text>
        {question.options.map((option, index) => {
          const selected = selectedAnswer === index;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.option,
                {
                  backgroundColor: selected ? theme.primarySoft : theme.card,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => answerQuestion(index)}
            >
              <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.border }]}>
                {selected ? <View style={[styles.radioInner, { backgroundColor: theme.primary }]} /> : null}
              </View>
              <Text style={[styles.optionText, { color: theme.text }]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={styles.actions}>
          {questionIndex > 0 ? (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.border }]}
              onPress={() => setQuestionIndex(current => current - 1)}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Back</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            disabled={selectedAnswer === undefined}
            style={[
              styles.primaryButton,
              styles.nextButton,
              { backgroundColor: theme.primary, opacity: selectedAnswer === undefined ? 0.45 : 1 },
            ]}
            onPress={isLastQuestion ? finishQuiz : () => setQuestionIndex(current => current + 1)}
          >
            <Text style={styles.primaryButtonText}>{isLastQuestion ? 'Submit quiz' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  title: { fontSize: 23, lineHeight: 29, fontWeight: '700', marginTop: 8 },
  articleTitle: { fontSize: 17, lineHeight: 24, fontWeight: '700', marginTop: 24 },
  description: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  prompt: { fontSize: 15, fontWeight: '700', marginTop: 30, marginBottom: 14 },
  progress: { fontSize: 12, fontWeight: '700', marginTop: 10 },
  quizMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  readingMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  timerText: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  question: { fontSize: 19, lineHeight: 27, fontWeight: '700', marginTop: 28, marginBottom: 8 },
  option: { minHeight: 54, flexDirection: 'row', alignItems: 'center', padding: 13, borderWidth: 1, borderRadius: 15, marginTop: 10 },
  optionText: { flex: 1, fontSize: 13, lineHeight: 19 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: 13, marginTop: 18 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  articleText: { fontSize: 14, lineHeight: 23, marginTop: 20 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 25 },
  primaryButton: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  secondaryButton: { minHeight: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  secondaryButtonText: { fontSize: 13, fontWeight: '700' },
  readButton: { marginTop: 10 },
  nextButton: { flex: 1, marginTop: 0 },
});
