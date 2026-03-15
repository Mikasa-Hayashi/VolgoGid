import { headerStyles } from '@/src/theme/headerStyles'; // Проверь путь
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import {
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeContext'; // Проверь путь

// --- Временные моковые данные для квиза ---
// Позже мы сможем вынести их в наш JSON, чтобы переводить вопросы и ответы
const MOCK_QUIZ = [
  { question: "К какому событию было приурочено открытие памятника первому трамваю в Волгограде?", options: ["К 50‑летию пуска трамвайного движения в городе.", "К 100‑летию пуска трамвайного движения в городе.", "К юбилею Комсомольского сада, где установлен памятник.", "К годовщине Сталинградской битвы."], correctIndex: 1 },
  { question: "Какова высота монумента?", options: ["50 метров", "85 метров", "100 метров", "120 метров"], correctIndex: 1 },
  { question: "Кто был главным скульптором?", options: ["Церетели", "Мухина", "Вучетич", "Эрзя"], correctIndex: 2 },
  { question: "Из какого материала сделана основная часть?", options: ["Бронза", "Мрамор", "Сталь", "Железобетон"], correctIndex: 3 },
  { question: "Сколько ступеней ведут к монументу?", options: ["100", "200", "250", "300"], correctIndex: 1 },
];

// --- Хедер (адаптирован из твоего MenuHeader) ---
const QuizHeader = ({ onBack, title, colors, t }: { onBack(): void; title: string; colors: any; t: any }) => (
  <SafeAreaView edges={['top']} style={[headerStyles.headerContainer, { backgroundColor: colors.background }]}>
    <View style={headerStyles.headerContent}>
      <TouchableOpacity onPress={onBack} style={headerStyles.iconButton}>
        <Ionicons name="close" size={28} color={colors.text} />
      </TouchableOpacity>

      <Text style={[headerStyles.headerTitle, { color: colors.text, fontSize: 18, fontWeight: 'bold' }]}>
        {title}
      </Text>

      {/* Пустая вьюшка справа для баланса, так как настройки в квизе обычно не нужны */}
      <View style={{ width: 40 }} />
    </View>
  </SafeAreaView>
);

export default function QuizScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  
  // Получаем ID и название памятника из параметров роута
  // Например: router.push({ pathname: '/quiz', params: { id: '1', name: 'Родина-мать зовёт!' } })
  const { id, name } = useLocalSearchParams<{ id: string, name: string }>();

  // --- Состояния квиза ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = MOCK_QUIZ[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === MOCK_QUIZ.length - 1;

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    if (selectedOption === null) return; // Защита: нельзя нажать далее без ответа

    // Проверяем правильность
    if (selectedOption === currentQuestion.correctIndex) {
      setScore(prev => prev + 1);
    }

    // Идем дальше или завершаем
    if (isLastQuestion) {
      setIsFinished(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null); // Сбрасываем выбор для следующего вопроса
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  };

  // --- Экран результатов ---
  if (isFinished) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="trophy" size={80} color={colors.primary} style={{ marginBottom: 20 }} />
        <Text style={[styles.resultTitle, { color: colors.text }]}>Квиз завершен!</Text>
        <Text style={[styles.resultText, { color: colors.textMuted }]}>
          Твой результат: {score} из {MOCK_QUIZ.length}
        </Text>
        
        <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.primary, marginTop: 40, width: '100%' }]} onPress={handleBack}>
          <Text style={styles.nextButtonText}>Вернуться к памятнику</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={{ marginTop: 20 }} onPress={restartQuiz}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>Пройти еще раз</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Основной экран квиза ---
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <QuizHeader onBack={handleBack} title={name || "Квиз"} colors={colors} t={t} />

      <View style={styles.content}>
        {/* Прогресс */}
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          Вопрос {currentQuestionIndex + 1} из {MOCK_QUIZ.length}
        </Text>
        
        <View style={styles.progressBarBg}>
          <View style={[
            styles.progressBarFill, 
            { backgroundColor: colors.primary, width: `${((currentQuestionIndex + 1) / MOCK_QUIZ.length) * 100}%` }
          ]} />
        </View>

        {/* Вопрос */}
        <Text style={[styles.questionText, { color: colors.text }]}>
          {currentQuestion.question}
        </Text>

        {/* Варианты ответов */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  { borderColor: colors.border },
                  isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '20' } // '20' добавляет прозрачность
                ]}
                onPress={() => setSelectedOption(index)}
              >
                <View style={[
                  styles.radioCircle,
                  { borderColor: colors.textMuted },
                  isSelected && { borderColor: colors.primary, backgroundColor: colors.primary }
                ]}>
                  {isSelected && <View style={styles.innerRadio} />}
                </View>
                <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Кнопка Далее фиксируется внизу */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.nextButton, 
            { backgroundColor: selectedOption !== null ? colors.primary : colors.border }
          ]}
          disabled={selectedOption === null}
          onPress={handleNext}
        >
          <Text style={[
            styles.nextButtonText, 
            { color: selectedOption !== null ? 'black' : colors.textMuted }
          ]}>
            {isLastQuestion ? "Завершить" : "Далее"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 30,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  innerRadio: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: 'black', // или белый, в зависимости от твоей темы
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: 40, // Отступ для челки на айфонах
    borderTopWidth: 1,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Стили экрана результатов
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 18,
  }
});